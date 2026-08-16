import subprocess
import re
import wave
from pathlib import Path


# ============================================================
# Run FFmpeg command
# ============================================================

def _run_ffmpeg(args):
    result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            *args,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip()
            or "FFmpeg command failed."
        )

    return result


# ============================================================
# Get basic audio information
# ============================================================

def _probe_audio(path: Path):

    """
    Browser MediaRecorder normally creates WebM/Opus.

    Some WebM recordings don't contain reliable duration
    metadata.

    Therefore:

    WebM/MP3/etc.
          ↓
       FFmpeg
          ↓
       WAV
          ↓
    Python wave module
          ↓
    duration + sample rate
    """

    temp_wav = path.with_name(
        f"{path.stem}_analysis.wav"
    )

    try:

        # ----------------------------------------------------
        # Convert uploaded audio to WAV
        # ----------------------------------------------------

        _run_ffmpeg(
            [
                "-y",
                "-i",
                str(path),
                "-vn",
                "-acodec",
                "pcm_s16le",
                str(temp_wav),
            ]
        )

        if not temp_wav.exists():
            raise RuntimeError(
                "FFmpeg could not create analysis WAV."
            )

        if temp_wav.stat().st_size == 0:
            raise RuntimeError(
                "Analysis WAV is empty."
            )

        # ----------------------------------------------------
        # Read WAV metadata
        # ----------------------------------------------------

        with wave.open(
            str(temp_wav),
            "rb",
        ) as wav:

            frames = wav.getnframes()

            sample_rate = wav.getframerate()

            channels = wav.getnchannels()

            sample_width = wav.getsampwidth()

        if sample_rate <= 0:
            raise RuntimeError(
                "Invalid audio sample rate."
            )

        # Duration = frames / sample rate
        duration = frames / float(sample_rate)

        if duration <= 0:
            raise RuntimeError(
                "Could not determine audio duration."
            )

        # ----------------------------------------------------
        # Calculate bitrate
        # ----------------------------------------------------

        # Original compressed file size / duration
        bitrate_kbps = (
            path.stat().st_size
            * 8
            / duration
            / 1000
        )

        return (
            duration,
            sample_rate,
            bitrate_kbps,
        )

    finally:

        # Remove temporary WAV
        if temp_wav.exists():

            try:
                temp_wav.unlink()
            except Exception:
                pass


# ============================================================
# Loudness
# ============================================================

def _mean_loudness_db(path: Path):

    """
    FFmpeg volumedetect gives mean_volume in dB.
    """

    result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i",
            str(path),
            "-af",
            "volumedetect",
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
    )

    text = result.stderr

    match = re.search(
        r"mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB",
        text,
        re.IGNORECASE,
    )

    if not match:
        return None

    return float(
        match.group(1)
    )


# ============================================================
# Rough quality estimate
# ============================================================

def _quality_estimate(
    sample_rate_khz,
    bitrate_kbps,
    loudness_db,
):

    """
    Rough demo-quality heuristic.

    This is NOT a professional audio/noise measurement.
    """

    score = 0

    # --------------------------------------------------------
    # Sample rate
    # --------------------------------------------------------

    if sample_rate_khz >= 44:
        score += 1


    # --------------------------------------------------------
    # Bitrate
    # --------------------------------------------------------

    if (
        bitrate_kbps is not None
        and bitrate_kbps >= 96
    ):
        score += 1


    # --------------------------------------------------------
    # Loudness
    # --------------------------------------------------------

    if loudness_db is not None:

        # Good speech level
        if -24 <= loudness_db <= -10:
            score += 2

        # Acceptable
        elif -35 <= loudness_db < -24:
            score += 1

        elif -10 < loudness_db <= -6:
            score += 1

        # Extremely quiet or loud
        if (
            loudness_db < -35
            or loudness_db > -3
        ):
            return "Poor"


    # --------------------------------------------------------
    # Final quality
    # --------------------------------------------------------

    if score >= 4:
        return "Good"

    if score >= 2:
        return "Fair"

    return "Poor"


# ============================================================
# Main audio analysis function
# ============================================================

def analyze_audio(path: Path) -> dict:

    """
    Analyze uploaded audio and return:

    duration_seconds
    sample_rate_khz
    bitrate_kbps
    loudness_db
    quality_estimate
    """

    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if not path.exists():

        raise RuntimeError(
            f"Audio file does not exist: {path}"
        )


    if path.stat().st_size == 0:

        raise RuntimeError(
            "Uploaded audio file is empty."
        )


    # --------------------------------------------------------
    # Extract duration, sample rate, bitrate
    # --------------------------------------------------------

    (
        duration,
        sample_rate_hz,
        bitrate_kbps,
    ) = _probe_audio(path)


    # --------------------------------------------------------
    # Convert Hz → kHz
    # --------------------------------------------------------

    sample_rate_khz = (
        sample_rate_hz / 1000.0
    )


    # --------------------------------------------------------
    # Loudness
    # --------------------------------------------------------

    loudness_db = _mean_loudness_db(
        path
    )


    # --------------------------------------------------------
    # Quality
    # --------------------------------------------------------

    quality = _quality_estimate(
        sample_rate_khz,
        bitrate_kbps,
        loudness_db,
    )


    # --------------------------------------------------------
    # Return metadata
    # --------------------------------------------------------

    return {

        "duration_seconds": round(
            duration,
            2,
        ),

        "sample_rate_khz": round(
            sample_rate_khz,
            2,
        ),

        "bitrate_kbps": round(
            bitrate_kbps,
            2,
        )
        if bitrate_kbps is not None
        else None,

        "loudness_db": round(
            loudness_db,
            2,
        )
        if loudness_db is not None
        else None,

        "quality_estimate": quality,
    }