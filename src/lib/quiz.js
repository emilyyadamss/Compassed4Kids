/* The browser half of the quiz. Everything interesting happens in
   `api/quiz.js` — this file only carries the family's session up to it, so
   that endpoint can tell a signed-in parent's tablet from the open internet.

   The Claude API key is deliberately not reachable from here. If you are
   looking for it, it is an `ANTHROPIC_API_KEY` on the server and it never
   comes down the wire. */

import { supabase } from './supabaseClient.js'
import { ownQuestions, quizLength } from './model.js'

async function post(body) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('You are signed out. Sign in and try again.')

  let res
  try {
    res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the quiz service. Check the internet.')
  }

  const payload = await res.json().catch(() => ({}))
  /* The server says no in two ways: an HTTP error for anything about the
     request, and ok:false inside a 200 for a quiz that simply cannot be
     graded any more. Both are the same thing to a caller. */
  if (!res.ok) throw new Error(payload.error || `The quiz service answered ${res.status}.`)
  if (payload.ok === false) throw new Error(payload.error || 'That quiz could not be read.')
  return payload
}

/** Five or ten questions, whichever this activity is set to, about what this
    kid says they just did, plus a sealed answer key to hand back to
    `gradeQuiz`. `enough` is false when the note was too thin to write real
    questions from.

    Any questions the parent wrote themselves go up with the request. The
    server decides what to do with them — asks them first, and works out how
    many it still needs from Claude — so that rule lives in one place rather
    than being agreed on by both halves. */
export function generateQuiz({ kid, activity, amount, note }) {
  return post({
    action: 'generate',
    activity: activity.name,
    description: activity.description || '',
    measure: activity.measure,
    target: activity.target,
    amount,
    note,
    kidName: kid?.name || '',
    grade: kid?.grade || '',
    total: quizLength(activity),
    questions: ownQuestions(activity).map((q) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      because: q.because,
    })),
    only: activity.questionsOnly === true,
  })
}

/** Answers in, score out. The answer key was never in the browser, so this is
    the only thing that knows whether the kid was right. */
export function gradeQuiz({ sealed, answers }) {
  return post({ action: 'grade', sealed, answers })
}
