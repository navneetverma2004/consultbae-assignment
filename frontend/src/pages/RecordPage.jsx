import HeroBackground from '../components/HeroBackground'
import RecordingCard from '../components/RecordingCard'
import './RecordPage.css'

export default function RecordPage({ onSubmitted }) {
  return (
    <section className="record-page">
      <div className="record-page__hero">
        <HeroBackground />
        <div className="container record-page__hero-inner">
          <span className="eyebrow">Browser-based · No install required</span>
          <h1>Capture Your Voice</h1>
          <p className="record-page__subtitle">
            Record your audio directly in your browser and submit it securely.
          </p>
        </div>
      </div>

      <div className="container record-page__body">
        <RecordingCard onSubmitted={onSubmitted} />
      </div>
    </section>
  )
}
