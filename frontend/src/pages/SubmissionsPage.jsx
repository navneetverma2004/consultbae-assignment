import { useEffect, useMemo, useState, useCallback } from 'react'
import { fetchSubmissions, resolveAudioUrl } from '../services/api'
import SubmissionCard from '../components/SubmissionCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import './SubmissionsPage.css'

function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
  }
  return undefined
}

function formatDuration(value) {
  if (value === undefined) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${num.toFixed(2)} sec`
}

function formatSampleRate(value) {
  if (value === undefined) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  // Backend may return Hz or kHz — normalize to kHz for display.
  const khz = num > 1000 ? num / 1000 : num
  return `${khz.toFixed(1)} kHz`
}

function formatBitrate(value) {
  if (value === undefined) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  const kbps = num > 10000 ? num / 1000 : num
  return `${Math.round(kbps)} kbps`
}

function formatLoudness(value) {
  if (value === undefined) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${num.toFixed(1)} dB`
}

/**
 * Normalizes a submission record from the backend into the shape the UI
 * expects, tolerating a range of plausible field-naming conventions
 * without inventing any values that aren't present in the API response.
 */
function normalizeSubmission(raw, index) {
  const id = pick(raw, ['id', 'submission_id', 'uuid', '_id']) ?? index
  const name = pick(raw, ['name', 'full_name', 'user_name'])
  const phone = pick(raw, ['phone', 'phone_number', 'mobile'])
  const audioPath = pick(raw, ['audio_url', 'audio_path', 'file_url', 'file_path', 'audio', 'url'])
  const duration = pick(raw, ['duration', 'duration_sec', 'duration_seconds'])
  const sampleRate = pick(raw, ['sample_rate', 'sample_rate_khz', 'sampleRate'])
  const bitrate = pick(raw, ['bitrate', 'bit_rate', 'bitrate_kbps'])
  const loudness = pick(raw, ['loudness', 'loudness_db', 'volume_db'])
  const quality = pick(raw, ['quality', 'quality_estimate', 'noise_estimate', 'quality_label'])
  const createdAt = pick(raw, ['created_at', 'createdAt', 'submitted_at', 'timestamp'])

  return {
    id,
    name,
    phone,
    audioUrl: resolveAudioUrl(audioPath),
    duration: formatDuration(duration),
    sampleRate: formatSampleRate(sampleRate),
    bitrate: formatBitrate(bitrate),
    loudness: formatLoudness(loudness),
    quality,
    createdAt,
  }
}

export default function SubmissionsPage({ refreshToken }) {
  const [submissions, setSubmissions] = useState([])
  const [loadState, setLoadState] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoadState('loading')
    setErrorMessage(null)
    try {
      const data = await fetchSubmissions()
      const normalized = data.map(normalizeSubmission).reverse()
      setSubmissions(normalized)
      setLoadState('ready')
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load submissions. Please try again.')
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return submissions
    return submissions.filter((s) => (s.name || '').toLowerCase().includes(q))
  }, [submissions, query])

  return (
    <section className="submissions-page">
      <div className="container">
        <div className="submissions-page__header">
          <div>
            <h1>Audio Submissions</h1>
            <p className="submissions-page__subtitle">
              Review submitted recordings and their extracted audio properties.
            </p>
          </div>
          <button type="button" className="btn-refresh" onClick={load} disabled={loadState === 'loading'}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={loadState === 'loading' ? 'spin' : ''}
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v6h-6" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="submissions-page__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search submissions by name"
          />
        </div>

        {loadState === 'loading' && <LoadingSkeleton />}

        {loadState === 'error' && (
          <div className="state-panel state-panel--error" role="alert">
            <h3>Couldn&apos;t load submissions</h3>
            <p>{errorMessage}</p>
            <button type="button" className="btn btn--primary" onClick={load} style={{ maxWidth: 180 }}>
              Try again
            </button>
          </div>
        )}

        {loadState === 'ready' && filtered.length === 0 && submissions.length === 0 && (
          <div className="state-panel">
            <h3>No audio submissions yet.</h3>
            <p>Recordings will appear here as soon as they&apos;re submitted.</p>
          </div>
        )}

        {loadState === 'ready' && filtered.length === 0 && submissions.length > 0 && (
          <div className="state-panel">
            <h3>No matches for &quot;{query}&quot;</h3>
            <p>Try a different name.</p>
          </div>
        )}

        {loadState === 'ready' && filtered.length > 0 && (
          <div className="submissions-grid">
            {filtered.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
