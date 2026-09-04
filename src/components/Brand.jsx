import BrandMark from './BrandMark.jsx'

export default function Brand({ size = 30, showName = true, className = 'brand' }) {
  return (
    <div className={className}>
      <span className="brand-mark" aria-hidden="true" style={{ width: size, height: size }}>
        <BrandMark size={size} />
      </span>
      {showName && <span>Compassed 4 Kids</span>}
    </div>
  )
}
