/* The shapes this app saves, and the small vocabulary around them.

   Three records, and deliberately no more:

     kid        — one child. Owns a color and an avatar for life, so a kid is
                  recognisable at a glance anywhere in the app.
     activity   — one recurring thing that kid is expected to do, on named
                  weekdays: homework on school days, Kumon every day, 20
                  minutes of reading every night.
     completion — one day's proof that an activity happened. This is also the
                  parent's notification: the feed is nothing but completions,
                  newest first, so what a parent sees is exactly what the kid
                  did, never a separate thing that can drift out of sync.

   There is no scoring engine here, on purpose. An elementary schooler's day is
   a short list with checkboxes, and the honest answer to "did it happen" is
   yes or no. */

import { normaliseActivityIcon, normaliseAvatar, ACTIVITY_ICON_CHOICES, AVATAR_CHOICES } from './icons.jsx'
import { weekdayOf } from './date.js'

export { ACTIVITY_ICON_CHOICES, AVATAR_CHOICES }

/* Eight categorical slots, in fixed order. A kid keeps their slot for life —
   color follows the child, never their position in a list. */
export const COLOR_SLOTS = [
  { slot: 1, name: 'Blue' },
  { slot: 2, name: 'Orange' },
  { slot: 3, name: 'Teal' },
  { slot: 4, name: 'Amber' },
  { slot: 5, name: 'Pink' },
  { slot: 6, name: 'Green' },
  { slot: 7, name: 'Purple' },
  { slot: 8, name: 'Red' },
]

export const colorVar = (slot) => `var(--series-${((Number(slot) || 1) - 1) % 8 + 1})`

/* ------------------------------------------------------------------ days */

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
export const SCHOOL_DAYS = [1, 2, 3, 4, 5]
export const WEEKENDS = [0, 6]

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function normaliseDays(days) {
  const set = new Set((Array.isArray(days) ? days : EVERY_DAY).map(Number).filter((d) => d >= 0 && d <= 6))
  return set.size ? [...set].sort((a, b) => a - b) : [...EVERY_DAY]
}

const sameDays = (a, b) => a.length === b.length && a.every((d, i) => d === b[i])

/** "Every day" / "School days" / "Weekends" / "Mon, Wed, Fri" */
export function daysLabel(days) {
  const d = normaliseDays(days)
  if (sameDays(d, EVERY_DAY)) return 'Every day'
  if (sameDays(d, SCHOOL_DAYS)) return 'School days'
  if (sameDays(d, WEEKENDS)) return 'Weekends'
  return d.map((n) => DAY_SHORT[n]).join(', ')
}

/** Is this activity expected on this day at all? Nothing is "missed" on a day
    it was never asked for — Kumon on a Sunday is only late if Sunday is one of
    the days it was set for. */
export const isScheduled = (activity, dateKey) =>
  normaliseDays(activity.days).includes(weekdayOf(dateKey))

/* -------------------------------------------------------------- measures */

/* How an activity is counted. `done` is the default and the point of the app:
   most of what a nine-year-old owes the day is a yes/no. The numeric measures
   exist because "20 minutes of reading" and "2 Kumon worksheets" are the two
   things families actually count. */
export const MEASURES = [
  { id: 'done',       label: 'Just check it off', one: '',          many: '',           step: 1,  prompt: '' },
  { id: 'minutes',    label: 'Minutes',           one: 'minute',    many: 'minutes',    step: 5,  prompt: 'How many minutes?' },
  { id: 'pages',      label: 'Pages',             one: 'page',      many: 'pages',      step: 5,  prompt: 'How many pages?' },
  { id: 'worksheets', label: 'Worksheets',        one: 'worksheet', many: 'worksheets', step: 1,  prompt: 'How many worksheets?' },
  { id: 'problems',   label: 'Problems',          one: 'problem',   many: 'problems',   step: 5,  prompt: 'How many problems?' },
  { id: 'chapters',   label: 'Chapters',          one: 'chapter',   many: 'chapters',   step: 1,  prompt: 'How many chapters?' },
]

export const measureFor = (activity) =>
  MEASURES.find((m) => m.id === activity?.measure) || MEASURES[0]

export const isCounted = (activity) => measureFor(activity).id !== 'done'

export function formatAmount(value) {
  const n = Number(value) || 0
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function measureWord(value, measure) {
  if (!measure.many) return ''
  return Math.abs(Number(value)) === 1 ? measure.one : measure.many
}

/** "20 minutes", or "" for a plain check-it-off activity. */
export function withMeasure(value, measure) {
  if (!measure.many) return ''
  return `${formatAmount(value)} ${measureWord(value, measure)}`
}

/* ------------------------------------------------------------- templates */

/* What the "add an activity" screen offers first. A parent setting this up on
   a Sunday night should be able to tap four times and be done. */
export const ACTIVITY_TEMPLATES = [
  { name: 'Homework',       icon: 'homework', measure: 'done',       target: 0,  days: SCHOOL_DAYS },
  { name: 'Kumon',          icon: 'kumon',    measure: 'worksheets', target: 2,  days: EVERY_DAY },
  { name: 'Reading',        icon: 'reading',  measure: 'minutes',    target: 20, days: EVERY_DAY },
  { name: 'Music practice', icon: 'piano',    measure: 'minutes',    target: 30, days: SCHOOL_DAYS },
  { name: 'Spelling',       icon: 'spelling', measure: 'done',       target: 0,  days: SCHOOL_DAYS },
  { name: 'Chores',         icon: 'tidy',     measure: 'done',       target: 0,  days: EVERY_DAY },
]

/* ------------------------------------------------------------ constructors */

export function newKid(index = 0) {
  return {
    id: crypto.randomUUID(),
    name: '',
    grade: '',
    avatar: AVATAR_CHOICES[index % AVATAR_CHOICES.length],
    colorSlot: (index % 8) + 1,
    createdAt: new Date().toISOString(),
  }
}

export function migrateKid(kid) {
  return {
    ...kid,
    name: String(kid.name || '').trim(),
    avatar: normaliseAvatar(kid.avatar),
    colorSlot: Number(kid.colorSlot) || 1,
  }
}

export function newActivity(kidId, template = {}, order = 0) {
  return {
    id: crypto.randomUUID(),
    kidId,
    name: template.name || '',
    icon: normaliseActivityIcon(template.icon),
    measure: template.measure || 'done',
    target: Math.max(0, Number(template.target) || 0),
    days: normaliseDays(template.days),
    description: template.description || '',
    quiz: template.quiz === true,
    questions: normaliseQuestions(template.questions),
    questionsOnly: template.questionsOnly === true,
    active: true,
    order,
    createdAt: new Date().toISOString(),
  }
}

export function migrateActivity(activity, index = 0) {
  return {
    ...activity,
    name: String(activity.name || '').trim(),
    icon: normaliseActivityIcon(activity.icon),
    measure: measureFor(activity).id,
    target: Math.max(0, Number(activity.target) || 0),
    days: normaliseDays(activity.days),
    description: String(activity.description || '').trim(),
    // Off unless a parent said otherwise, so upgrading the app never starts
    // quizzing a child who was not being quizzed yesterday.
    quiz: activity.quiz === true,
    questions: normaliseQuestions(activity.questions),
    questionsOnly: activity.questionsOnly === true,
    active: activity.active !== false,
    order: Number.isFinite(activity.order) ? activity.order : index,
  }
}

export function newCompletion(kidId, activityId, dateKey, amount = 0, note = '', quiz = null) {
  return {
    id: crypto.randomUUID(),
    kidId,
    activityId,
    date: dateKey,
    amount: Math.max(0, Number(amount) || 0),
    /* What the child said they did. Only asked for on quizzed activities, and
       it is what the questions get written from — so it is part of the record
       a parent reads, not scratch input. */
    note: String(note || '').trim(),
    quiz: quiz || null,
    completedAt: new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ order */

export const isActive = (a) => a.active !== false

/** Activities in the order a parent arranged them, oldest tiebreak. */
export const activityOrder = (a, b) =>
  (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || '').localeCompare(b.createdAt || '')

/** kidId → their active activities, in display order. */
export function indexActivities(activities) {
  const byKid = new Map()
  for (const a of activities) {
    if (!isActive(a)) continue
    let list = byKid.get(a.kidId)
    if (!list) { list = []; byKid.set(a.kidId, list) }
    list.push(a)
  }
  for (const list of byKid.values()) list.sort(activityOrder)
  return byKid
}

export const DEFAULT_SETTINGS = {
  theme: 'system',        // 'system' | 'light' | 'dark'
  parentPin: '',          // 4 digits, or '' for no lock on the grown-up side
  feedSeenAt: null,       // ISO stamp; any completion newer than this is unread
  behindAfterHour: 17,    // before this hour, "not yet" is just "not yet"
  celebrate: true,        // the little burst when a kid finishes their day
  quizzes: true,          // the master switch over every activity's own quiz flag
}

/* ------------------------------------------------------------------- quiz */

/* Whether finishing this activity should be followed by ten questions.

   Two switches, and both have to be on. The per-activity flag is the real
   decision — quizzing Reading is the point, quizzing Chores is nonsense — and
   the setting is a single lever a parent can pull on a bad week without
   unpicking every activity they set up. */
export const isQuizzed = (activity, settings = {}) =>
  activity?.quiz === true && settings.quizzes !== false

/* ------------------------------------------------- the parent's own questions

   A quiz is ten questions. By default Claude writes all ten from what the kid
   typed, which is the only way to ask about a chapter nobody has read yet.
   But a parent often knows exactly what they want asked — this week's spelling
   list, the seven times table, the three vocabulary words that keep coming
   back wrong — and no amount of describing that to a model beats writing the
   question out.

   So a parent can write their own. Theirs are asked first, always, word for
   word. Claude fills the rest of the ten, unless `questionsOnly` says not to
   bother — that is the override: ask mine and nothing else.

   These live on the activity in plain form, answer index included, which does
   mean a determined child with the developer tools open could read the key.
   That is the same bar as `parentPin`, which sits in the same downloaded blob.
   The questions Claude writes stay sealed because they can be — this key has
   to survive in a row the parent edits, and a lock the parent cannot open is
   not a feature. */

export const QUIZ_QUESTIONS = 10

export function newQuizQuestion() {
  return { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], answer: 0, because: '' }
}

/** Always four options and an answer that points at one of them, whatever was
    in the row. A question that came back malformed renders as a broken quiz. */
export function normaliseQuestions(list) {
  if (!Array.isArray(list)) return []
  return list.slice(0, QUIZ_QUESTIONS).map((q) => {
    const options = Array.from({ length: 4 }, (_, i) => String(q?.options?.[i] ?? '').trim())
    const answer = Number(q?.answer)
    return {
      id: q?.id || crypto.randomUUID(),
      question: String(q?.question || '').trim(),
      options,
      answer: Number.isInteger(answer) && answer >= 0 && answer <= 3 ? answer : 0,
      because: String(q?.because || '').trim(),
    }
  })
}

/** Has this one been finished? A half-typed question is not askable. */
export const isCompleteQuestion = (q) =>
  Boolean(q?.question?.trim()) && Array.isArray(q?.options) &&
  q.options.length === 4 && q.options.every((o) => o.trim().length > 0)

/** Has the parent started this row at all? Used to tell "not filled in yet"
    from "left blank", so an untouched row can be dropped on save instead of
    blocking it. */
export const isStartedQuestion = (q) =>
  Boolean(q?.question?.trim() || q?.because?.trim() || q?.options?.some((o) => o.trim()))

/** The parent's questions, ready to ask. */
export const ownQuestions = (activity) =>
  normaliseQuestions(activity?.questions).filter(isCompleteQuestion)

/** How many questions Claude is being asked for. Zero when the parent wrote
    the whole quiz, or told us to ask only theirs. */
export function generatedCount(activity) {
  const own = ownQuestions(activity).length
  if (own > 0 && activity?.questionsOnly === true) return 0
  return Math.max(0, QUIZ_QUESTIONS - own)
}

/** Does this quiz need the kid to say what they did? Only if something is
    being written from it — a fixed set of the parent's questions is ready
    before the child touches anything. */
export const quizNeedsNote = (activity) => generatedCount(activity) > 0

/** How many of ten, or null if this completion was never quizzed. */
export const quizScore = (completion) => {
  const quiz = completion?.quiz
  if (!quiz || !Number.isFinite(quiz.total) || quiz.total <= 0) return null
  return { score: Math.max(0, Number(quiz.score) || 0), total: quiz.total }
}
