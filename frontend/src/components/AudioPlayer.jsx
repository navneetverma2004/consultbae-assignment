import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function AudioPlayer({ src, compact = false }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setLoadError(false)
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setLoadError(true))
    }
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const value = Number(e.target.value)
    audio.currentTime = value
    setCurrentTime(value)
  }

  const handleVolume = (e) => {
    const value = Number(e.target.value)
    setVolume(value)
    if (audioRef.current) audioRef.current.volume = value
  }

  const progressPct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className={`audio-player ${compact ? 'audio-player--compact' : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onError={() => setLoadError(true)}
      />

      <button
        type="button"
        className="audio-player__toggle"
        onClick={togglePlay}
        disabled={loadError || !src}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 5.6v12.8a1 1 0 0 0 1.5.87l11-6.4a1 1 0 0 0 0-1.74l-11-6.4A1 1 0 0 0 7 5.6Z" />
          </svg>
        )}
      </button>

      <div className="audio-player__track">
        <input
          type="range"
          className="audio-player__range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          disabled={loadError || !src || !duration}
          style={{ '--progress': `${progressPct}%` }}
          aria-label="Seek"
        />
        <div className="audio-player__time mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {!compact && (
        <div className="audio-player__volume">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 9v6h4l5 5V4L8 9H4Z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolume}
            aria-label="Volume"
          />
        </div>
      )}

      {loadError && <span className="audio-player__error">Audio unavailable</span>}
    </div>
  )
}
