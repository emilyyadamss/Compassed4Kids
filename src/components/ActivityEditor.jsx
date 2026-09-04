import { useState } from 'react'
import Modal from './Modal.jsx'
import { ActivityIcon, ACTIVITY_ICON_CHOICES } from '../lib/icons.jsx'
import {
  MEASURES, ACTIVITY_TEMPLATES, EVERY_DAY, SCHOOL_DAYS, WEEKENDS,
  normaliseDays, measureFor, colorVar,
} from '../lib/model.js'
import { DAY_INITIALS, DAY_NAMES } from '../lib/date.js'

const PRESET_DAYS = [
  { label: 'Every day', days: EVERY_DAY },
  { label: 'School days', days: SCHOOL_DAYS },
  { label: 'Weekends', days: WEEKENDS },
]

export default function ActivityEditor({ activity, kid, isNew, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(activity)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const measure = measureFor(draft)
  const days = normaliseDays(draft.days)
  const canSave = draft.name.trim().length > 0

  const toggleDay = (n) => {
    const next = days.includes(n) ? days.filter((d) => d !== n) : [...days, n]
    // Refusing to save an empty week is kinder than saving something that can
    // never come due and quietly never appearing again.
    if (next.length) set({ days: next.sort((a, b) => a - b) })
  }

  return (
    <Modal
      title={isNew ? `Add something for ${kid?.name || 'this kid'}` : draft.name || 'Edit activity'}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn btn-danger"
              style={{ marginRight: 'auto' }}
              onClick={() => (confirmDelete ? onDelete(activity.id) : setConfirmDelete(true))}
            >
              {confirmDelete ? 'Really delete?' : 'Delete'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => onSave({ ...draft, name: draft.name.trim(), days })}
          >
            Save
          </button>
        </>
      }
    >
      <div style={{ '--kid-color': colorVar(kid?.colorSlot) }}>
        {isNew && (
          <div className="field" style={{ marginBottom: 16 }}>
            <span className="label">Start from</span>
            <div className="chip-row">
              {ACTIVITY_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  className="chip-btn"
                  aria-pressed={draft.name === t.name}
                  onClick={() => set({ name: t.name, icon: t.icon, measure: t.measure, target: t.target, days: t.days })}
                >
                  <ActivityIcon id={t.icon} size={15} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="act-name">What is it called?</label>
          <input
            id="act-name"
            className="input"
            value={draft.name}
            placeholder="Reading"
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <span className="label">Icon</span>
          <div className="icon-picker">
            {ACTIVITY_ICON_CHOICES.map((id) => (
              <button
                key={id}
                aria-pressed={draft.icon === id}
                aria-label={id}
                onClick={() => set({ icon: id })}
              >
                <ActivityIcon id={id} size={19} />
              </button>
            ))}
          </div>
        </div>

        <div className="row-2" style={{ marginBottom: 16 }}>
          <div className="field">
            <label htmlFor="act-measure">How is it counted?</label>
            <select
              id="act-measure"
              className="input"
              value={draft.measure}
              onChange={(e) => set({ measure: e.target.value, target: e.target.value === 'done' ? 0 : draft.target })}
            >
              {MEASURES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          {measure.many && (
            <div className="field">
              <label htmlFor="act-target">How many {measure.many}?</label>
              <input
                id="act-target"
                className="input"
                type="number"
                min="0"
                step={measure.step}
                value={draft.target}
                onChange={(e) => set({ target: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          )}
        </div>

        <div className="field">
          <span className="label">Which days?</span>
          <div className="chip-row" style={{ marginBottom: 10 }}>
            {PRESET_DAYS.map((p) => (
              <button
                key={p.label}
                className="chip-btn"
                aria-pressed={days.join() === p.days.join()}
                onClick={() => set({ days: [...p.days] })}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="day-picker">
            {DAY_INITIALS.map((initial, n) => (
              <button
                key={n}
                className="day-toggle"
                aria-pressed={days.includes(n)}
                aria-label={DAY_NAMES[n]}
                onClick={() => toggleDay(n)}
              >
                {initial}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            On days you leave off, this never appears and is never counted as missed.
          </p>
        </div>
      </div>
    </Modal>
  )
}
