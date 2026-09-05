import { useRef, useState } from 'react'
import { exportJSON, parseImport, download } from '../lib/storage.js'

const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

const CUTOFFS = [15, 16, 17, 18, 19, 20]

export default function SettingsView({
  settings, setSettings, state, email, parentName, onSaveParentName,
  notifyState, onEnableNotifications,
  onSignOut, onImport, onLoadSample, onClearAll, toast,
}) {
  const fileInput = useRef(null)
  const [pin, setPin] = useState('')
  const [name, setName] = useState(parentName || '')
  const [savingName, setSavingName] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  /* Blank is a real answer here: clearing the box removes the name rather
     than being ignored, which is why "unchanged" is what disables Save. */
  const nameDirty = name.trim() !== (parentName || '')

  async function saveName() {
    if (!nameDirty || savingName) return
    const clean = name.trim()
    setSavingName(true)
    try {
      await onSaveParentName(clean)
      setName(clean)
    } finally {
      setSavingName(false)
    }
  }

  const savePin = () => {
    const clean = pin.replace(/\D/g, '').slice(0, 4)
    if (clean && clean.length < 4) { toast('A PIN needs to be four digits'); return }
    setSettings({ parentPin: clean })
    setPin('')
    toast(clean ? 'Parent PIN set' : 'Parent PIN removed')
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(parseImport(String(reader.result)))
      } catch (err) {
        toast(err.message || 'That file could not be read')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="stack" style={{ maxWidth: 620 }}>
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Appearance</div>
            <div className="card-sub">Follows your device unless you pick one.</div>
          </div>
          <div className="seg">
            {THEMES.map((t) => (
              <button
                key={t.id}
                aria-pressed={settings.theme === t.id}
                onClick={() => setSettings({ theme: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 4 }}>
          <div>
            <div className="card-title">Notifications</div>
            <div className="card-sub">
              Check-offs always appear on this dashboard the moment they happen. A desktop
              notification also pops one up when this tab is in the background.
            </div>
          </div>
        </div>

        <div className="switch">
          <div className="switch-copy">
            <div className="t">Desktop notifications</div>
            <div className="s">
              {notifyState === 'granted'
                ? 'On, your browser will pop up each check-off.'
                : notifyState === 'denied'
                  ? 'Blocked in your browser settings. Re-allow notifications for this site to turn them on.'
                  : 'Ask your browser for permission to show them.'}
            </div>
          </div>
          <button
            className="btn btn-sm"
            disabled={notifyState === 'granted' || notifyState === 'denied' || notifyState === 'unsupported'}
            onClick={onEnableNotifications}
          >
            {notifyState === 'granted' ? 'Enabled' : notifyState === 'unsupported' ? 'Unsupported' : 'Enable'}
          </button>
        </div>

        <div className="switch">
          <div className="switch-copy">
            <div className="t">Count today as late after</div>
            <div className="s">
              Before this hour, an unfinished thing is just unfinished, it stays off the
              &ldquo;still owed&rdquo; list so the app is not nagging at 3pm.
            </div>
          </div>
          <select
            className="input"
            style={{ width: 110, flex: 'none' }}
            value={settings.behindAfterHour}
            onChange={(e) => setSettings({ behindAfterHour: Number(e.target.value) })}
          >
            {CUTOFFS.map((h) => (
              <option key={h} value={h}>{h % 12 === 0 ? 12 : h % 12}{h >= 12 ? 'pm' : 'am'}</option>
            ))}
          </select>
        </div>

        <div className="switch">
          <div className="switch-copy">
            <div className="t">Celebrate a finished day</div>
            <div className="s">A burst of confetti on the kid&rsquo;s screen when the last thing is ticked.</div>
          </div>
          <button
            className="toggle"
            role="switch"
            aria-pressed={settings.celebrate}
            aria-label="Celebrate a finished day"
            onClick={() => setSettings({ celebrate: !settings.celebrate })}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 4 }}>
          <div>
            <div className="card-title">Quizzes</div>
            <div className="card-sub">
              Switched on per activity, on the activity itself. When it is on, finishing that
              activity means saying what they did and answering 10 questions written with AI assitance
              about it, and the activity is not counted done until they have. The score lands
              in your feed with whatever they got wrong.
            </div>
          </div>
        </div>

        <div className="switch">
          <div className="switch-copy">
            <div className="t">Ask questions after a goal</div>
            <div className="s">
              {settings.quizzes
                ? 'On for any activity you have switched it on for. Turn this off for a week where the questions are one thing too many.'
                : 'Off everywhere, whatever each activity says. Nobody gets asked anything.'}
            </div>
          </div>
          <button
            className="toggle"
            role="switch"
            aria-pressed={settings.quizzes !== false}
            aria-label="Ask questions after a goal"
            onClick={() => setSettings({ quizzes: settings.quizzes === false })}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 8 }}>
          <div>
            <div className="card-title">Parent PIN</div>
            <div className="card-sub">
              {settings.parentPin
                ? 'Set. Leaving kid mode asks for it.'
                : 'Optional. Four digits, asked for when leaving kid mode.'}
            </div>
          </div>
        </div>
        <p className="hint" style={{ marginBottom: 10 }}>
          A speed bump, not a lock, it keeps a younger sibling out of the settings. Your account
          password is the real boundary.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ width: 130 }}
            inputMode="numeric"
            maxLength={4}
            placeholder={settings.parentPin ? '••••' : '1234'}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <button className="btn" onClick={savePin} disabled={!pin}>Set PIN</button>
          {settings.parentPin && (
            <button
              className="btn btn-ghost"
              onClick={() => { setSettings({ parentPin: '' }); setPin(''); toast('Parent PIN removed') }}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 8 }}>
          <div>
            <div className="card-title">Your data</div>
            <div className="card-sub">A backup is a plain JSON file. Importing one replaces everything.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={() => {
              download(`compassed-kids-${new Date().toISOString().slice(0, 10)}.json`, exportJSON(state))
              toast('Backup downloaded')
            }}
          >
            Export backup
          </button>
          <button className="btn" onClick={() => fileInput.current?.click()}>Import backup</button>
          <button className="btn" onClick={onLoadSample}>Load a sample family</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImport}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 8 }}>
          <div>
            <div className="card-title">Account</div>
            <div className="card-sub">{email}</div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="settings-parent-name">Your name</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              id="settings-parent-name"
              className="input"
              style={{ flex: '1 1 180px' }}
              type="text"
              autoComplete="name"
              placeholder="What your kids call you"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn" onClick={saveName} disabled={!nameDirty || savingName}>
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={onSignOut}>Sign out</button>
          <button
            className="btn btn-danger"
            onClick={() => (confirmClear ? onClearAll() : setConfirmClear(true))}
          >
            {confirmClear ? 'Really delete every kid and record?' : 'Clear all data'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 8 }}>
          <div>
            <div className="card-title">Privacy</div>
            <div className="card-sub">
              Your family's data is never sold, and only this account can read it. The policy
              says what is stored, what quizzing sends to our AI, and how to delete all of it.
            </div>
          </div>
        </div>
        <a className="btn" href="/privacy.html" target="_blank" rel="noreferrer">
          Read the privacy policy for more info
        </a>
      </div>
    </div>
  )
}
