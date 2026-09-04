import { AlertCircle, Flame, Plus } from 'lucide-react'
import KidCard from '../components/KidCard.jsx'
import { colorVar } from '../lib/model.js'
import { kidDay, kidStreak, bestStreak, needsAttention } from '../lib/stats.js'

/* The screen a parent opens with one question. The answer is the top row of
   tiles; everything below it is the detail behind that answer. */
export default function ParentDashboard({
  kids, byKid, byActivity, today, settings, onOpenKid, onToggle, onNewKid,
}) {
  if (kids.length === 0) {
    return (
      <div className="empty">
        <h3>No kids yet</h3>
        <p>
          Add a child, give them a color, and put two or three things on their list.
          Then hand them the tablet — everything they check off shows up here.
        </p>
        <button className="btn btn-primary" onClick={onNewKid}>
          <Plus size={16} /> Add a kid
        </button>
      </div>
    )
  }

  const days = kids.map((kid) => ({ kid, day: kidDay(byKid.get(kid.id) || [], byActivity, today) }))
  const doneToday = days.reduce((n, { day }) => n + day.done, 0)
  const dueToday = days.reduce((n, { day }) => n + day.total, 0)
  const allDone = days.filter(({ day }) => day.complete).length
  const best = bestStreak(kids, byKid, byActivity, today)
  const late = needsAttention(kids, byKid, byActivity, today, new Date(), settings)

  return (
    <>
      <div className="kpi-row">
        <div className="stat">
          <div className="k">Done today</div>
          <div className="v">{doneToday}<small> / {dueToday}</small></div>
          <div className="d">across {kids.length} {kids.length === 1 ? 'kid' : 'kids'}</div>
        </div>
        <div className="stat">
          <div className="k">Finished the day</div>
          <div className="v">{allDone}<small> / {kids.length}</small></div>
          <div className={`d${allDone === kids.length ? ' up' : ''}`}>
            {allDone === kids.length ? 'Everyone is done' : 'Still going'}
          </div>
        </div>
        <div className="stat">
          <div className="k">Longest streak</div>
          <div className="v">{best.streak}<small> {best.streak === 1 ? 'day' : 'days'}</small></div>
          <div className="d">{best.kid ? best.kid.name : 'Nobody yet'}</div>
        </div>
        <div className="stat">
          <div className="k">Still owed</div>
          <div className="v">{late.length}</div>
          <div className="d">{late.length === 0 ? 'Nothing outstanding' : 'Today and yesterday'}</div>
        </div>
      </div>

      {late.length > 0 && (
        <div className="card attention" style={{ marginBottom: 18 }}>
          <div className="card-head" style={{ marginBottom: 8 }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={17} /> Still owed
              </div>
              <div className="card-sub">
                Yesterday is settled; today only appears here after {formatHour(settings.behindAfterHour)}.
              </div>
            </div>
          </div>
          {late.map(({ kid, activity, when }) => (
            <div
              key={`${kid.id}:${activity.id}:${when}`}
              className="attention-row"
              style={{ '--kid-color': colorVar(kid.colorSlot) }}
            >
              <span className="who">{kid.name}</span>
              <span>{activity.name}</span>
              <span className="when">{when}</span>
            </div>
          ))}
        </div>
      )}

      {best.streak >= 5 && (
        <div className="card" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="act-icon" style={{ color: 'var(--good-text)' }}><Flame size={19} /></span>
          <div>
            <div className="card-title" style={{ marginBottom: 0 }}>
              {best.kid.name} is on a {best.streak}-day streak
            </div>
            <div className="card-sub">Every single thing on the list, {best.streak} days running.</div>
          </div>
        </div>
      )}

      <div className="kid-grid">
        {days.map(({ kid, day }) => (
          <KidCard
            key={kid.id}
            kid={kid}
            day={day}
            streak={kidStreak(byKid.get(kid.id) || [], byActivity, today)}
            onOpen={onOpenKid}
            onToggle={onToggle}
          />
        ))}
      </div>
    </>
  )
}

function formatHour(h) {
  const hour = Number.isFinite(h) ? h : 17
  const suffix = hour >= 12 ? 'pm' : 'am'
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}${suffix}`
}
