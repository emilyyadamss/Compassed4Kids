import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import Brand from './Brand.jsx'

const MODES = {
  signin: { title: 'Sign in', cta: 'Sign in', switchTo: 'signup', switchLabel: "No account yet? Create one" },
  signup: { title: 'Create your family account', cta: 'Create account', switchTo: 'signin', switchLabel: 'Already set up? Sign in' },
}

/* One account per family, held by a grown-up. Kids never sign in — they pick
   their name on the kid screen, which is why the parent side is what's behind
   a password (and, optionally, a PIN). */
export default function AuthScreen({ initialMode = 'signin', onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const copy = MODES[mode]

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        setMessage('Account created. Check your email to confirm it, then sign in.')
        setMode('signin')
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function sendMagicLink() {
    if (!email || busy) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      if (err) throw err
      setMessage('Check your email for a sign-in link.')
    } catch (err) {
      setError(err.message || 'Could not send the link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="card auth-card">
        {onBack && (
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={onBack}>
            ← Back
          </button>
        )}
        <Brand />

        <div className="card-head"><div className="card-title">{copy.title}</div></div>

        <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label htmlFor="auth-email">Parent email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="hint" style={{ color: 'var(--error-text)' }}>{error}</p>}
          {message && <p className="hint">{message}</p>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Working…' : copy.cta}
          </button>
        </form>

        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 10, width: '100%' }}
          disabled={busy || !email}
          onClick={sendMagicLink}
        >
          Email me a sign-in link instead
        </button>

        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 16, width: '100%' }}
          onClick={() => { setMode(copy.switchTo); setError(null); setMessage(null) }}
        >
          {copy.switchLabel}
        </button>
      </div>
    </div>
  )
}
