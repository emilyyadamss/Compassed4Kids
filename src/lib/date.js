/* Local-date helpers. Every day is keyed 'YYYY-MM-DD' in the family's own
   timezone — no UTC shifting, so "today" always means today where you are.
   That matters more here than in most apps: a kid finishing reading at 8pm
   should land on tonight's row, not tomorrow's. */

const pad = (n) => String(n).padStart(2, '0')

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

/** An ISO timestamp → the day key it fell on *here*. Slicing the string
    instead would hand back the UTC day, which is tomorrow for anyone west of
    Greenwich in the evening. */
export function dayKeyOf(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d) ? null : toKey(d)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** Whole days from a → b (b later ⇒ positive). */
export function daysBetween(a, b) {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86400000)
}

/** 0 = Sunday … 6 = Saturday, for the day a key names. */
export const weekdayOf = (key) => fromKey(key).getDay()

/** The last `n` day keys ending at `endKey`, oldest first. */
export function lastDays(n, endKey) {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endKey, -i))
  return out
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatShort(key) {
  const d = fromKey(key)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatLong(key) {
  const d = fromKey(key)
  return `${DAY_NAMES[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** An ISO timestamp → the clock time it was written, in the viewer's locale. */
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** "just now" / "12 min ago" / "3:40 PM" / "Tue, Mar 4" — for the parent feed,
    where the useful answer changes with age: minutes today, clock time
    earlier today, a date once it stops being today. */
export function relativeTime(iso, now = Date.now()) {
  if (!iso) return ''
  const then = new Date(iso)
  if (isNaN(then)) return ''
  const mins = Math.round((now - then.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const key = toKey(then)
  const today = toKey(new Date(now))
  if (key === today) return formatTime(iso)
  if (key === addDays(today, -1)) return `Yesterday, ${formatTime(iso)}`
  return formatLong(key)
}

/** "today" / "yesterday" / "5 days ago" / "never" */
export function relativeDays(days) {
  if (days == null) return 'never'
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return `${Math.round(days / 30)} months ago`
}
