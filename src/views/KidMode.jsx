import { useState } from 'react'
import { Check, ChevronLeft, Lock } from 'lucide-react'
import { Avatar, ActivityIcon } from '../lib/icons.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import Brand from '../components/Brand.jsx'
import { colorVar, measureFor, measureWord } from '../lib/model.js'
import { kidDay, kidStreak } from '../lib/stats.js'

/* The kid's whole app.

   Everything here is one screen deep: pick your face, see your list, tap a
   thing. There is no navigation, no history, no numbers to interpret and no
   way to reach the settings. The only text a child has to read is the name of
   the activity and their own name. */
export default function KidMode({ kids, byKid, byActivity, today, onToggle, onExit }) {
  const [kidId, setKidId] = useState(() => (kids.length === 1 ? kids[0].id : null))
  const kid = kids.find((k) => k.id === kidId) || null

  if (kids.length === 0) {
    return (
      <div className="kidmode">
        <div className="kidmode-bar">
          <Brand size={28} />
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onExit}>
            <Lock size={14} /> Grown-ups
          </button>
        </div>
        <div className="empty">
          <h3>No kids set up yet</h3>
          <p>A grown-up needs to add someone first.</p>
        </div>
      </div>
    )
  }

  if (!kid) {
    return (
      <div className="kidmode">
        <div className="kidmode-bar">
          <Brand size={28} />
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onExit}>
            <Lock size={14} /> Grown-ups
          </button>
        </div>
        <div className="kidmode-main">
          <div className="kidmode-hello">
            <h1>Who&rsquo;s here?</h1>
            <p>Tap your picture to see today&rsquo;s list.</p>
          </div>
          <div className="kid-picker">
            {kids.map((k) => {
              const day = kidDay(byKid.get(k.id) || [], byActivity, today)
              return (
                <button
                  key={k.id}
                  className="kid-pick"
                  style={{ '--kid-color': colorVar(k.colorSlot) }}
                  onClick={() => setKidId(k.id)}
                >
                  <span className="kid-avatar"><Avatar id={k.avatar} size={38} /></span>
                  <span className="n">{k.name}</span>
                  <span className="s">
                    {day.nothingDue ? 'Nothing today!' : day.complete ? 'All done!' : `${day.total - day.done} to go`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const activities = byKid.get(kid.id) || []
  const day = kidDay(activities, byActivity, today)
  const streak = kidStreak(activities, byActivity, today)
  const color = colorVar(kid.colorSlot)

  return (
    <div className="kidmode" style={{ '--kid-color': color }}>
      <div className="kidmode-bar">
        {kids.length > 1 ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setKidId(null)}>
            <ChevronLeft size={16} /> Not me
          </button>
        ) : (
          <Brand size={28} showName={false} />
        )}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onExit}>
          <Lock size={14} /> Grown-ups
        </button>
      </div>

      <div className="kidmode-main">
        <div className="kidmode-hello">
          <h1>Hi, {kid.name}!</h1>
          <p>
            {day.nothingDue
              ? 'Nothing on your list today. Go play!'
              : day.complete
                ? 'You finished everything today. Nice work!'
                : 'Here is your list for today.'}
          </p>
        </div>

        {!day.nothingDue && (
          <div className="kid-progress">
            <ProgressRing done={day.done} total={day.total} />
            <div>
              <div className="t">
                {day.complete ? 'All done!' : `${day.total - day.done} left to go`}
              </div>
              <div className="s">
                {streak > 1 ? `${streak} days in a row, keep it up!` : 'Tap something when you finish it.'}
              </div>
            </div>
          </div>
        )}

        {day.items.map(({ activity, status }) => {
          const measure = measureFor(activity)
          const sub = status.done
            ? status.amount > 0 && measure.many
              ? `${status.amount} ${measureWord(status.amount, measure)}, done!`
              : 'Done!'
            : activity.target > 0 && measure.many
              ? `${activity.target} ${measure.many}`
              : 'Tap when you finish'

          return (
            <button
              key={activity.id}
              className={`big-tile${status.done ? ' is-done' : ''}`}
              aria-pressed={status.done}
              onClick={() => onToggle(activity)}
            >
              <span className="big-tile-icon"><ActivityIcon id={activity.icon} size={26} /></span>
              <span className="big-tile-body">
                <span className="big-tile-name">{activity.name}</span>
                <span className="big-tile-sub">{sub}</span>
              </span>
              <span className="big-tile-mark"><Check size={20} strokeWidth={3.4} /></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
