import { useState } from 'react'
import { Delete, Lock } from 'lucide-react'
import Modal from './Modal.jsx'

/* Stands between kid mode and the grown-up side. This is a speed bump, not
   security, the real boundary is the Supabase password, and a determined
   eleven-year-old with the family iPad is not the threat model. It exists so a
   younger sibling cannot wander into the settings and delete a kid. */
export default function PinGate({ pin, onUnlock, onClose }) {
  const [entered, setEntered] = useState('')
  const [wrong, setWrong] = useState(false)

  const press = (digit) => {
    if (entered.length >= 4) return
    const next = entered + digit
    setEntered(next)
    setWrong(false)
    if (next.length === 4) {
      if (next === pin) onUnlock()
      else setTimeout(() => { setWrong(true); setEntered('') }, 160)
    }
  }

  return (
    <Modal title="Grown-ups only" onClose={onClose} width={360}>
      <p className="hint" style={{ textAlign: 'center', display: 'flex', gap: 7, justifyContent: 'center' }}>
        <Lock size={14} /> Enter the parent PIN
      </p>

      <div className="pin-dots" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <i key={i} className={i < entered.length ? 'on' : ''} />)}
      </div>

      {wrong && (
        <p className="hint" style={{ textAlign: 'center', color: 'var(--error-text)' }}>
          That is not the PIN. Try again.
        </p>
      )}

      <div className="pin-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => press(String(n))}>{n}</button>
        ))}
        <button onClick={onClose} aria-label="Cancel" style={{ fontSize: 14 }}>Cancel</button>
        <button onClick={() => press('0')}>0</button>
        <button onClick={() => { setEntered((e) => e.slice(0, -1)); setWrong(false) }} aria-label="Delete">
          <Delete size={20} />
        </button>
      </div>
    </Modal>
  )
}
