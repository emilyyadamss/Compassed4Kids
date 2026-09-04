/* Backup export/import. The family's data lives in Supabase, scoped to the
   signed-in account — see db.js. This file only handles the portable JSON
   backup: Settings → Export writes one, Import reads one back (via
   db.replaceAll, so a restore fully replaces the account's data). */

import { DEFAULT_SETTINGS, migrateKid, migrateActivity } from './model.js'

export function exportJSON(state) {
  return JSON.stringify(
    { app: 'Compassed for Kids', version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  )
}

export function parseImport(text) {
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed.kids) || !Array.isArray(parsed.activities)) {
    throw new Error('That file does not look like a Compassed for Kids backup.')
  }
  return {
    kids: parsed.kids.map(migrateKid),
    activities: parsed.activities.map(migrateActivity),
    completions: Array.isArray(parsed.completions) ? parsed.completions : [],
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
  }
}

export function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
