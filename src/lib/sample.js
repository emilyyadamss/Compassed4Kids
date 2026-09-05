/* A sample family, so the dashboard has something to say before a parent has
   typed anything in. Three weeks of history with realistic holes — nobody
   reads every single night, and a dashboard that pretends otherwise is no use
   for spotting the night they didn't. */

import { newKid, newActivity, newCompletion, SCHOOL_DAYS, EVERY_DAY, isScheduled } from './model.js'
import { addDays, todayKey, fromKey } from './date.js'

const DAYS_OF_HISTORY = 21

/* Maya's reading is the one quizzed activity in the sample, so the feature has
   something to show before a parent has set anything up themselves. These are
   the notes she "typed" — the sentences the questions would have been written
   from — and they cycle so three weeks of evenings do not all read alike. */
const SAMPLE_NOTES = [
  'I read two chapters of Because of Winn-Dixie. Opal found the dog in the grocery store and asked the manager if she could keep him.',
  'Charlotte\'s Web, chapters 5 and 6. Charlotte explained how she catches flies in her web and Wilbur thought it was cruel at first.',
  'I read about the Boxcar Children finding the blue tablecloth and the cracked pink cup in the dump.',
  'Frindle, chapter 4. Nick made up a new word for pen and got the whole class saying it to annoy Mrs Granger.',
  'Two chapters of Sarah, Plain and Tall. Sarah wrote back to Papa and said she would come and that she sings.',
]

/* A completion is stamped at a plausible hour rather than "now", so the feed
   reads like three weeks of evenings instead of three weeks logged at once. */
function stampFor(dateKey, hour, minute) {
  const d = fromKey(dateKey)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/* Deterministic per (activity, day) — the sample looks the same each time it's
   loaded, so a parent comparing two screenshots isn't chasing noise. */
function hash(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

export function buildSample() {
  const today = todayKey()

  const maya = { ...newKid(0), name: 'Maya', grade: '4th grade' }
  const theo = { ...newKid(1), name: 'Theo', grade: '2nd grade' }
  const kids = [maya, theo]

  /* Each activity carries a stable seed built from who it belongs to and what
     it is called — never its id, which is a fresh UUID every time. Seeding on
     the id would make "the same" sample look different on every load. */
  const activities = [
    newActivity(maya.id, { name: 'Homework', icon: 'homework', measure: 'done', days: SCHOOL_DAYS }, 0),
    newActivity(maya.id, { name: 'Kumon math', icon: 'kumon', measure: 'worksheets', target: 2, days: EVERY_DAY }, 1),
    newActivity(maya.id, {
      name: 'Reading', icon: 'reading', measure: 'minutes', target: 20, days: EVERY_DAY,
      quiz: true,
      description: 'Fourth grade chapter books. Ask about what happened, who did it, and any '
        + 'word she might have had to work out from context.',
    }, 2),
    newActivity(maya.id, { name: 'Piano practice', icon: 'piano', measure: 'minutes', target: 30, days: SCHOOL_DAYS }, 3),

    newActivity(theo.id, { name: 'Homework', icon: 'homework', measure: 'done', days: SCHOOL_DAYS }, 0),
    newActivity(theo.id, { name: 'Reading', icon: 'reading', measure: 'minutes', target: 15, days: EVERY_DAY }, 1),
    newActivity(theo.id, { name: 'Spelling words', icon: 'spelling', measure: 'done', days: SCHOOL_DAYS }, 2),
    newActivity(theo.id, { name: 'Feed the cat', icon: 'pet', measure: 'done', days: EVERY_DAY }, 3),
  ]

  /* How reliably each activity actually happens, and when in the evening. The
     piano number is low on purpose: it gives the "needs a nudge" section
     something true to point at. */
  const habit = {
    'Homework':       { rate: 0.92, hour: 16, minute: 40 },
    'Kumon math':     { rate: 0.85, hour: 17, minute: 15 },
    'Reading':        { rate: 0.8,  hour: 19, minute: 45 },
    'Piano practice': { rate: 0.55, hour: 18, minute: 10 },
    'Spelling words': { rate: 0.88, hour: 17, minute: 0 },
    'Feed the cat':   { rate: 0.95, hour: 7,  minute: 30 },
  }

  const nameOf = new Map(kids.map((k) => [k.id, k.name]))

  const completions = []
  for (const activity of activities) {
    const { rate, hour, minute } = habit[activity.name]
    const seed = `${nameOf.get(activity.kidId)}:${activity.name}`
    for (let back = DAYS_OF_HISTORY; back >= 0; back--) {
      const key = addDays(today, -back)
      if (!isScheduled(activity, key)) continue

      const roll = hash(`${seed}:${key}`)
      // Today is still in progress: only the early-evening things have landed.
      if (back === 0 && hour > 18) continue
      if (roll > rate) continue

      // A little spread around the target, never a suspicious exact number.
      const spread = hash(`amt:${seed}:${key}`)
      const target = activity.target
      const amount = target > 0 ? Math.max(1, Math.round(target * (0.7 + spread * 0.6))) : 0

      const c = newCompletion(activity.kidId, activity.id, key, amount)
      c.completedAt = stampFor(key, hour, Math.round(minute + spread * 20))

      /* A quizzed activity carries what she said she did and how she scored.
         Deterministic like everything else here, and weighted high without
         being perfect — a sample where every score is 10/10 would not show a
         parent what the feature is actually for. */
      if (activity.quiz) {
        const roll2 = hash(`quiz:${seed}:${key}`)
        const score = 6 + Math.floor(roll2 * 5) // 6 to 10
        c.note = SAMPLE_NOTES[Math.floor(hash(`note:${seed}:${key}`) * SAMPLE_NOTES.length)]
        c.quiz = {
          score,
          total: 10,
          at: c.completedAt,
          questions: Array.from({ length: 10 }, (_, i) => ({
            question: `Question ${i + 1} about tonight's reading.`,
            correct: i < score,
            chose: i < score ? 'What she picked' : 'What she picked instead',
            answer: 'What the book actually said',
            because: i < score ? '' : 'Because that is what happened in the chapter.',
          })),
        }
      }

      completions.push(c)
    }
  }

  return { kids, activities, completions }
}
