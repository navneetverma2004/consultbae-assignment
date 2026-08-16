import axios from 'axios'

// Central API configuration — every request in the app goes through this file.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const client = axios.create({
  baseURL: API_BASE_URL,
})

/**
 * Resolves a possibly-relative audio path returned by the backend into an
 * absolute URL the <audio> element can play.
 */
export function resolveAudioUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function toFriendlyError(error, fallback) {
  if (error.response) {
    const data = error.response.data
    const detail =
      (data && (data.detail || data.message)) ||
      (typeof data === 'string' ? data : null)
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
    if (error.response.status === 404) {
      return 'Person not found. Please check your name and phone number.'
    }
    if (error.response.status >= 500) {
      return 'The server ran into a problem. Please try again in a moment.'
    }
  }
  if (error.request && !error.response) {
    return 'Unable to reach the server. Make sure the backend is running and try again.'
  }
  return fallback
}

export async function checkHealth() {
  const res = await client.get('/health')
  return res.data
}

export async function fetchSubmissions() {
  try {
    const res = await client.get('/api/submissions')
    const data = res.data
    // Be tolerant of either a bare array or a { submissions: [...] } envelope.
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.submissions)) return data.submissions
    if (Array.isArray(data?.data)) return data.data
    return []
  } catch (error) {
    throw new Error(toFriendlyError(error, 'Unable to load submissions. Please try again.'))
  }
}

export async function submitAudio({ name, phone, audioBlob, fileName = 'recording.webm' }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('phone', phone)
  formData.append('audio', audioBlob, fileName)

  try {
    const res = await client.post('/api/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  } catch (error) {
    throw new Error(toFriendlyError(error, 'Unable to upload audio. Please try again.'))
  }
}
