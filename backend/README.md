# ConsultBae Task 3 — Audio Collection Backend

This is the backend-first implementation for Task 3.

## What it does

1. Accepts `name`, `phone`, and an audio recording/file.
2. Finds the existing person in `consultbae_db.people` using name + phone.
3. Saves the actual audio file in `uploads/`.
4. Automatically extracts:
   - duration (seconds)
   - sample rate (kHz)
   - bitrate (kbps)
   - loudness (dB)
   - rough quality estimate (bonus)
5. Inserts the metadata and `person_id` into `audio_submissions`.
6. Provides an API to list all submissions and a browser-playable audio URL.

## Important

The audio binary is stored on disk, not inside MySQL.
MySQL stores the filename/path and extracted metadata.

## Windows setup

### 1. Create a virtual environment

```cmd
python -m venv venv
venv\Scripts\activate
```

### 2. Install Python packages

```cmd
pip install -r requirements.txt
```

### 3. Install FFmpeg

Make sure this command works:

```cmd
ffmpeg -version
```

If it does not, install FFmpeg and add its `bin` folder to Windows PATH.

### 4. Create `.env`

Copy `.env.example` to `.env` and put your MySQL password:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=consultbae_db
```

### 5. Verify the audio table

Run `schema_check.sql` in MySQL Workbench.

### 6. Start backend

```cmd
uvicorn main:app --reload
```

Backend:

http://127.0.0.1:8000

Interactive API docs:

http://127.0.0.1:8000/docs

## API

### POST /api/submissions

Multipart form:

- `name`
- `phone`
- `audio`

### GET /api/submissions

Returns all saved submissions and browser-playable audio URLs.

### GET /audio/<filename>

Streams the saved recording so the frontend can play it.
