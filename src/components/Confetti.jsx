import { useEffect, useMemo, useState } from 'react'

const COLORS = [
  'var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)',
  'var(--series-5)', 'var(--series-6)', 'var(--series-7)', 'var(--series-8)',
]

/* Fires once when a kid finishes everything on their list, then removes
   itself. Purely decorative, so it is hidden from assistive tech and skipped
   entirely for anyone who has asked for reduced motion. */
export default function Confetti({ onDone }) {
  const [gone, setGone] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  const pieces = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 400,
      duration: 1700 + Math.random() * 900,
      color: COLORS[i % COLORS.length],
      tilt: Math.random() * 60 - 30,
    })),
    [],
  )

  useEffect(() => {
    if (gone) { onDone?.(); return }
    const t = setTimeout(() => { setGone(true); onDone?.() }, 2600)
    return () => clearTimeout(t)
  }, [gone, onDone])

  if (gone) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            transform: `rotate(${p.tilt}deg)`,
          }}
        />
      ))}
    </div>
  )
}
