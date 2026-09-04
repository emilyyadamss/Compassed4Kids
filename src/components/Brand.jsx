import { Check } from 'lucide-react'

export default function Brand({ size = 30, showName = true, className = 'brand' }) {
  return (
    <div className={className}>
      <span className="brand-mark" aria-hidden="true" style={{ width: size, height: size }}>
        <Check size={Math.round(size * 0.62)} strokeWidth={3.2} />
      </span>
      {showName && <span>Compassed for Kids</span>}
    </div>
  )
}
