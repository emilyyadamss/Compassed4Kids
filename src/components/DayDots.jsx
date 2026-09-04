import { DAY_INITIALS, fromKey } from '../lib/date.js'

/* The last week at a glance: filled for done, outlined red for a day that was
   asked for and missed, dashed for today still open, faded for a day this
   activity was never scheduled on. Deliberately not a chart — a parent should
   be able to read it in the half-second it takes to scroll past. */
export default function DayDots({ marks, label }) {
  return (
    <div className="dots" role="img" aria-label={label}>
      {marks.map(({ key, mark }) => (
        <span
          key={key}
          className={`dot-day is-${mark}`}
          title={`${key} · ${MARK_WORDS[mark]}`}
        >
          {DAY_INITIALS[fromKey(key).getDay()]}
        </span>
      ))}
    </div>
  )
}

const MARK_WORDS = {
  done: 'done',
  missed: 'missed',
  open: 'still open today',
  off: 'not scheduled',
  future: 'coming up',
}
