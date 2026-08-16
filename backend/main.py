import uuid
import shutil
from pathlib import Path

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from db import (
    find_person,
    insert_audio_submission,
    get_all_submissions,
)

from audio_utils import analyze_audio


# ============================================================
# Load environment variables
# ============================================================

load_dotenv()


# ============================================================
# Directories
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"

# Create uploads directory if it doesn't exist
UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="ConsultBae Task 3 - Audio Collection API",
    description=(
        "Audio collection backend for ConsultBae Task 3. "
        "Users can submit browser recordings and the system "
        "automatically extracts audio metadata."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Serve saved audio files
# ============================================================

# Example:
# http://127.0.0.1:8000/audio/abc123.webm

app.mount(
    "/audio",
    StaticFiles(
        directory=str(UPLOAD_DIR)
    ),
    name="audio",
)


# ============================================================
# Root Endpoint
# ============================================================

@app.get("/")
def root():
    return {
        "message": "ConsultBae Task 3 backend is running",
        "docs": "/docs",
        "health": "/health",
        "submissions": "/api/submissions",
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# ============================================================
# Create Audio Submission
# ============================================================

@app.post("/api/submissions")
async def create_submission(
    name: str = Form(...),
    phone: str = Form(...),
    audio: UploadFile = File(...),
):
    """
    Create a new audio submission.

    Flow:

    1. Receive name + phone + audio
    2. Find existing person in people table
    3. Save audio file
    4. Extract duration
    5. Extract sample rate
    6. Extract bitrate
    7. Extract loudness
    8. Calculate rough quality estimate
    9. Store everything in audio_submissions
    10. Return submission details
    """

    # --------------------------------------------------------
    # 1. Validate name
    # --------------------------------------------------------

    clean_name = name.strip()

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )


    # --------------------------------------------------------
    # 2. Validate phone
    # --------------------------------------------------------

    clean_phone = phone.strip()

    if not clean_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is required.",
        )


    # --------------------------------------------------------
    # 3. Validate uploaded file
    # --------------------------------------------------------

    if not audio:
        raise HTTPException(
            status_code=400,
            detail="Audio file is required.",
        )


    if not audio.filename:
        raise HTTPException(
            status_code=400,
            detail="Audio filename is missing.",
        )


    # --------------------------------------------------------
    # 4. Find existing person
    # --------------------------------------------------------

    try:

        person = find_person(
            clean_name,
            clean_phone,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error while finding person: "
                f"{exc}"
            ),
        ) from exc


    # --------------------------------------------------------
    # Person must already exist
    # --------------------------------------------------------

    if not person:

        raise HTTPException(
            status_code=404,
            detail=(
                "Person not found in people table "
                "for the given name and phone."
            ),
        )


    # --------------------------------------------------------
    # 5. Determine file extension
    # --------------------------------------------------------

    original_extension = Path(
        audio.filename
    ).suffix.lower()


    allowed_extensions = {
        ".webm",
        ".wav",
        ".mp3",
        ".m4a",
        ".ogg",
        ".mp4",
        ".aac",
    }


    if original_extension not in allowed_extensions:

        # Browser MediaRecorder normally produces WebM
        original_extension = ".webm"


    # --------------------------------------------------------
    # 6. Generate unique filename
    # --------------------------------------------------------

    stored_filename = (
        f"{uuid.uuid4().hex}"
        f"{original_extension}"
    )


    stored_path = (
        UPLOAD_DIR / stored_filename
    )


    # --------------------------------------------------------
    # 7. Save audio file
    # --------------------------------------------------------

    try:

        with stored_path.open(
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                audio.file,
                buffer,
            )


        # ----------------------------------------------------
        # 8. Verify saved file
        # ----------------------------------------------------

        if not stored_path.exists():

            raise RuntimeError(
                "Audio file was not saved."
            )


        file_size = stored_path.stat().st_size


        if file_size == 0:

            raise RuntimeError(
                "Uploaded audio file is empty."
            )


        print(
            "----------------------------------------"
        )

        print(
            f"Audio saved: {stored_path}"
        )

        print(
            f"Audio size: {file_size} bytes"
        )


        # ----------------------------------------------------
        # 9. Analyze audio
        # ----------------------------------------------------

        metadata = analyze_audio(
            stored_path
        )


        print(
            "Audio metadata:"
        )

        print(
            metadata
        )


        # ----------------------------------------------------
        # 10. Build browser audio URL
        # ----------------------------------------------------

        audio_url = (
            f"/audio/{stored_filename}"
        )


        # ----------------------------------------------------
        # 11. Insert into MySQL
        # ----------------------------------------------------

        submission_id = insert_audio_submission(

            person_id=person["person_id"],

            name=person["name"],

            phone=person["phone"],

            audio_filename=stored_filename,

            audio_path=str(
                stored_path
            ),

            duration_seconds=metadata[
                "duration_seconds"
            ],

            sample_rate_khz=metadata[
                "sample_rate_khz"
            ],

            bitrate_kbps=metadata[
                "bitrate_kbps"
            ],

            loudness_db=metadata[
                "loudness_db"
            ],

            quality_estimate=metadata[
                "quality_estimate"
            ],
        )


        # ----------------------------------------------------
        # 12. Return successful response
        # ----------------------------------------------------

        print(
            f"Submission created: "
            f"{submission_id}"
        )

        print(
            "----------------------------------------"
        )


        return {

            "success": True,

            "message": (
                "Audio submitted successfully."
            ),

            "submission_id": submission_id,

            "person_id": person[
                "person_id"
            ],

            "name": person[
                "name"
            ],

            "phone": person[
                "phone"
            ],

            "audio_url": audio_url,

            "metadata": metadata,
        }


    # ========================================================
    # Error handling
    # ========================================================

    except HTTPException:

        # Re-raise FastAPI errors
        raise


    except Exception as exc:

        print(
            "----------------------------------------"
        )

        print(
            "Audio processing error:"
        )

        print(
            repr(exc)
        )

        print(
            "----------------------------------------"
        )


        # Delete incomplete/invalid audio
        if stored_path.exists():

            try:

                stored_path.unlink(
                    missing_ok=True
                )

            except Exception:
                pass


        raise HTTPException(
            status_code=500,
            detail=(
                "Could not process audio: "
                f"{exc}"
            ),
        ) from exc


    finally:

        # Close uploaded file
        try:

            await audio.close()

        except Exception:

            pass


# ============================================================
# List All Audio Submissions
# ============================================================

@app.get("/api/submissions")
def list_submissions():
    """
    Return all audio submissions.

    Used by the frontend Submissions view.
    """

    try:

        rows = get_all_submissions()


        for row in rows:

            # Convert database filename
            # into browser-playable URL

            if row.get(
                "audio_filename"
            ):

                row["audio_url"] = (
                    f"/audio/"
                    f"{row['audio_filename']}"
                )

            else:

                row["audio_url"] = None


        return {

            "success": True,

            "count": len(rows),

            "submissions": rows,
        }


    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not fetch submissions: "
                f"{exc}"
            ),
        ) from exc


# ============================================================
# Optional: Get Single Submission
# ============================================================

@app.get("/api/submissions/{submission_id}")
def get_submission(
    submission_id: int,
):
    """
    Simple endpoint for retrieving one submission.
    """

    rows = get_all_submissions()


    for row in rows:

        if int(
            row["id"]
        ) == submission_id:

            if row.get(
                "audio_filename"
            ):

                row["audio_url"] = (
                    f"/audio/"
                    f"{row['audio_filename']}"
                )

            else:

                row["audio_url"] = None


            return {
                "success": True,
                "submission": row,
            }


    raise HTTPException(
        status_code=404,
        detail="Submission not found.",
    )