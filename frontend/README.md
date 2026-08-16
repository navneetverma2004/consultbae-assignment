# ConsultBae — Audio Collection (Frontend)

A React + Vite frontend for the ConsultBae Task 3 audio collection app. It records audio
in the browser with the MediaRecorder API and submits it to the existing FastAPI backend,
then lists real submissions with the metadata the backend extracts (duration, sample rate,
bitrate, loudness, quality).

This project is **frontend only** — it does not implement, mock, or replace the backend.

## Stack

- React 19 + Vite
- Plain CSS with a shared design-token system (no UI framework)
- Axios for HTTP
- Browser `MediaRecorder` + `AudioContext` (for the live waveform) APIs

## Project structure

```
src/
  components/
    Header.jsx              top nav
    HeroBackground.jsx      animated orbs + signature "listening rings" visual
    RecordingCard.jsx       name/phone form + recorder + preview + submit flow
    Recorder.jsx            mic button, live waveform, timer
    AudioPlayer.jsx         custom play/pause/seek/volume player
    SubmissionCard.jsx      one submission's data + metadata
    LoadingSkeleton.jsx     skeleton cards while submissions load
  pages/
    RecordPage.jsx
    SubmissionsPage.jsx
  services/
    api.js                  central API config + all backend calls
  hooks/
    useRecorder.js          MediaRecorder wrapper (permissions, timer, blob, errors)
  App.jsx, main.jsx, index.css
```

## Getting started

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

Make sure the FastAPI backend is running first, at `http://127.0.0.1:8000` (see
`http://127.0.0.1:8000/docs` for its live API docs).

## Configuring the backend URL

The backend base URL is centralized — nothing is hardcoded per-file.

```bash
cp .env.example .env
```

`.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

`src/services/api.js` reads this via `import.meta.env.VITE_API_BASE_URL` and every
request (health check, list submissions, upload) goes through that one file.

## API integration

| Action | Method | Endpoint |
|---|---|---|
| Health check | `GET` | `/health` |
| List submissions | `GET` | `/api/submissions` |
| Create submission | `POST` | `/api/submissions` (multipart/form-data: `name`, `phone`, `audio`) |

- The recorded audio `Blob` is sent as-is (`recording.webm` by default, or whatever MIME
  type the browser's `MediaRecorder` picked) — the frontend never calculates duration,
  sample rate, bitrate, loudness, or quality. Those come back from the backend.
- `fetchSubmissions()` tolerates either a bare array response or an `{ submissions: [...] }`
  / `{ data: [...] }` envelope.
- `normalizeSubmission()` in `SubmissionsPage.jsx` reads a submission's fields under a
  few plausible key names (e.g. `sample_rate` or `sampleRate`, `audio_url` or
  `audio_path`) so the UI works against the real backend response without guessing at
  values that aren't there — any field the API omits renders as `—`.
- `resolveAudioUrl()` turns a relative audio path from the backend into an absolute URL
  so the custom `<AudioPlayer>` can stream the actual stored file.

If your backend's actual field names differ from the ones already covered, add them to
the `pick(...)` lists in `SubmissionsPage.jsx` — no other changes needed.

## CORS

The frontend runs on `http://localhost:5173`; the backend on `http://127.0.0.1:8000`.
If requests are blocked by CORS, add this to the FastAPI app (no other backend changes
needed):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Recording behavior & error handling

- Requests microphone permission on demand; shows a clear message if it's denied, if no
  microphone is found, or if the browser doesn't support `MediaRecorder`.
- Picks the best supported audio MIME type (`audio/webm;codecs=opus` and a few
  fallbacks) rather than assuming one.
- Cleans up the microphone stream, `AudioContext`, and any `Blob` object URL on stop,
  reset, and unmount.
- "Submit Audio" stays disabled until both the name/phone fields are valid **and** a
  recording exists, and shows an "Uploading audio…" loading state while the request is
  in flight, disabling duplicate submissions.
- Upload/network/server errors are shown as short, human-readable messages (never raw
  stack traces); a successful submission plays a short success animation, clears the
  form, and refreshes the submissions list.

## Accessibility & responsiveness

- Visible focus states, labelled form fields and controls, `aria-live`/`role="alert"`
  regions for status and errors.
- `prefers-reduced-motion` is respected globally — ambient and pulse animations are
  disabled when the user has requested reduced motion.
- Layout is responsive from mobile to desktop: the recording card and submission grid
  reflow to a single column on small screens, and all interactive targets stay
  comfortably tappable.

## Build

```bash
npm run build
npm run preview
```
