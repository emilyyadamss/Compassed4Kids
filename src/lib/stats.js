/* Everything derived. Nothing in here is stored — a completion row is the only
   fact, and today's status, streaks, and the parent's feed are all read back
   out of those rows. That way a parent can never be shown a "done" that no kid
   actually produced. */

import { addDays, todayKey as todayKeyNow } from './date.js'
import { isScheduled, measureFor, isCounted } from './model.js'

/** activityId → Map(dateKey → completion). One completion per activity per day;
    a later one for the same day wins, so a re-log corrects rather than doubles. */
export function indexCompletions(completions) {
  const byActivity = new Map()
  for (const c of completions) {
    let days = byActivity.get(c.activityId)
    if (!days) { days = new Map(); byActivity.set(c.activityId, days) }
    const prev = days.get(c.date)
    if (!prev || (c.completedAt || '') > (prev.completedAt || '')) days.set(c.date, c)
  }
  return byActivity
}

export const daysFor = (byActivity, activityId) => byActivity.get(activityId) || new Map()

/* ------------------------------------------------------------ one activity */

/* `done` and `met` are deliberately separate. A kid who read for 10 of their 20
   minutes did the thing — the checkbox is theirs and the streak survives — and
   the shortfall shows as a number, not as a failure. Half credit beats a kid
   learning that the app calls them a liar. */
export function activityStatus(activity, dayMap, dateKey) {
  const entry = dayMap.get(dateKey) || null
  const target = Math.max(0, Number(activity.target) || 0)
  const amount = entry ? Math.max(0, Number(entry.amount) || 0) : 0
  return {
    scheduled: isScheduled(activity, dateKey),
    done: !!entry,
    entry,
    amount,
    target,
    counted: isCounted(activity),
    met: !!entry && (target <= 0 || amount >= target),
    pct: target > 0 ? Math.min(100, Math.round((amount / target) * 100)) : entry ? 100 : 0,
  }
}

/** Consecutive scheduled days, ending today, that this activity was done on.
    Today still being open never breaks a streak — only a finished day can. */
export function streakFor(activity, dayMap, today = todayKeyNow(), lookback = 400) {
  let streak = 0
  let cursor = today
  let isToday = true
  for (let i = 0; i < lookback; i++) {
    if (isScheduled(activity, cursor)) {
      if (dayMap.has(cursor)) streak++
      else if (!isToday) break
    }
    isToday = false
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Per-day marks for a strip of dates: what the last week actually looked like. */
export function dayMarks(activity, dayMap, dateKeys, today = todayKeyNow()) {
  return dateKeys.map((key) => {
    if (!isScheduled(activity, key)) return { key, mark: 'off' }
    if (dayMap.has(key)) return { key, mark: 'done' }
    if (key > today) return { key, mark: 'future' }
    if (key === today) return { key, mark: 'open' }
    return { key, mark: 'missed' }
  })
}

/* ----------------------------------------------------------------- one kid */

/** One kid's day: what was asked, what came back, and what's still open. */
export function kidDay(activities, byActivity, dateKey) {
  const due = activities.filter((a) => isScheduled(a, dateKey))
  const items = due.map((a) => ({ activity: a, status: activityStatus(a, daysFor(byActivity, a.id), dateKey) }))
  const done = items.filter((i) => i.status.done)
  return {
    items,
    total: due.length,
    done: done.length,
    remaining: items.filter((i) => !i.status.done),
    pct: due.length ? Math.round((done.length / due.length) * 100) : 0,
    complete: due.length > 0 && done.length === due.length,
    nothingDue: due.length === 0,
  }
}

/** Consecutive days this kid finished everything asked of them. Days with
    nothing scheduled are neutral — a free Saturday neither builds nor breaks. */
export function kidStreak(activities, byActivity, today = todayKeyNow(), lookback = 400) {
  let streak = 0
  let cursor = today
  let isToday = true
  for (let i = 0; i < lookback; i++) {
    const day = kidDay(activities, byActivity, cursor)
    if (!day.nothingDue) {
      if (day.complete) streak++
      else if (!isToday) break
    }
    isToday = false
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** The longest anyone in the family has going — for the one stat tile that
    should make a kid want to check the app. */
export function bestStreak(kids, byKid, byActivity, today = todayKeyNow()) {
  let best = { kid: null, streak: 0 }
  for (const kid of kids) {
    const streak = kidStreak(byKid.get(kid.id) || [], byActivity, today)
    if (streak > best.streak) best = { kid, streak }
  }
  return best
}

/* ------------------------------------------------------- the parent's feed */

/* The feed is the notification. Every row is a completion a kid produced,
   joined to who and what, newest first — nothing is generated on the parent's
   side, so there is nothing to fall out of step with the kid's screen. */
export function buildFeed(completions, kids, activities, { seenAt = null, limit = 200 } = {}) {
  const kidById = new Map(kids.map((k) => [k.id, k]))
  const actById = new Map(activities.map((a) => [a.id, a]))
  return completions
    .slice()
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
    .slice(0, limit)
    .map((c) => ({
      completion: c,
      kid: kidById.get(c.kidId) || null,
      activity: actById.get(c.activityId) || null,
      unread: !seenAt || (c.completedAt || '') > seenAt,
    }))
}

export function unreadCount(completions, seenAt) {
  if (!seenAt) return completions.length
  return completions.reduce((n, c) => n + ((c.completedAt || '') > seenAt ? 1 : 0), 0)
}

/* What a parent should actually be told about, beyond "it happened".

   Two kinds, and both are late rather than merely open: yesterday's misses are
   settled facts, and today's only count once the evening cutoff has passed.
   Ask before then and the answer is "the day isn't over" — which is the honest
   answer, and keeps this from being a list that nags at 3pm. */
export function needsAttention(kids, byKid, byActivity, today = todayKeyNow(), now = new Date(), settings = {}) {
  const cutoff = Number.isFinite(settings.behindAfterHour) ? settings.behindAfterHour : 17
  const evening = now.getHours() >= cutoff
  const yesterday = addDays(today, -1)
  const out = []

  for (const kid of kids) {
    const activities = byKid.get(kid.id) || []
    if (evening) {
      for (const { activity } of kidDay(activities, byActivity, today).remaining) {
        out.push({ kid, activity, when: 'today', date: today })
      }
    }
    for (const { activity } of kidDay(activities, byActivity, yesterday).remaining) {
      out.push({ kid, activity, when: 'yesterday', date: yesterday })
    }
  }
  return out
}

/** "Read 20 minutes" / "Finished Homework" — one line describing a completion,
    used in the feed and in toasts. */
export function completionLine(activity, completion) {
  if (!activity) return 'Finished something'
  const measure = measureFor(activity)
  const amount = Math.max(0, Number(completion?.amount) || 0)
  if (!measure.many || amount <= 0) return `Finished ${activity.name}`
  const word = Math.abs(amount) === 1 ? measure.one : measure.many
  return `${activity.name} — ${amount} ${word}`
}
