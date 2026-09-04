import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Modal from './Modal.jsx'
import { measureFor, measureWord, colorVar } from '../lib/model.js'

/* Asked only for activities that count something. A big stepper rather than a
   text field: it is the one number a child enters, it needs to work with a
   thumb, and starting it at the target means the common case ("I did what was
   asked") is a single confirm. */
export default function CheckInModal({ kid, activity, onSave, onClose }) {
  const measure = measureFor(activity)
  const [amount, setAmount] = useState(() => Math.max(measure.step, activity.target || measure.step))

  const bump = (delta) => setAmount((n) => Math.max(0, Math.round((n + delta) * 10) / 10))

  return (
    <Modal
      title={activity.name}
      onClose={onClose}
      width={420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(amount)}>
            Done!
          </button>
        </>
      }
    >
      <div style={{ '--kid-color': colorVar(kid?.colorSlot) }}>
        <p className="hint" style={{ textAlign: 'center', marginBottom: 16, fontSize: 15 }}>
          {measure.prompt}
        </p>

        <div className="stepper">
          <button onClick={() => bump(-measure.step)} aria-label={`Less ${measure.many}`}>
            <Minus size={22} strokeWidth={2.6} />
          </button>
          <span className="n" aria-live="polite">{amount}</span>
          <button onClick={() => bump(measure.step)} aria-label={`More ${measure.many}`}>
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </div>

        <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
          {measureWord(amount, measure)}
          {activity.target > 0 && ` · asked for ${activity.target}`}
        </p>
      </div>
    </Modal>
  )
}
