import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ActivityIcon } from '../lib/icons.jsx'
import { colorVar } from '../lib/model.js'
import { completionLine } from '../lib/stats.js'
import { formatLong, relativeTime, todayKey, addDays } from '../lib/date.js'

/* The notification stream. Every row here is something a kid actually did;
   nothing in this list is generated on the parent's side, which is what makes
   it trustworthy as a record of the week. Rows newer than the last time this
   screen was opened are marked unread. */
export default function FeedView({ feed, onDelete }) {
  const [armed, setArmed] = useState(null)

  if (feed.length === 0) {
    return (
      <div className="empty">
        <h3>Nothing checked off yet</h3>
        <p>
          As soon as a kid taps something on their screen, it lands here — and on your phone,
          if you have this open there too.
        </p>
      </div>
    )
  }

  const groups = []
  for (const row of feed) {
    const key = row.completion.date
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.rows.push(row)
    else groups.push({ key, rows: [row] })
  }

  return (
    <div className="card">
      {groups.map(({ key, rows }) => (
        <div key={key}>
          <div className="feed-day">
            <span>{dayHeading(key)}</span>
            <span className="rule" />
            <span>{rows.length}</span>
          </div>

          {rows.map(({ completion, kid, activity, unread }) => (
            <div
              key={completion.id}
              className={`feed-row${unread ? ' is-unread' : ''}${armed === completion.id ? ' is-armed' : ''}`}
              style={{ '--kid-color': colorVar(kid?.colorSlot) }}
            >
              <span className={`feed-dot${unread ? '' : ' is-read'}`} aria-hidden="true" />
              <span className="act-icon" style={{ width: 30, height: 30 }}>
                <ActivityIcon id={activity?.icon} size={16} />
              </span>
              <span className="feed-body">
                <span className="feed-line">
                  <b>{kid?.name || 'Someone'}</b> · {completionLine(activity, completion)}
                </span>
              </span>
              <span className="feed-when">{relativeTime(completion.completedAt)}</span>

              {/* Two taps to remove: a mis-tap by a kid is common, and an
                  accidental deletion of the record is not recoverable. */}
              {armed === completion.id ? (
                <span style={{ display: 'flex', gap: 4, flex: 'none' }}>
                  <button className="btn btn-sm btn-danger" onClick={() => { onDelete(completion.id); setArmed(null) }}>
                    Remove
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setArmed(null)}>Keep</button>
                </span>
              ) : (
                <button
                  className="btn btn-ghost btn-sm btn-icon act-del"
                  aria-label="Remove this entry"
                  onClick={() => setArmed(completion.id)}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function dayHeading(key) {
  const today = todayKey()
  if (key === today) return 'Today'
  if (key === addDays(today, -1)) return 'Yesterday'
  return formatLong(key)
}
