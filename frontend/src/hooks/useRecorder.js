import { useCallback, useEffect, useRef, useState } from 'react'

const CANDIDATE_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
]

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const type of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported?.(type)) return type
  }
  return ''
}

/**
 * Encapsulates browser microphone recording via MediaRecorder.
 * Returns state + controls used by the Recorder component.
 */
export function useRecorder() {
  const [status, setStatus] = useState('idle') // idle | requesting | recording | stopped | error
  const [elapsedMs, setElapsedMs] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState(null)
  const [levels, setLevels] = useState(Array(24).fill(0.08))

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(0)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)

  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stopVisualizer = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    analyserRef.current = null
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
  }, [])

  const runVisualizer = useCallback((stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioContextClass()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const bars = 24

      const tick = () => {
        analyser.getByteFrequencyData(dataArray)
        const step = Math.floor(dataArray.length / bars) || 1
        const next = new Array(bars)
        for (let i = 0; i < bars; i++) {
          const v = dataArray[i * step] / 255
          next[i] = Math.max(0.08, v)
        }
        setLevels(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      // Visualization is a nice-to-have; ignore failures silently.
    }
  }, [])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 100)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)

    if (!isSupported) {
      setStatus('error')
      setError('Audio recording is not supported in this browser. Try the latest Chrome, Edge, or Firefox.')
      return
    }

    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickSupportedMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        stopTimer()
        stopVisualizer()
        cleanupStream()

        if (chunksRef.current.length === 0) {
          setStatus('error')
          setError('The recording came out empty. Please try again.')
          return
        }

        const blobType = mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setStatus('stopped')
      }

      recorder.onerror = () => {
        stopTimer()
        stopVisualizer()
        cleanupStream()
        setStatus('error')
        setError('Something went wrong while recording. Please try again.')
      }

      mediaRecorderRef.current = recorder
      recorder.start(250)
      setElapsedMs(0)
      startTimer()
      runVisualizer(stream)
      setStatus('recording')
    } catch (err) {
      setStatus('error')
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone permission and try again.')
      } else if (err?.name === 'NotFoundError') {
        setError('No microphone was found on this device.')
      } else {
        setError('Unable to access the microphone. Please try again.')
      }
    }
  }, [isSupported, cleanupStream, runVisualizer, startTimer, stopTimer, stopVisualizer])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setElapsedMs(0)
    setStatus('idle')
    setError(null)
    setLevels(Array(24).fill(0.08))
  }, [audioUrl])

  useEffect(() => {
    return () => {
      stopTimer()
      stopVisualizer()
      cleanupStream()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    status,
    isSupported,
    elapsedMs,
    audioBlob,
    audioUrl,
    error,
    levels,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
