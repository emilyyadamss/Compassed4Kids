import { Bell, Smile, ListChecks } from 'lucide-react'
import Brand from './Brand.jsx'

const FEATURES = [
  {
    icon: ListChecks,
    title: 'A list a kid can actually finish',
    body: 'Homework, Kumon, reading, piano — whatever you set, on the days you set it. Big buttons, no numbers to interpret, nothing to read but their own name.',
  },
  {
    icon: Bell,
    title: 'You find out as it happens',
    body: 'Every check-off lands on your dashboard the moment they tap it, from whatever room they are in. No asking at bedtime whether the reading got done.',
  },
  {
    icon: Smile,
    title: 'Built to encourage, not to police',
    body: 'Streaks that a busy Tuesday cannot wreck, credit for showing up even when the twenty minutes were only twelve, and one quiet list of what is genuinely still owed.',
  },
]

export default function LandingScreen({ onSignUp, onSignIn }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <Brand className="brand" size={36} />
        <h1>The homework got done. Now you know.</h1>
        <p className="lede">
          Your kid checks off their afternoon on the family tablet. You see it on your phone,
          as it happens — not at 9pm when it is too late to do anything about it.
        </p>

        <div className="landing-actions">
          <button className="btn btn-primary" onClick={onSignUp}>Create a family account</button>
          <button className="btn" onClick={onSignIn}>Sign in</button>
        </div>

        <div className="landing-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div className="landing-feature" key={title}>
              <span className="ico"><Icon size={20} strokeWidth={2.2} /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
