import './Recorder.css'

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Recorder({
  status,
  elapsedMs,
  levels,
  error,
  isSupported,
  onStart,
  onStop,
}) {
  const isRecording = status === 'recording'
  const isRequesting = status === 'requesting'

  return (
    <div className="recorder">
      <div className="recorder__stage">
        <div className={`recorder__ring ${isRecording ? 'is-recording' : ''}`}>
          <div className={`recorder__ring-pulse ${isRecording ? 'is-recording' : ''}`} />
          <button
            type="button"
            className={`recorder__mic ${isRecording ? 'is-recording' : ''}`}
            onClick={isRecording ? onStop : onStart}
            disabled={isRequesting || !isSupported}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                <path
                  d="M5 11a7 7 0 0 0 14 0M12 18v3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="recorder__status">
          {isRequesting && <span className="recorder__status-text">Requesting microphone access…</span>}
          {isRecording && (
            <span className="recorder__status-text recorder__status-text--live">
              <span className="dot" aria-hidden="true" /> Recording…
            </span>
          )}
          {status === 'idle' && <span className="recorder__status-text">Tap to start recording</span>}
          {status === 'stopped' && <span className="recorder__status-text">Recording ready</span>}
          <span className="recorder__timer mono">{formatElapsed(elapsedMs)}</span>
        </div>
      </div>

      <div className={`recorder__wave ${isRecording ? 'is-active' : ''}`} aria-hidden="true">
        {levels.map((level, i) => (
          <span
            key={i}
            className="recorder__wave-bar"
            style={{ transform: `scaleY(${isRecording ? Math.max(0.12, level) : 0.12})` }}
          />
        ))}
      </div>

      {!isSupported && (
        <p className="recorder__error" role="alert">
          Your browser doesn&apos;t support in-browser audio recording. Please try the latest Chrome, Edge, or
          Firefox.
        </p>
      )}
      {error && isSupported && (
        <p className="recorder__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
