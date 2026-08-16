import { useMemo, useState } from 'react'
import { useRecorder } from '../hooks/useRecorder'
import { submitAudio } from '../services/api'
import Recorder from './Recorder'
import AudioPlayer from './AudioPlayer'
import './RecordingCard.css'

const PHONE_PATTERN = /^[0-9+\-\s()]{7,15}$/

export default function RecordingCard({ onSubmitted }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState({ name: false, phone: false })
  const [submitState, setSubmitState] = useState('idle') // idle | submitting | success | error
  const [submitError, setSubmitError] = useState(null)

  const {
    status,
    isSupported,
    elapsedMs,
    audioBlob,
    audioUrl,
    error: recorderError,
    levels,
    startRecording,
    stopRecording,
    resetRecording,
  } = useRecorder()

  const nameError = touched.name && name.trim().length < 2 ? 'Please enter your full name.' : null
  const phoneError =
    touched.phone && !PHONE_PATTERN.test(phone.trim()) ? 'Please enter a valid phone number.' : null

  const hasRecording = status === 'stopped' && !!audioBlob
  const isFormValid = name.trim().length >= 2 && PHONE_PATTERN.test(phone.trim())
  const canSubmit = isFormValid && hasRecording && submitState !== 'submitting'

  const durationLabel = useMemo(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [elapsedMs])

  const handleRecordAgain = () => {
    resetRecording()
    setSubmitState('idle')
    setSubmitError(null)
  }

  const handleSubmit = async () => {
    setTouched({ name: true, phone: true })
    if (!isFormValid || !audioBlob) return

    setSubmitState('submitting')
    setSubmitError(null)
    try {
      await submitAudio({ name: name.trim(), phone: phone.trim(), audioBlob })
      setSubmitState('success')
      onSubmitted?.()
      setTimeout(() => {
        resetRecording()
        setName('')
        setPhone('')
        setTouched({ name: false, phone: false })
        setSubmitState('idle')
      }, 2200)
    } catch (err) {
      setSubmitState('error')
      setSubmitError(err.message || 'Unable to upload audio. Please try again.')
    }
  }

  return (
    <div className="recording-card">
      {submitState === 'success' ? (
        <div className="recording-card__success" role="status">
          <div className="recording-card__success-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12.5 9.5 18 20 6.5"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>Audio submitted successfully</h3>
          <p>Thanks — your recording has been sent for processing.</p>
        </div>
      ) : (
        <>
          <div className="recording-card__fields">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                aria-invalid={!!nameError}
                autoComplete="name"
              />
              {nameError && <span className="field__error">{nameError}</span>}
            </div>

            <div className="field">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9000000254"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                aria-invalid={!!phoneError}
                autoComplete="tel"
              />
              {phoneError && <span className="field__error">{phoneError}</span>}
            </div>
          </div>

          <div className="recording-card__divider" />

          {!hasRecording ? (
            <Recorder
              status={status}
              elapsedMs={elapsedMs}
              levels={levels}
              error={recorderError}
              isSupported={isSupported}
              onStart={startRecording}
              onStop={stopRecording}
            />
          ) : (
            <div className="recording-card__preview">
              <p className="recording-card__ready">
                Recording ready <span className="mono">· {durationLabel}</span>
              </p>
              <AudioPlayer src={audioUrl} />
            </div>
          )}

          {submitState === 'error' && submitError && (
            <p className="recording-card__submit-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="recording-card__actions">
            {hasRecording && (
              <button type="button" className="btn btn--ghost" onClick={handleRecordAgain}>
                Record Again
              </button>
            )}
            <button
              type="button"
              className={`btn btn--primary ${submitState === 'submitting' ? 'is-loading' : ''}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitState === 'submitting' ? (
                <>
                  <span className="btn__spinner" aria-hidden="true" />
                  Uploading audio…
                </>
              ) : (
                'Submit Audio'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
