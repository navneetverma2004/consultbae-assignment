ConsultBae – AI Automation Assignment

Overview

This repository contains my solution for the ConsultBae AI Automation Assignment.

The solution covers:

Task 1: Consolidation of multiple CSV files into a clean MySQL people database

Task 2: n8n CSV-to-MySQL automation

Task 3: Browser-based audio collection and audio metadata extraction

Task 1 – Data Consolidation

Objective

Combine the supplied CSV datasets into one usable people database while handling duplicate records, missing values and inconsistent formatting.

Approach

The data was:

Standardized across the source CSVs.

Cleaned for whitespace, casing and missing values.

Matched using reliable available identifiers, especially email where available.

Checked for duplicate/overlapping people before inserting records.

Loaded into MySQL in a people table.

The final people table contains fields such as:

person_id
name
email
phone
city
experience_years
current_ctc
applied_date
skills
rate
rate_unit
hourly_rate
status
verified
projects_completed
created_at

Data Issues Report

Duplicate / overlapping records

The same person could appear in more than one CSV with slightly different information.

Handling: I compared available identifiers instead of treating every CSV row as a new person.

Missing identifiers

Some records did not contain complete identifying information.

Handling: I used the strongest available identifier and avoided making an unsafe match when there was not enough evidence.

Formatting differences

The files contained inconsistent capitalization, spaces and phone/email formatting.

Handling: values were normalized before matching and database insertion.

Conflicting values

The same person could have different values for some fields across source files.

Handling: I preserved the most useful/reliable available value rather than blindly overwriting information.

Task 2 – n8n CSV Automation

Objective

Build a working no-code/low-code automation that accepts CSV data and updates the people database.

Workflow

CSV Upload
    ↓
Webhook
    ↓
Parse CSV
    ↓
Map / Clean Fields
    ↓
Search Existing Person
    ↓
Existing?
   /    YES    NO
  ↓      ↓
Update  Insert
   \    /
    ↓  ↓
   MySQL

How it works

A CSV is uploaded through the webhook.

The CSV data is parsed.

Fields are mapped to the database structure.

The workflow checks whether the person already exists.

Existing records are handled without blindly creating duplicates.

New people are inserted into MySQL.

The database can then be checked to verify the result.

Important Decision

I used explicit field mapping rather than depending completely on automatic mapping because CSV files can contain inconsistent column names.

n8n Workflow

The exported workflow is included at:

n8n/consultbae-task2-workflow.json

To use it:

Open n8n.

Import the JSON workflow.

Reconnect the MySQL credential if required.

Configure the webhook/CSV input if required.

Execute the workflow with a test CSV.

No database passwords, API keys or other secrets are included in the repository.

Task 3 – Audio Collection App

Objective

Build a miniature audio collection application where a worker can record audio, submit it, and have audio metadata automatically extracted and stored.

Architecture

React Frontend
      ↓
FastAPI Backend
      ↓
Validate Person
      ↓
Save Audio
      ↓
FFmpeg Audio Analysis
      ↓
MySQL
      ↓
Submissions View

User Flow

Enter Name + Phone
        ↓
Start Recording
        ↓
Record in Browser
        ↓
Stop
        ↓
Preview Recording
        ↓
Submit
        ↓
Backend Validation
        ↓
Audio Storage + Metadata Extraction
        ↓
Database Record

Frontend

Built using:

React

Vite

JavaScript

Browser MediaRecorder API

Responsive UI

The application provides:

Name input

Phone input

Browser audio recording

Recording timer

Recording preview

Submit action

Error handling

Submissions view

Audio playback

Extracted audio properties

Backend

Built using:

Python

FastAPI

FFmpeg

MySQL

The backend handles:

Person validation

Audio upload

Audio storage

Metadata extraction

Database insertion

Submission listing

Audio playback

Audio Metadata

For every submitted recording, the backend automatically extracts and stores:

Property

Database field

Duration

duration_seconds

Sample rate

sample_rate_khz

Bitrate

bitrate_kbps

Loudness

loudness_db

Quality

quality_estimate

The quality estimate is a rough heuristic based on recording properties. It is not intended to be a professional acoustic/noise measurement.

Person Linking

The audio submission is linked to an existing person:

people.person_id
       ↑
       |
audio_submissions.person_id

Before saving an audio submission, the backend checks the supplied name and phone against the existing people table.

Existing person

Person found
    ↓
Audio accepted
    ↓
person_id stored

Unknown person

Person not found
    ↓
Submission rejected
    ↓
No orphan audio record

This behavior was tested successfully.

Multiple Recordings

The same existing person can submit multiple recordings.

Each recording gets a separate audio_submissions row while retaining the same person_id.

Database

The main tables used by the solution are:

people
audio_submissions

The audio_submissions table contains:

id
person_id
name
phone
audio_filename
audio_path
duration_seconds
sample_rate_khz
bitrate_kbps
loudness_db
quality_estimate
created_at

The relationship is:

people
  |
  | person_id
  ↓
audio_submissions

Local Setup

The assignment allows a local demonstration in the screen recording, so the working version can be run locally.

Prerequisites

Install:

Python 3.x

Node.js / npm

MySQL

FFmpeg

Verify FFmpeg:

ffmpeg -version

Backend Setup

cd backend
python -m venv venv
.env\Scriptsctivate
pip install -r requirements.txt

Create a .env file using .env.example and configure the MySQL connection.

Run:

uvicorn main:app --reload

Backend:

http://127.0.0.1:8000

Swagger API documentation:

http://127.0.0.1:8000/docs

Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

Configure the frontend API URL if required:

VITE_API_BASE_URL=http://127.0.0.1:8000

Testing Performed

Test 1 – Existing Person

Used an existing person from the database.

Result:

Record → Submit → Metadata extraction → MySQL → Playback

Successful.

Test 2 – Multiple Recordings

The same existing person submitted two recordings.

Both recordings were stored as separate rows with the same person_id.

Example metadata:

Recording 1
Duration:     12.90 sec
Sample rate:  48.00 kHz
Bitrate:      ~129 kbps
Loudness:     -18.00 dB
Quality:      Good

Recording 2
Duration:     14.52 sec
Sample rate:  48.00 kHz
Bitrate:      ~129 kbps
Loudness:     -23.10 dB
Quality:      Good

Test 3 – Unknown Person

Tested with a name/phone combination that did not exist in the people table.

Result:

Person not found

The submission was rejected and no audio_submissions record was created.

Test 4 – Playback

Submitted recordings appeared in the submissions view and could be played from the browser.

Stuck Log

This section records the main implementation problems, what I investigated, what I asked AI, what I changed, and which suggestions I deliberately rejected.

1. Browser WebM recording had no reliably detectable duration

What happened

The first version successfully recorded audio in the browser and successfully uploaded the .webm file to FastAPI.

The backend log showed that the file existed and had a non-zero size, but metadata extraction failed with an error similar to:

Could not determine audio duration.

This was confusing initially because the actual upload was working.

What I checked

I separated the pipeline into stages:

Browser recording
      ↓
HTTP upload
      ↓
File saved
      ↓
FFmpeg analysis
      ↓
Database insertion

The upload stage was confirmed because the .webm file appeared in the uploads directory.

I then checked FFmpeg installation and behavior using:

ffmpeg -version

and tested the uploaded recording with FFmpeg.

What I searched

I searched for issues around:

FFmpeg WebM duration extraction

MediaRecorder WebM duration metadata

Browser MediaRecorder generated WebM files

FFmpeg volumedetect

Extracting duration from WebM/Opus

What I asked AI

I asked AI why a browser-recorded .webm file could be saved successfully but still fail when duration was parsed from FFmpeg output.

The important explanation was that browser-generated WebM/Opus recordings can have incomplete or unusual container metadata, so relying on one human-readable FFmpeg header line for duration is fragile.

Solution

Instead of depending on the original FFmpeg text output for duration, I changed the analysis process:

Uploaded WebM
      ↓
FFmpeg converts WebM → WAV
      ↓
Python wave module reads WAV
      ↓
Frames / sample rate = duration

The sample rate is also read from the WAV metadata.

For bitrate, the original compressed file size and calculated duration are used.

For loudness, FFmpeg's volumedetect filter is used.

Suggestion I rejected

I rejected manually setting a fixed duration or estimating the duration from the frontend because the assignment specifically requires the metadata to be automatically extracted.

I also rejected hardcoding sample rate/bitrate because different recordings can have different properties.

Result

The application then successfully produced values such as:

Duration: 12.90 sec
Sample rate: 48.00 kHz
Bitrate: 128.92 kbps
Loudness: -18.00 dB
Quality: Good

and stored them in MySQL.

2. Making sure audio is associated with the correct person

What happened

The requirement was not simply to save an audio file. The recording had to become a record in the database from Task 1.

I therefore needed to decide how to prevent an audio submission from being associated with a person who did not exist.

What I considered

One option was to validate only in the React frontend.

I rejected this because frontend validation is not a reliable database rule. A request could still be sent directly to the API.

What I asked AI

I asked AI where the person validation should happen and how to maintain the relationship between:

people

and:

audio_submissions

Solution

I implemented the validation in FastAPI.

The backend receives:

name
phone
audio

Then:

name + phone
      ↓
find_person()
      ↓
existing person?

If found:

person_id
   ↓
save audio
   ↓
insert audio_submissions

If not found:

HTTP 404
Person not found

The database also uses a foreign key:

audio_submissions.person_id
        ↓
people.person_id

Test

I tested an existing person and successfully created multiple recordings.

I then tested a non-existing name/phone combination. The backend rejected it and did not create an orphan submission.

Result

The database relationship is now enforced at the backend/database level instead of relying only on the UI.

3. Deployment decision under the deadline

What happened

The assignment says:

Deploy it anywhere free (Render/Railway/Streamlit Cloud/ngrok during your video) or demo it running locally in your recording.

I initially started exploring Railway deployment and created a Railway MySQL service. I also installed the Railway CLI and created a secure MySQL tunnel.

At that point I realized that moving the database would also require careful consideration of the existing n8n connection, because n8n was already working against the local MySQL database.

What I investigated

I checked:

Railway MySQL

Railway CLI

Railway MySQL tunnel

MySQL Workbench connection

How the local database would be migrated

How n8n would need to be repointed if Railway became the production database

What I asked AI

I asked how to move the database to Railway without breaking the existing n8n workflow.

The answer was that simply creating a second Railway database would create two separate sources of truth. To fully productionize it, both the n8n workflow and audio backend would need to use the same production database.

Decision

I deliberately stopped the migration instead of changing the working n8n/database setup immediately before submission.

The reason is that the assignment explicitly permits a local demonstration, and the local application was already working end-to-end.

Suggestion rejected

I rejected continuing with a last-minute database migration just for the sake of deployment because it introduced unnecessary risk:

Working local system
       ↓
Change database
       ↓
Change n8n connection
       ↓
Change backend connection
       ↓
Retest everything

The local option was explicitly allowed, so I prioritized a reliable working demonstration.

Result

The final demo uses the working local setup and demonstrates the complete pipeline without risking the existing n8n integration.

Key Engineering Decisions

Backend validation instead of frontend-only validation

Prevents invalid/orphan audio submissions.

Existing person_id reused for multiple recordings

One person can submit many recordings without duplicating the person.

FFmpeg + WAV analysis for browser WebM

More reliable than depending only on WebM header text.

Explicit CSV field mapping in n8n

Reduces errors caused by inconsistent source column names.

Local demo instead of risky last-minute deployment

The assignment explicitly allows local demonstration.

What I Learned

Browser-recorded audio can have different metadata behavior from traditional audio files.

Debugging works better when the pipeline is broken into individual stages.

Important data relationships should be enforced by the backend/database.

AI suggestions are useful for debugging, but each suggestion still needs to be tested against the actual application.

A working, testable solution is more valuable than an untested last-minute deployment when local demonstration is explicitly allowed.

Repository Structure

consultbae-task3-audio-collection/
│
├── backend/
│   ├── main.py
│   ├── audio_utils.py
│   ├── db.py
│   ├── requirements.txt
│   ├── uploads/
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── n8n/
│   └── consultbae-task2-workflow.json
│
├── data/
├── README.md
└── .gitignore
