import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Modal from './Modal.jsx'
import { measureFor, measureWord, colorVar, isCounted } from '../lib/model.js'

/* What a kid is asked for after they tap something. Neither half is always
   there, and on a plain check-it-off activity with no quiz this modal never
   opens at all — one tap is the whole interaction, which is the point of the
   app.

   The number, when the activity counts one: a big stepper rather than a text
   field, pre-set to the target, so the common case ("I did what was asked") is
   a single confirm.

   The note, when a quiz is switched on: the questions get written from it, so
   this is the sentence that decides whether the quiz is about the child's
   actual homework or about nothing. The prompt asks for content, not effort. */
export default function CheckInModal({ kid, activity, quizzed, note: initialNote = '', onSave, onClose }) {
  const measure = measureFor(activity)
  const counted = isCounted(activity)
  const [amount, setAmount] = useState(() =>
    counted ? Math.max(measure.step, activity.target || measure.step) : 0)
  const [note, setNote] = useState(initialNote)

  const bump = (delta) => setAmount((n) => Math.max(0, Math.round((n + delta) * 10) / 10))
  const canSave = !quizzed || note.trim().length > 0

  return (
    <Modal
      title={activity.name}
      onClose={onClose}
      width={quizzed ? 480 : 420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave(amount, note.trim())}>
            {quizzed ? 'Next' : 'Done!'}
          </button>
        </>
      }
    >
      <div style={{ '--kid-color': colorVar(kid?.colorSlot) }}>
        {counted && (
          <>
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
          </>
        )}

        {quizzed && (
          <div className="field" style={{ marginTop: counted ? 22 : 0 }}>
            <label htmlFor="checkin-note">What did you do?</label>
            <textarea
              id="checkin-note"
              className="input quiz-input"
              rows={3}
              value={note}
              placeholder="I read chapters 3 and 4 of Percy Jackson. Percy found out who his dad was…"
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="hint">
              A sentence or two is plenty. Then you get a few questions about it.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
