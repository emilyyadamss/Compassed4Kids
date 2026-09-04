/* Supabase persistence. Each kid/activity/completion is stored as its existing
   camelCase object in a jsonb `data` column, keyed by the id the app already
   gave it — so model.js stays the single source of truth for shape, and this
   file only worries about which rows belong to which family account. */

import { supabase } from './supabaseClient.js'
import { DEFAULT_SETTINGS, migrateKid, migrateActivity } from './model.js'

function orThrow(res) {
  if (res.error) throw res.error
  return res
}

export async function fetchState(userId) {
  const [kidsRes, activitiesRes, completionsRes, settingsRes] = await Promise.all([
    supabase.from('kids').select('data').eq('user_id', userId),
    supabase.from('activities').select('data').eq('user_id', userId),
    supabase.from('completions').select('data').eq('user_id', userId),
    supabase.from('settings').select('data').eq('user_id', userId).maybeSingle(),
  ])
  ;[kidsRes, activitiesRes, completionsRes, settingsRes].forEach(orThrow)

  return {
    kids: (kidsRes.data || []).map((r) => migrateKid(r.data)),
    activities: (activitiesRes.data || []).map((r, i) => migrateActivity(r.data, i)),
    completions: (completionsRes.data || []).map((r) => r.data),
    settings: { ...DEFAULT_SETTINGS, ...(settingsRes.data?.data || {}) },
  }
}

export const putKid = (userId, kid) =>
  supabase.from('kids').upsert({ id: kid.id, user_id: userId, data: kid }).then(orThrow)

export const removeKid = (id) =>
  supabase.from('kids').delete().eq('id', id).then(orThrow)

export const putActivity = (userId, activity) =>
  supabase.from('activities')
    .upsert({ id: activity.id, user_id: userId, kid_id: activity.kidId, data: activity })
    .then(orThrow)

export const removeActivity = (id) =>
  supabase.from('activities').delete().eq('id', id).then(orThrow)

export const putCompletion = (userId, completion) =>
  supabase.from('completions')
    .upsert({
      id: completion.id,
      user_id: userId,
      kid_id: completion.kidId,
      activity_id: completion.activityId,
      data: completion,
    })
    .then(orThrow)

export const removeCompletion = (id) =>
  supabase.from('completions').delete().eq('id', id).then(orThrow)

export const putSettings = (userId, settings) =>
  supabase.from('settings').upsert({ user_id: userId, data: settings }).then(orThrow)

/* Live check-offs. This is what makes the parent side a notification rather
   than a report: the kid taps on the iPad in the kitchen, and the row arrives
   on the parent's phone a moment later without anyone refreshing anything.
   Row level security applies to realtime too, so the filter below is a
   narrowing, not the thing keeping other families out.

   Returns an unsubscribe function. */
export function subscribeToCompletions(userId, { onInsert, onDelete }) {
  const channel = supabase
    .channel(`completions:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'completions', filter: `user_id=eq.${userId}` },
      (payload) => onInsert?.(payload.new?.data),
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'completions', filter: `user_id=eq.${userId}` },
      (payload) => onDelete?.(payload.old?.id),
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

/** Wholesale swap — used by "load a sample family" and "clear everything". */
export async function replaceData(userId, { kids, activities, completions }) {
  orThrow(await supabase.from('completions').delete().eq('user_id', userId))
  orThrow(await supabase.from('activities').delete().eq('user_id', userId))
  orThrow(await supabase.from('kids').delete().eq('user_id', userId))

  // Ordered by dependency: activities reference kids, completions reference both.
  if (kids.length) {
    orThrow(await supabase.from('kids').insert(kids.map((k) => ({ id: k.id, user_id: userId, data: k }))))
  }
  if (activities.length) {
    orThrow(await supabase.from('activities').insert(
      activities.map((a) => ({ id: a.id, user_id: userId, kid_id: a.kidId, data: a })),
    ))
  }
  if (completions.length) {
    orThrow(await supabase.from('completions').insert(
      completions.map((c) => ({ id: c.id, user_id: userId, kid_id: c.kidId, activity_id: c.activityId, data: c })),
    ))
  }
}

/** Full backup restore — also replaces settings. */
export async function replaceAll(userId, { kids, activities, completions, settings }) {
  await replaceData(userId, { kids, activities, completions })
  await putSettings(userId, settings)
}
