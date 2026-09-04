import { useState } from 'react'
import Modal from './Modal.jsx'
import { Avatar, AVATAR_CHOICES } from '../lib/icons.jsx'
import { COLOR_SLOTS, colorVar } from '../lib/model.js'

export default function KidEditor({ kid, isNew, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(kid)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const canSave = draft.name.trim().length > 0

  return (
    <Modal
      title={isNew ? 'Add a kid' : `Edit ${kid.name || 'kid'}`}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn btn-danger"
              style={{ marginRight: 'auto' }}
              onClick={() => (confirmDelete ? onDelete(kid.id) : setConfirmDelete(true))}
            >
              {confirmDelete ? 'Really delete everything?' : 'Delete'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => onSave({ ...draft, name: draft.name.trim(), grade: draft.grade.trim() })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="row-2">
        <div className="field">
          <label htmlFor="kid-name">Name</label>
          <input
            id="kid-name"
            className="input"
            value={draft.name}
            placeholder="Maya"
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="kid-grade">Grade</label>
          <input
            id="kid-grade"
            className="input"
            value={draft.grade}
            placeholder="4th grade"
            onChange={(e) => set({ grade: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <span className="label">Their picture</span>
        <div className="icon-picker">
          {AVATAR_CHOICES.map((id) => (
            <button
              key={id}
              aria-pressed={draft.avatar === id}
              aria-label={id}
              onClick={() => set({ avatar: id })}
            >
              <Avatar id={id} size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">Their color</span>
        <div className="swatch-picker">
          {COLOR_SLOTS.map(({ slot, name }) => (
            <button
              key={slot}
              style={{ '--sw': colorVar(slot) }}
              aria-pressed={draft.colorSlot === slot}
              aria-label={name}
              onClick={() => set({ colorSlot: slot })}
            />
          ))}
        </div>
        <p className="hint">
          This color is how {draft.name.trim() || 'they'} are recognised everywhere in the app, it stays theirs.
        </p>
      </div>

      {confirmDelete && (
        <p className="hint" style={{ color: 'var(--error-text)' }}>
          Deleting {kid.name || 'this kid'} also removes their activities and everything they have
          ever checked off. There is no undo.
        </p>
      )}
    </Modal>
  )
}
