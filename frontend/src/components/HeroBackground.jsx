import './HeroBackground.css'

/**
 * Signature visual: a layered "listening rings" motif — concentric arcs
 * radiating outward like sound travelling from a source, paired with soft
 * floating orbs for ambient depth. Pure CSS/SVG, no dependencies.
 */
export default function HeroBackground() {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-bg__orb hero-bg__orb--a" />
      <div className="hero-bg__orb hero-bg__orb--b" />
      <div className="hero-bg__orb hero-bg__orb--c" />

      <svg className="hero-bg__rings" viewBox="0 0 640 640" fill="none">
        <circle className="ring ring--1" cx="320" cy="320" r="90" />
        <circle className="ring ring--2" cx="320" cy="320" r="150" />
        <circle className="ring ring--3" cx="320" cy="320" r="215" />
        <circle className="ring ring--4" cx="320" cy="320" r="285" />
      </svg>
    </div>
  )
}
