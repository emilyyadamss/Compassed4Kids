/* The one piece of data visualisation a child sees. It answers exactly one
   question — how much of today is left — and answers it as a shape filling up,
   with the count spelled out beside it rather than as a percentage. */
export default function ProgressRing({ done, total, size = 62 }) {
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0

  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        className="ring-track"
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth="7"
      />
      <circle
        className="ring-fill"
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth="7"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text className="ring-label" x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
        {done}/{total}
      </text>
    </svg>
  )
}
