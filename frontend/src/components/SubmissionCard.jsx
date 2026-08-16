import AudioPlayer from './AudioPlayer'
import './SubmissionCard.css'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function qualityTone(quality) {
  if (!quality) return 'neutral'
  const v = String(quality).toLowerCase()
  if (v.includes('good') || v.includes('excellent') || v.includes('clean')) return 'good'
  if (v.includes('fair') || v.includes('moderate') || v.includes('average')) return 'fair'
  if (v.includes('poor') || v.includes('noisy') || v.includes('bad')) return 'poor'
  return 'neutral'
}

export default function SubmissionCard({ submission }) {
  const {
    name,
    phone,
    audioUrl,
    duration,
    sampleRate,
    bitrate,
    loudness,
    quality,
    createdAt,
  } = submission

  const tone = qualityTone(quality)

  return (
    <article className="submission-card">
      <div className="submission-card__head">
        <div>
          <h3>{name || 'Unknown'}</h3>
          <p className="submission-card__phone mono">{phone || '—'}</p>
        </div>
        <span className="submission-card__date">{formatDate(createdAt)}</span>
      </div>

      <AudioPlayer src={audioUrl} compact />

      <dl className="submission-card__grid">
        <div className="metric">
          <dt>Duration</dt>
          <dd className="mono">{duration ?? '—'}</dd>
        </div>
        <div className="metric">
          <dt>Sample Rate</dt>
          <dd className="mono">{sampleRate ?? '—'}</dd>
        </div>
        <div className="metric">
          <dt>Bitrate</dt>
          <dd className="mono">{bitrate ?? '—'}</dd>
        </div>
        <div className="metric">
          <dt>Loudness</dt>
          <dd className="mono">{loudness ?? '—'}</dd>
        </div>
      </dl>

      <div className={`submission-card__quality quality--${tone}`}>
        <span className="quality__dot" aria-hidden="true" />
        Quality: {quality ?? 'Not available'}
      </div>
    </article>
  )
}
