import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import Modal from './Modal.jsx'
import Loader from './Loader.jsx'
import { Avatar } from '../lib/icons.jsx'
import { colorVar, generatedCount } from '../lib/model.js'
import { generateQuiz, gradeQuiz } from '../lib/quiz.js'

/* Ten questions about the thing the kid just said they did — or however many
   there are, when a parent has written some or all of them by hand.

   This is the one screen in kid mode that can tell a parent something the kid
   did not choose to tell them, so it is built to be fair. It asks about the
   work and nothing else, it never shows a wrong answer mid-quiz (a child who
   has just been told they are failing answers the rest worse, and we would be
   measuring the quiz instead of the homework), and there is no timer.

   Nothing here is a dead end. If the questions cannot be written, or the
   service is down, the kid is let through with the reason recorded — losing a
   streak to our outage would be the app lying about the child. */
export default function QuizModal({ kid, activity, amount, note, onFinish, onEdit, onClose }) {
  // 'loading' | 'error' | 'thin' | 'asking' | 'scoring' | 'scored'
  const [phase, setPhase] = useState('loading')
  const [quiz, setQuiz] = useState(null)       // { questions, sealed, total }
  const [answers, setAnswers] = useState([])
  const [at, setAt] = useState(0)
  const [result, setResult] = useState(null)   // { score, total, results }
  const [error, setError] = useState('')

  const color = colorVar(kid?.colorSlot)

  /* Two mounts of the same quiz would be two Claude calls for one check-off.
     React 18's development double-invoke makes that the default, not the edge
     case, so the request is fired once and its result is tied to a live flag.

     The flag has to be raised on every mount, not just declared true once: in
     StrictMode the first mount's cleanup lowers it while refs survive into the
     second mount, and a flag left down there would leave the in-flight quiz
     with nowhere to land and the child watching a spinner forever. */
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])

  const ask = useCallback(() => {
    setPhase('loading')
    setError('')
    generateQuiz({ kid, activity, amount, note })
      .then((data) => {
        if (!live.current) return
        if (!data.enough) { setPhase('thin'); return }
        setQuiz(data)
        setAnswers(new Array(data.questions.length).fill(null))
        setAt(0)
        setPhase('asking')
      })
      .catch((err) => {
        if (!live.current) return
        setError(err.message || 'Something went wrong.')
        setPhase('error')
      })
  }, [kid, activity, amount, note])

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    ask()
  }, [ask])

  const answer = (choice) => {
    const next = answers.slice()
    next[at] = choice
    setAnswers(next)

    if (at + 1 < quiz.questions.length) { setAt(at + 1); return }

    setPhase('scoring')
    gradeQuiz({ sealed: quiz.sealed, answers: next })
      .then((data) => {
        if (!live.current) return
        setResult(data)
        setPhase('scored')
      })
      .catch((err) => {
        if (!live.current) return
        setError(err.message || 'Could not score that.')
        setPhase('error')
      })
  }

  /* What gets written onto the completion row: the whole quiz, right answers
     included, so a parent can see the entire test rather than take our word
     for the score. */
  const keep = () => {
    const questions = result.results.map((r, i) => {
      const q = quiz.questions[i]
      return {
        question: q.question,
        correct: r.correct,
        chose: r.chose == null ? '' : q.options[r.chose],
        answer: q.options[r.answer],
        because: r.because || '',
      }
    })

    onFinish({ score: result.score, total: result.total, at: new Date().toISOString(), questions })
  }

  const skip = (reason) => onFinish({ skipped: reason, at: new Date().toISOString() })

  /* ------------------------------------------------------------------ body */

  let title = `${activity.name} — quick questions`
  let body = null
  let footer = null

  if (phase === 'loading' || phase === 'scoring') {
    body = (
      <div style={{ padding: '18px 0' }}>
        {/* Nothing is being written when the parent wrote the quiz, so we do
            not claim it is. */}
        <Loader
          label={
            phase === 'scoring'
              ? 'Checking your answers…'
              : generatedCount(activity) > 0
                ? 'Writing your questions…'
                : 'Getting your questions…'
          }
        />
      </div>
    )
  }

  if (phase === 'error') {
    title = 'That did not work'
    body = (
      <div className="quiz-note">
        <p>{error}</p>
        <p className="hint">
          This is our problem, not yours. You can try again, or skip the questions, either
          way what you finished still counts.
        </p>
      </div>
    )
    footer = (
      <>
        <button className="btn btn-ghost" onClick={() => skip('error')}>Skip the questions</button>
        <button className="btn btn-primary" onClick={ask}>Try again</button>
      </>
    )
  }

  if (phase === 'thin') {
    title = 'Tell me a bit more'
    body = (
      <div className="quiz-note">
        <p>
          I could not make questions out of that. Say a little more about what you actually
          did — what you read, what it was about, what you worked on.
        </p>
        <p className="quiz-echo">&ldquo;{note}&rdquo;</p>
      </div>
    )
    footer = (
      <>
        <button className="btn btn-ghost" onClick={() => skip('vague')}>Skip the questions</button>
        <button className="btn btn-primary" onClick={onEdit}>Add more</button>
      </>
    )
  }

  if (phase === 'asking' && quiz) {
    const q = quiz.questions[at]
    const total = quiz.questions.length
    title = `Question ${at + 1} of ${total}`
    body = (
      <div>
        <div className="quiz-track" aria-hidden="true">
          <span style={{ width: `${(at / total) * 100}%` }} />
        </div>
        <p className="quiz-q">{q.question}</p>
        <div className="quiz-options">
          {q.options.map((option, i) => (
            <button key={i} className="quiz-option" onClick={() => answer(i)}>
              <span className="quiz-letter">{'ABCD'[i]}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'scored' && result) {
    const missed = result.results.filter((r) => !r.correct).length
    title = 'All done!'
    body = (
      <div>
        <div className="quiz-score">
          <span className="quiz-avatar"><Avatar id={kid?.avatar} size={30} /></span>
          <div>
            <div className="n">{result.score}<small> / {result.total}</small></div>
            <div className="s">
              {missed === 0
                ? 'Every single one. Nice work!'
                : missed === 1
                  ? 'One to look at again.'
                  : `${missed} to look at again.`}
            </div>
          </div>
        </div>

        {result.results.map((r, i) => {
          if (r.correct) return null
          const q = quiz.questions[i]
          return (
            <div className="quiz-review" key={i}>
              <div className="q">{q.question}</div>
              {r.chose != null && (
                <div className="a wrong"><X size={14} strokeWidth={3} /> {q.options[r.chose]}</div>
              )}
              <div className="a right"><Check size={14} strokeWidth={3} /> {q.options[r.answer]}</div>
              {r.because && <div className="why">{r.because}</div>}
            </div>
          )
        })}
      </div>
    )
    footer = (
      <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={keep}>
        <Sparkles size={16} /> Finish
      </button>
    )
  }

  return (
    <Modal title={title} onClose={onClose} width={520} footer={footer}>
      <div style={{ '--kid-color': color }}>{body}</div>
    </Modal>
  )
}
