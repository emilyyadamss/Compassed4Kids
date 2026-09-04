import { useState } from 'react'
import Modal from './Modal.jsx'
import { ActivityIcon, ACTIVITY_ICON_CHOICES } from '../lib/icons.jsx'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import {
  MEASURES, ACTIVITY_TEMPLATES, EVERY_DAY, SCHOOL_DAYS, WEEKENDS,
  QUIZ_QUESTIONS, normaliseDays, measureFor, colorVar,
  newQuizQuestion, normaliseQuestions, isCompleteQuestion, isStartedQuestion,
} from '../lib/model.js'
import { DAY_INITIALS, DAY_NAMES } from '../lib/date.js'

const PRESET_DAYS = [
  { label: 'Every day', days: EVERY_DAY },
  { label: 'School days', days: SCHOOL_DAYS },
  { label: 'Weekends', days: WEEKENDS },
]

export default function ActivityEditor({ activity, kid, isNew, onSave, onDelete, onClose }) {
  /* Questions are shaped once, on the way in, and then left alone while the
     parent types, trimming on every keystroke would eat the space they just
     pressed. They get trimmed again on the way out. */
  const [draft, setDraft] = useState(() => ({
    ...activity,
    questions: normaliseQuestions(activity.questions),
  }))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const measure = measureFor(draft)
  const days = normaliseDays(draft.days)

  /* ------------------------------------------------- the parent's questions */

  const questions = draft.questions
  const started = questions.filter(isStartedQuestion)
  const ready = started.filter(isCompleteQuestion)
  const unfinished = started.length - ready.length
  const onlyMine = ready.length > 0 && draft.questionsOnly === true
  const fromClaude = onlyMine ? 0 : Math.max(0, QUIZ_QUESTIONS - ready.length)

  const editQuestion = (id, patch) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }))

  const editOption = (id, index, value) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id === id ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) } : q,
      ),
    }))

  const addQuestion = () => set({ questions: [...questions, newQuizQuestion()] })
  const dropQuestion = (id) => set({ questions: questions.filter((q) => q.id !== id) })

  // A half-written question would be dropped silently on save, so it blocks
  // instead: the parent decides whether to finish it or throw it away.
  const canSave = draft.name.trim().length > 0 && unfinished === 0

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
            onClick={() =>
              onSave({
                ...draft,
                name: draft.name.trim(),
                description: (draft.description || '').trim(),
                days,
                // Rows the parent opened and never filled in are not a quiz,
                // and are not worth carrying around in the activity forever.
                questions: normaliseQuestions(questions).filter(isStartedQuestion),
              })}
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

        {/* Quizzing is off unless a parent turns it on, per activity. It is
            the right thing for reading and the wrong thing for chores, so it
            is a decision made here rather than once for the whole app. */}
        <div className="quiz-setup">
          <div className="switch" style={{ paddingTop: 0 }}>
            <div className="switch-copy">
              <div className="t">
                <Sparkles size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Ask questions afterwards
              </div>
              <div className="s">
                When {kid?.name || 'they'} finish this, they say what they did and answer{' '}
                {QUIZ_QUESTIONS} questions about it. The score comes to you. It is not done until
                they answer.
              </div>
            </div>
            <button
              className="toggle"
              role="switch"
              aria-checked={draft.quiz === true}
              aria-label="Ask questions afterwards"
              onClick={() => set({ quiz: !draft.quiz })}
            />
          </div>

          {/* Nothing is written from this once the parent has written the whole
              quiz themselves, so it stops claiming to be read. The text stays
              in the draft and comes back if they leave room for Claude
              again. */}
          {draft.quiz && fromClaude > 0 && (
            <div className="field" style={{ marginTop: 4 }}>
              <label htmlFor="act-description">What is this work, so the questions land?</label>
              <textarea
                id="act-description"
                className="input quiz-input"
                rows={3}
                value={draft.description || ''}
                placeholder="Fifth grade chapter books. Ask about the plot, the characters, and any word they might not know."
                onChange={(e) => set({ description: e.target.value })}
              />
              <p className="hint">
                Optional, but it is what keeps the questions on the subject you care about
                rather than whatever {kid?.name || 'your kid'} happens to mention.
              </p>
            </div>
          )}

          {/* Describing the work shapes the questions. Writing them yourself
              settles them. A parent who knows this week is the seven times
              table, or these six spelling words, should not have to hope a
              paragraph gets them there. */}
          {draft.quiz && (
            <div className="quiz-writer">
              <span className="label">Questions you write yourself</span>
              <p className="hint">
                {ready.length === 0
                  ? 'Optional. Anything you write here is asked first, word for word, exactly as you wrote it.'
                  : onlyMine
                    ? `Only your ${ready.length} question${ready.length === 1 ? '' : 's'} get asked. Nothing is written for you.`
                    : `Yours are asked first. The other ${fromClaude} are written from what ${kid?.name || 'your kid'} types.`}
              </p>

              {questions.map((q, i) => (
                <div className="quiz-own" key={q.id}>
                  <header>
                    <span>Question {i + 1}</span>
                    <button
                      className="btn btn-sm btn-ghost btn-icon"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() => dropQuestion(q.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </header>

                  <input
                    className="input"
                    value={q.question}
                    placeholder="What is 7 × 8?"
                    aria-label={`Question ${i + 1}`}
                    onChange={(e) => editQuestion(q.id, { question: e.target.value })}
                  />

                  {/* The letter is the answer key: tap the one that is right.
                      Four choices, always, a multiple-choice question with a
                      blank in it is not askable, so a half-filled row blocks
                      saving rather than quietly shipping. */}
                  <div
                    className="quiz-own-options"
                    role="radiogroup"
                    aria-label={`Which choice is right for question ${i + 1}?`}
                  >
                    {q.options.map((option, oi) => (
                      <div className="quiz-own-opt" key={oi}>
                        <button
                          className="quiz-own-key"
                          role="radio"
                          aria-checked={q.answer === oi}
                          aria-label={`Choice ${'ABCD'[oi]} is the right answer`}
                          onClick={() => editQuestion(q.id, { answer: oi })}
                        >
                          {'ABCD'[oi]}
                        </button>
                        <input
                          className="input"
                          value={option}
                          placeholder={`Choice ${'ABCD'[oi]}`}
                          aria-label={`Question ${i + 1}, choice ${'ABCD'[oi]}`}
                          onChange={(e) => editOption(q.id, oi, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    className="input"
                    value={q.because}
                    placeholder="Why, in one line, shown after they answer (optional)"
                    aria-label={`Why, for question ${i + 1}`}
                    onChange={(e) => editQuestion(q.id, { because: e.target.value })}
                  />
                </div>
              ))}

              {unfinished > 0 && (
                <p className="hint quiz-own-warn">
                  {unfinished === 1 ? 'One question is' : `${unfinished} questions are`} half
                  written. Every question needs its wording and all four choices, or you can
                  remove it.
                </p>
              )}

              {questions.length < QUIZ_QUESTIONS && (
                <button className="btn btn-sm quiz-own-add" onClick={addQuestion}>
                  <Plus size={14} /> {questions.length ? 'Add another' : 'Write a question'}
                </button>
              )}
              {ready.length === QUIZ_QUESTIONS && (
                <p className="hint">
                  That is the whole quiz, {QUIZ_QUESTIONS} questions, all yours and ready.
                </p>
              )}
            </div>
          )}

          {/* Only worth asking once they have written something, and only
              while there is still room for Claude to fill in. Write all ten
              and this decides itself. */}
          {draft.quiz && ready.length > 0 && ready.length < QUIZ_QUESTIONS && (
            <div className="switch">
              <div className="switch-copy">
                <div className="t">Ask only my questions</div>
                <div className="s">
                  {onlyMine
                    ? `A quiz of ${ready.length}, the same every time.`
                    : `Otherwise yours come first and ${fromClaude} more are written to go with them.`}
                </div>
              </div>
              <button
                className="toggle"
                role="switch"
                aria-checked={draft.questionsOnly === true}
                aria-label="Ask only my questions"
                onClick={() => set({ questionsOnly: !draft.questionsOnly })}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
