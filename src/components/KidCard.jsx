import { Flame } from 'lucide-react'
import { Avatar } from '../lib/icons.jsx'
import { colorVar } from '../lib/model.js'
import ActivityRow from './ActivityRow.jsx'

/* One kid's whole day on the parent dashboard: who, how far through, and the
   list itself. The list is on the card rather than behind a click because the
   question a parent opens this app with is "is the reading done", and making
   them navigate for it would be the whole failure. */
export default function KidCard({ kid, day, streak, onOpen, onToggle }) {
  const color = colorVar(kid.colorSlot)

  return (
    <div className="kid-card" style={{ '--kid-color': color }}>
      <button className="kid-head" onClick={() => onOpen(kid.id)}>
        <span className="kid-avatar"><Avatar id={kid.avatar} size={24} /></span>
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span className="kid-name" style={{ display: 'block' }}>{kid.name}</span>
          <span className="kid-meta">
            {day.nothingDue
              ? 'Nothing on the list today'
              : day.complete
                ? 'All done for today'
                : `${day.total - day.done} still to do`}
            {streak > 1 ? ` · ${streak}-day streak` : ''}
          </span>
        </span>
        <span className="kid-score">
          <span className="n">{day.done}/{day.total}</span>
          <span className="u">today</span>
        </span>
      </button>

      {!day.nothingDue && (
        <div>
          <div className="meter-row">
            <span>{day.pct}% of today</span>
            {streak > 1 && (
              <span className="chip" style={{ height: 22 }}>
                <Flame size={12} strokeWidth={2.6} /> {streak}
              </span>
            )}
          </div>
          <div className="meter"><i style={{ width: `${day.pct}%` }} /></div>
        </div>
      )}

      {day.nothingDue ? (
        <p className="hint">A free day — nothing is scheduled for {kid.name} today.</p>
      ) : (
        <div>
          {day.items.map(({ activity, status }) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              status={status}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
