import { Flame, Pencil, Plus } from 'lucide-react'
import { Avatar } from '../lib/icons.jsx'
import ActivityRow from '../components/ActivityRow.jsx'
import DayDots from '../components/DayDots.jsx'
import { colorVar, daysLabel } from '../lib/model.js'
import { activityStatus, daysFor, dayMarks, streakFor, kidDay, kidStreak } from '../lib/stats.js'
import { lastDays } from '../lib/date.js'

/* One kid, in full: today's list, plus the week behind each line. This is
   where a parent comes when the dashboard has told them something is off and
   they want to know whether it is a bad night or a pattern. */
export default function KidDetail({
  kid, activities, byActivity, today, onBack, onEditKid, onEditActivity, onNewActivity, onToggle,
}) {
  const color = colorVar(kid.colorSlot)
  const week = lastDays(7, today)
  const day = kidDay(activities, byActivity, today)
  const streak = kidStreak(activities, byActivity, today)

  return (
    <div style={{ '--kid-color': color }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span className="kid-avatar lg"><Avatar id={kid.avatar} size={30} /></span>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title">{kid.name}</h1>
            <p className="page-sub">
              {[kid.grade, day.nothingDue ? 'nothing scheduled today' : `${day.done} of ${day.total} done today`]
                .filter(Boolean)
                .join(' · ')}
              {streak > 1 ? ` · ${streak}-day streak` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onBack}>← Today</button>
          <button className="btn" onClick={() => onEditKid(kid)}>
            <Pencil size={15} /> Edit
          </button>
          <button className="btn btn-primary" onClick={() => onNewActivity(kid)}>
            <Plus size={16} /> Add activity
          </button>
        </div>
      </div>

      {streak > 1 && (
        <div className="kpi-row">
          <div className="stat">
            <div className="k">Current streak</div>
            <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={24} style={{ color }} /> {streak}
            </div>
            <div className="d">days finishing everything</div>
          </div>
          <div className="stat">
            <div className="k">Today</div>
            <div className="v">{day.done}<small> / {day.total}</small></div>
            <div className={`d${day.complete ? ' up' : ''}`}>
              {day.nothingDue ? 'A free day' : day.complete ? 'All done' : `${day.total - day.done} to go`}
            </div>
          </div>
          <div className="stat">
            <div className="k">On the list</div>
            <div className="v">{activities.length}</div>
            <div className="d">{activities.length === 1 ? 'activity' : 'activities'} in all</div>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="empty">
          <h3>{kid.name} has nothing on their list</h3>
          <p>Add homework, Kumon, reading — whatever you want them checking off, on the days it is due.</p>
          <button className="btn btn-primary" onClick={() => onNewActivity(kid)}>
            <Plus size={16} /> Add the first one
          </button>
        </div>
      ) : (
        <div className="stack">
          {activities.map((activity) => {
            const dayMap = daysFor(byActivity, activity.id)
            const status = activityStatus(activity, dayMap, today)
            const actStreak = streakFor(activity, dayMap, today)
            return (
              <div className="card" key={activity.id}>
                <ActivityRow
                  activity={activity}
                  status={status}
                  onToggle={onToggle}
                  onEdit={onEditActivity}
                  showDays
                />
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, marginTop: 12, flexWrap: 'wrap',
                  }}
                >
                  <DayDots
                    marks={dayMarks(activity, dayMap, week, today)}
                    label={`Last 7 days of ${activity.name}`}
                  />
                  <span className="hint">
                    {daysLabel(activity.days)}
                    {actStreak > 1 ? ` · ${actStreak} in a row` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
