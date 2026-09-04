import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Home, Bell, Settings, Plus, Smile } from 'lucide-react'
import ParentDashboard from './views/ParentDashboard.jsx'
import KidDetail from './views/KidDetail.jsx'
import FeedView from './views/FeedView.jsx'
import KidMode from './views/KidMode.jsx'
import SettingsView from './views/SettingsView.jsx'
import KidEditor from './components/KidEditor.jsx'
import ActivityEditor from './components/ActivityEditor.jsx'
import CheckInModal from './components/CheckInModal.jsx'
import QuizModal from './components/QuizModal.jsx'
import PinGate from './components/PinGate.jsx'
import MobileNav from './components/MobileNav.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import LandingScreen from './components/LandingScreen.jsx'
import Loader from './components/Loader.jsx'
import Brand from './components/Brand.jsx'
import Confetti from './components/Confetti.jsx'
import { Avatar } from './lib/icons.jsx'
import { supabase } from './lib/supabaseClient.js'
import {
  fetchState, putKid, removeKid, putActivity, removeActivity,
  putCompletion, removeCompletion, putSettings, replaceData, replaceAll,
  subscribeToCompletions,
} from './lib/db.js'
import { buildSample } from './lib/sample.js'
import {
  DEFAULT_SETTINGS, colorVar, newKid, newActivity, newCompletion,
  indexActivities, isCounted, isQuizzed,
} from './lib/model.js'
import {
  indexCompletions, daysFor, kidDay, buildFeed, unreadCount, completionLine, quizLine,
} from './lib/stats.js'
import { todayKey, formatLong } from './lib/date.js'

const EMPTY_STATE = { kids: [], activities: [], completions: [], settings: { ...DEFAULT_SETTINGS } }

const notifySupport = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

export default function App() {
  // undefined = auth not checked yet, null = signed out, object = signed in.
  const [session, setSession] = useState(undefined)
  const [authView, setAuthView] = useState('landing')
  const [state, setState] = useState(EMPTY_STATE)
  const [dataLoading, setDataLoading] = useState(false)
  const [view, setView] = useState({ name: 'dashboard' })

  /* Kid mode is a whole separate shell over the same data, and it is sticky:
     the tablet in the kitchen should reopen into the kid's screen, not into
     the parent dashboard a child was never meant to see. */
  const [mode, setMode] = useState(() => (localStorage.getItem('mode') === 'kid' ? 'kid' : 'parent'))
  const [pinPrompt, setPinPrompt] = useState(false)

  const [editingKid, setEditingKid] = useState(null)          // { kid, isNew }
  const [editingActivity, setEditingActivity] = useState(null) // { activity, kid, isNew }
  const [checkingIn, setCheckingIn] = useState(null)           // { kid, activity, quizzed, note }
  const [quizzing, setQuizzing] = useState(null)               // { kid, activity, amount, note }
  const [celebrating, setCelebrating] = useState(false)
  const [notifyState, setNotifyState] = useState(notifySupport)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  // A family tablet stays open for days. Re-read the date every minute so the
  // list rolls over at midnight instead of at the next reload.
  const [today, setToday] = useState(todayKey)
  useEffect(() => {
    const id = setInterval(() => setToday((t) => (todayKey() === t ? t : todayKey())), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { localStorage.setItem('mode', mode) }, [mode])

  const { kids, activities, completions, settings } = state
  const userId = session?.user?.id ?? null

  /* ------------------------------------------------------------------ auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess))
    return () => sub.subscription.unsubscribe()
  }, [])

  /* ---------------------------------------------------------------- toasts */
  const toast = useCallback((message) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  /* --------------------------------------------------------- load from db */
  useEffect(() => {
    if (!userId) { setState(EMPTY_STATE); return }
    let cancelled = false
    setDataLoading(true)
    fetchState(userId)
      .then((next) => { if (!cancelled) setState(next) })
      .catch(() => { if (!cancelled) toast('Could not load your family data') })
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [userId, toast])

  /* ----------------------------------------------------------------- theme */
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  /* ------------------------------------------------------- live check-offs */

  /* Rows this tab wrote itself. The realtime echo of our own optimistic insert
     is not news, and popping a notification for it would tell a parent about
     their own tap. */
  const ownWrites = useRef(new Set())

  useEffect(() => {
    if (!userId) return
    return subscribeToCompletions(userId, {
      onInsert: (completion) => {
        if (!completion?.id) return
        if (ownWrites.current.has(completion.id)) { ownWrites.current.delete(completion.id); return }
        setState((s) => {
          if (s.completions.some((c) => c.id === completion.id)) return s
          const kid = s.kids.find((k) => k.id === completion.kidId)
          const activity = s.activities.find((a) => a.id === completion.activityId)
          announce(kid, activity, completion)
          return { ...s, completions: [...s.completions, completion] }
        })
      },
      onDelete: (id) => {
        if (!id) return
        setState((s) => ({ ...s, completions: s.completions.filter((c) => c.id !== id) }))
      },
    })
    // `announce` is stable for the life of the session; re-subscribing on every
    // render would tear down and rebuild the channel constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const announce = useCallback((kid, activity, completion) => {
    const quiz = quizLine(completion)
    const line = `${kid?.name || 'Someone'} · ${completionLine(activity, completion)}${quiz ? ` · ${quiz}` : ''}`
    toast(line)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification('Compassed 4 Kids', { body: line, tag: completion.id })
      } catch {
        // Some browsers only allow notifications from a service worker; the
        // toast above already carried the news, so this is not worth surfacing.
      }
    }
  }, [toast])

  const enableNotifications = useCallback(() => {
    if (typeof Notification === 'undefined') return
    Notification.requestPermission().then((result) => {
      setNotifyState(result)
      if (result === 'granted') toast('Desktop notifications on')
    })
  }, [toast])

  /* ------------------------------------------------------------- derived */
  const byKid = useMemo(() => indexActivities(activities), [activities])
  const byActivity = useMemo(() => indexCompletions(completions), [completions])
  const sortedKids = useMemo(
    () => kids.slice().sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')),
    [kids],
  )

  /* The feed marks itself read on arrival, but renders against the stamp from
     *before* this visit, so a parent can still see which rows were new. */
  const feedSnapshot = useRef(null)
  useEffect(() => {
    if (view.name !== 'feed') { feedSnapshot.current = null; return }
    feedSnapshot.current = settings.feedSeenAt || ''
    const stamp = new Date().toISOString()
    setState((s) => {
      const next = { ...s.settings, feedSeenAt: stamp }
      putSettings(userId, next).catch(() => {})
      return { ...s, settings: next }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.name])

  const feed = useMemo(
    () => buildFeed(completions, kids, activities, { seenAt: feedSnapshot.current ?? settings.feedSeenAt }),
    [completions, kids, activities, settings.feedSeenAt],
  )
  const unread = useMemo(
    () => unreadCount(completions, settings.feedSeenAt),
    [completions, settings.feedSeenAt],
  )

  /* ------------------------------------------------------------- mutations */
  const syncFail = useCallback((message) => (err) => {
    console.error(err)
    toast(message)
  }, [toast])

  const setSettings = useCallback((patch) => {
    setState((s) => {
      const next = { ...s.settings, ...patch }
      putSettings(userId, next).catch(syncFail('Could not save that setting'))
      return { ...s, settings: next }
    })
  }, [userId, syncFail])

  const saveKid = useCallback((kid) => {
    setState((s) => {
      const exists = s.kids.some((k) => k.id === kid.id)
      return { ...s, kids: exists ? s.kids.map((k) => (k.id === kid.id ? kid : k)) : [...s.kids, kid] }
    })
    putKid(userId, kid).catch(syncFail('Could not save that kid'))
    setEditingKid(null)
    toast(`Saved ${kid.name}`)
  }, [userId, syncFail, toast])

  const deleteKid = useCallback((id) => {
    setState((s) => ({
      ...s,
      kids: s.kids.filter((k) => k.id !== id),
      activities: s.activities.filter((a) => a.kidId !== id),
      completions: s.completions.filter((c) => c.kidId !== id),
    }))
    // The kids row cascades to activities and completions in the database.
    removeKid(id).catch(syncFail('Could not delete that kid'))
    setEditingKid(null)
    setView({ name: 'dashboard' })
    toast('Kid removed')
  }, [syncFail, toast])

  const saveActivity = useCallback((activity) => {
    setState((s) => {
      const exists = s.activities.some((a) => a.id === activity.id)
      return {
        ...s,
        activities: exists
          ? s.activities.map((a) => (a.id === activity.id ? activity : a))
          : [...s.activities, activity],
      }
    })
    putActivity(userId, activity).catch(syncFail('Could not save that activity'))
    setEditingActivity(null)
    toast(`Saved ${activity.name}`)
  }, [userId, syncFail, toast])

  const deleteActivity = useCallback((id) => {
    setState((s) => ({
      ...s,
      activities: s.activities.filter((a) => a.id !== id),
      completions: s.completions.filter((c) => c.activityId !== id),
    }))
    removeActivity(id).catch(syncFail('Could not remove that activity'))
    setEditingActivity(null)
    toast('Activity removed')
  }, [syncFail, toast])

  /* Writing the completion, and deciding whether the day just got finished.
     The celebration is checked here rather than in a render effect so it fires
     exactly once, on the tap that finished the list. */
  const checkOff = useCallback((kid, activity, amount, note = '', quiz = null) => {
    const completion = newCompletion(activity.kidId, activity.id, today, amount, note, quiz)
    ownWrites.current.add(completion.id)
    setState((s) => ({ ...s, completions: [...s.completions, completion] }))
    putCompletion(userId, completion).catch(syncFail('Could not save that. It may not have reached your phone'))
    setCheckingIn(null)
    setQuizzing(null)

    const day = kidDay(byKid.get(activity.kidId) || [], byActivity, today)
    const finishedTheDay = !day.nothingDue && day.remaining.every((i) => i.activity.id === activity.id)
    if (finishedTheDay && settings.celebrate && mode === 'kid') setCelebrating(true)

    const scored = quizLine(completion)
    toast(finishedTheDay
      ? `${kid?.name || 'All'} done for today!${scored ? ` (${scored})` : ''}`
      : `${completionLine(activity, completion)}${scored ? ` · ${scored}` : ''}`)
  }, [userId, today, byKid, byActivity, settings.celebrate, mode, syncFail, toast])

  /* One handler for every checkbox in the app. It works out for itself whether
     this is a tick or an untick, and whether a number needs asking for. */
  const toggleActivity = useCallback((activity) => {
    const existing = daysFor(byActivity, activity.id).get(today)
    if (existing) {
      setState((s) => ({ ...s, completions: s.completions.filter((c) => c.id !== existing.id) }))
      removeCompletion(existing.id).catch(syncFail('Could not undo that'))
      toast(`${activity.name} unchecked`)
      return
    }
    const kid = kids.find((k) => k.id === activity.kidId) || null

    /* A quizzed activity stops here, even a plain check-it-off one: there are
       no questions to write until the kid says what they did.

       Only in kid mode, though. On the grown-up side this same handler is the
       checkbox a parent taps for reading that happened in the car, and making
       them sit their child's quiz to record it would be absurd — a parent is
       already the authority here, they can edit or delete any of this. The
       row says a grown-up checked it, so the feed still tells the truth about
       why there is no score. */
    const quizzed = isQuizzed(activity, settings) && mode === 'kid'
    if (isCounted(activity) || quizzed) { setCheckingIn({ kid, activity, quizzed, note: '' }); return }
    checkOff(kid, activity, 0, '', isQuizzed(activity, settings) ? { skipped: 'parent' } : null)
  }, [byActivity, today, kids, settings, mode, checkOff, syncFail, toast])

  const deleteCompletion = useCallback((id) => {
    setState((s) => ({ ...s, completions: s.completions.filter((c) => c.id !== id) }))
    removeCompletion(id).catch(syncFail('Could not remove that entry'))
    toast('Entry removed')
  }, [syncFail, toast])

  const openNewKid = useCallback(() => {
    setEditingKid({ kid: newKid(kids.length), isNew: true })
  }, [kids.length])

  const openNewActivity = useCallback((kid) => {
    const order = (byKid.get(kid.id) || []).length
    setEditingActivity({ activity: newActivity(kid.id, {}, order), kid, isNew: true })
  }, [byKid])

  const loadSample = useCallback(() => {
    const sample = buildSample()
    setState((s) => ({ ...s, ...sample }))
    replaceData(userId, sample).catch(syncFail('Could not save the sample family'))
    setView({ name: 'dashboard' })
    toast('Sample family loaded')
  }, [userId, syncFail, toast])

  /* --------------------------------------------------------- mode switching */

  const leaveKidMode = useCallback(() => {
    if (settings.parentPin) setPinPrompt(true)
    else setMode('parent')
  }, [settings.parentPin])

  /* ------------------------------------------------------------- shortcuts */
  useEffect(() => {
    if (mode !== 'parent') return
    const onKey = (e) => {
      if (editingKid || editingActivity || checkingIn || quizzing || pinPrompt) return
      const t = e.target
      if (t instanceof HTMLElement && /input|textarea|select/i.test(t.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'g') { e.preventDefault(); setView({ name: 'dashboard' }) }
      if (e.key === 'a') { e.preventDefault(); setView({ name: 'feed' }) }
      if (e.key === 'n') { e.preventDefault(); openNewKid() }
      if (e.key === 'k') { e.preventDefault(); setMode('kid') }
      if (e.key === ',') { e.preventDefault(); setView({ name: 'settings' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, editingKid, editingActivity, checkingIn, quizzing, pinPrompt, openNewKid])

  /* ------------------------------------------------------------- rendering */

  const currentKid = view.name === 'kid' ? kids.find((k) => k.id === view.kidId) : null

  const modals = (
    <>
      {editingKid && (
        <KidEditor
          kid={editingKid.kid}
          isNew={editingKid.isNew}
          onSave={saveKid}
          onDelete={deleteKid}
          onClose={() => setEditingKid(null)}
        />
      )}

      {editingActivity && (
        <ActivityEditor
          activity={editingActivity.activity}
          kid={editingActivity.kid}
          isNew={editingActivity.isNew}
          onSave={saveActivity}
          onDelete={deleteActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}

      {checkingIn && (
        <CheckInModal
          kid={checkingIn.kid}
          activity={checkingIn.activity}
          quizzed={checkingIn.quizzed}
          note={checkingIn.note}
          onSave={(amount, note) => {
            /* Where the two paths part. Without a quiz this tap writes the
               completion and the kid is done. With one, nothing is written
               yet — the row is only earned on the far side of the questions,
               and walking away here leaves the activity genuinely unfinished
               rather than half-recorded. */
            if (checkingIn.quizzed) {
              setCheckingIn(null)
              setQuizzing({ kid: checkingIn.kid, activity: checkingIn.activity, amount, note })
              return
            }
            checkOff(
              checkingIn.kid, checkingIn.activity, amount, note,
              isQuizzed(checkingIn.activity, settings) ? { skipped: 'parent' } : null,
            )
          }}
          onClose={() => setCheckingIn(null)}
        />
      )}

      {quizzing && (
        <QuizModal
          kid={quizzing.kid}
          activity={quizzing.activity}
          amount={quizzing.amount}
          note={quizzing.note}
          onFinish={(quiz) =>
            checkOff(quizzing.kid, quizzing.activity, quizzing.amount, quizzing.note, quiz)}
          onEdit={() => {
            setQuizzing(null)
            setCheckingIn({
              kid: quizzing.kid, activity: quizzing.activity, quizzed: true, note: quizzing.note,
            })
          }}
          onClose={() => setQuizzing(null)}
        />
      )}

      {pinPrompt && (
        <PinGate
          pin={settings.parentPin}
          onUnlock={() => { setPinPrompt(false); setMode('parent') }}
          onClose={() => setPinPrompt(false)}
        />
      )}

      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}

      <div className="toasts">
        {toasts.map((t) => <div className="toast" key={t.id}>{t.message}</div>)}
      </div>
    </>
  )

  if (session === undefined) {
    return <div className="auth-screen"><Loader /></div>
  }
  if (!session) {
    if (authView === 'landing') {
      return <LandingScreen onSignUp={() => setAuthView('signup')} onSignIn={() => setAuthView('signin')} />
    }
    return <AuthScreen initialMode={authView} onBack={() => setAuthView('landing')} />
  }
  if (dataLoading) {
    return <div className="auth-screen"><Loader label="Loading your family…" /></div>
  }

  if (mode === 'kid') {
    return (
      <>
        <KidMode
          kids={sortedKids}
          byKid={byKid}
          byActivity={byActivity}
          today={today}
          settings={settings}
          onToggle={toggleActivity}
          onExit={leaveKidMode}
        />
        {modals}
      </>
    )
  }

  return (
    <div className="app">
      <div className="mobile-topbar">
        <Brand size={26} />
      </div>

      <MobileNav
        view={view}
        setView={setView}
        unread={unread}
        onNewKid={openNewKid}
        onKidMode={() => setMode('kid')}
      />

      <aside className="sidebar">
        <Brand />

        <button
          className="nav-item"
          aria-current={view.name === 'dashboard'}
          onClick={() => setView({ name: 'dashboard' })}
        >
          <span className="nav-icon"><Home size={17} /></span>
          <span className="nav-name">Today</span>
          <span className="nav-meta">G</span>
        </button>

        <button
          className="nav-item"
          aria-current={view.name === 'feed'}
          onClick={() => setView({ name: 'feed' })}
        >
          <span className="nav-icon"><Bell size={17} /></span>
          <span className="nav-name">Activity</span>
          {unread > 0 ? <span className="nav-pill">{unread}</span> : <span className="nav-meta">A</span>}
        </button>

        {sortedKids.length > 0 && <div className="nav-label">Kids</div>}
        {sortedKids.map((kid) => {
          const day = kidDay(byKid.get(kid.id) || [], byActivity, today)
          return (
            <button
              key={kid.id}
              className="nav-item"
              style={{ '--kid-color': colorVar(kid.colorSlot) }}
              aria-current={view.name === 'kid' && view.kidId === kid.id}
              onClick={() => setView({ name: 'kid', kidId: kid.id })}
            >
              <span className="nav-icon"><Avatar id={kid.avatar} size={17} /></span>
              <span className="nav-name">{kid.name}</span>
              <span className="nav-meta">{day.nothingDue ? '—' : `${day.done}/${day.total}`}</span>
            </button>
          )
        })}

        <div className="nav-footer">
          <button className="nav-item" onClick={openNewKid}>
            <span className="nav-icon"><Plus size={17} /></span>
            <span className="nav-name">Add a kid</span>
            <span className="nav-meta">N</span>
          </button>
          <button className="nav-item" onClick={() => setMode('kid')}>
            <span className="nav-icon"><Smile size={17} /></span>
            <span className="nav-name">Kid mode</span>
            <span className="nav-meta">K</span>
          </button>
          <button
            className="nav-item"
            aria-current={view.name === 'settings'}
            onClick={() => setView({ name: 'settings' })}
          >
            <span className="nav-icon"><Settings size={17} /></span>
            <span className="nav-name">Settings</span>
            <span className="nav-meta">,</span>
          </button>
        </div>
      </aside>

      <main className="main" key={view.name + (view.kidId || '')}>
        {view.name === 'dashboard' && (
          <>
            {kids.length > 0 && (
              <div className="page-head">
                <div>
                  <div className="eyebrow">{formatLong(today)}</div>
                  <h1 className="page-title">Today</h1>
                  <p className="page-sub">
                    Everything your kids check off lands here the moment they tap it!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={openNewKid}><Plus size={16} /> Add a kiddo</button>
                  <button className="btn btn-primary" onClick={() => setMode('kid')}>
                    <Smile size={16} /> Kid mode
                  </button>
                </div>
              </div>
            )}
            <ParentDashboard
              kids={sortedKids}
              byKid={byKid}
              byActivity={byActivity}
              today={today}
              settings={settings}
              onOpenKid={(id) => setView({ name: 'kid', kidId: id })}
              onToggle={toggleActivity}
              onNewKid={openNewKid}
            />
          </>
        )}

        {view.name === 'kid' && currentKid && (
          <KidDetail
            kid={currentKid}
            activities={byKid.get(currentKid.id) || []}
            byActivity={byActivity}
            today={today}
            onBack={() => setView({ name: 'dashboard' })}
            onEditKid={(kid) => setEditingKid({ kid, isNew: false })}
            onEditActivity={(activity) => setEditingActivity({ activity, kid: currentKid, isNew: false })}
            onNewActivity={openNewActivity}
            onToggle={toggleActivity}
          />
        )}

        {view.name === 'kid' && !currentKid && (
          <div className="empty">
            <h3>That kid is gone</h3>
            <button className="btn" onClick={() => setView({ name: 'dashboard' })}>Back to today</button>
          </div>
        )}

        {view.name === 'feed' && (
          <>
            <div className="page-head">
              <div>
                <div className="eyebrow">The record</div>
                <h1 className="page-title">Activity</h1>
                <p className="page-sub">
                  Every check-off, newest first. Checked something by mistake? Take it back out here.
                </p>
              </div>
            </div>
            <FeedView feed={feed} onDelete={deleteCompletion} />
          </>
        )}

        {view.name === 'settings' && (
          <>
            <div className="page-head">
              <div>
                <div className="eyebrow">Preferences</div>
                <h1 className="page-title">Settings</h1>
                <p className="page-sub">How you get told, and who can change what.</p>
              </div>
            </div>
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              state={state}
              email={session.user.email}
              parentName={session.user.user_metadata?.parent_name || ''}
              onSaveParentName={async (next) => {
                // Lives on the auth user, so it survives a wiped device the
                // way the email does — nothing in the family's own rows.
                const { data, error } = await supabase.auth.updateUser({ data: { parent_name: next } })
                if (error) { toast(error.message || 'Could not save your name'); return }
                if (data?.user) setSession((s) => (s ? { ...s, user: data.user } : s))
                toast(next ? 'Name saved' : 'Name removed')
              }}
              notifyState={notifyState}
              onEnableNotifications={enableNotifications}
              toast={toast}
              onSignOut={() => supabase.auth.signOut()}
              onImport={(next) => {
                setState(next)
                replaceAll(userId, next).catch(syncFail('Restored here, but the cloud sync failed'))
                toast('Backup restored')
                setView({ name: 'dashboard' })
              }}
              onLoadSample={loadSample}
              onClearAll={() => {
                const next = {
                  kids: [], activities: [], completions: [],
                  settings: { ...DEFAULT_SETTINGS, theme: settings.theme },
                }
                setState(next)
                replaceData(userId, next).catch(syncFail('Could not clear your cloud data'))
                putSettings(userId, next.settings).catch(syncFail('Could not clear your cloud data'))
                setView({ name: 'dashboard' })
                toast('Everything cleared')
              }}
            />
          </>
        )}
      </main>

      {modals}
    </div>
  )
}
