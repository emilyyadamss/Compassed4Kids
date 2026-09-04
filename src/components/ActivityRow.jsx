import { Check, Pencil } from 'lucide-react'
import { ActivityIcon } from '../lib/icons.jsx'
import { measureFor, measureWord, daysLabel } from '../lib/model.js'
import { formatTime } from '../lib/date.js'

/* One activity on one day, on the grown-up side. The checkbox works here too —
   a parent marking something off on a kid's behalf is a normal Tuesday — but
   the row leads with what happened rather than with the tap target. */
export default function ActivityRow({ activity, status, onToggle, onEdit, showDays = false }) {
  const measure = measureFor(activity)
  const { done, scheduled, amount, target, entry } = status

  const detail = []
  if (done && measure.many && amount > 0) {
    detail.push(`${amount} ${measureWord(amount, measure)}${target > 0 && amount < target ? ` of ${target}` : ''}`)
  }
  if (done && entry?.completedAt) detail.push(formatTime(entry.completedAt))
  if (!done && target > 0 && measure.many) detail.push(`${target} ${measure.many}`)
  if (showDays) detail.push(daysLabel(activity.days))
  if (!scheduled && !done) detail.push('not scheduled today')

  return (
    <div className={`act-row${done ? ' is-done' : ''}`}>
      <button
        className="act-check"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Undo ${activity.name}` : `Mark ${activity.name} done`}
        onClick={() => onToggle(activity)}
      >
        <Check size={17} strokeWidth={3.4} />
      </button>

      <span className="act-icon"><ActivityIcon id={activity.icon} size={18} /></span>

      <span className="act-body">
        <span className="act-name">{activity.name}</span>
        {detail.length > 0 && <span className="act-meta">{detail.join(' · ')}</span>}
      </span>

      {onEdit && (
        <span className="act-actions">
          <button
            className="btn btn-ghost btn-sm btn-icon act-del"
            aria-label={`Edit ${activity.name}`}
            onClick={() => onEdit(activity)}
          >
            <Pencil size={15} />
          </button>
        </span>
      )}
    </div>
  )
}
