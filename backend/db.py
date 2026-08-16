import os
from typing import Optional

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "consultbae_db"),
    )


def find_person(name: str, phone: str) -> Optional[dict]:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT person_id, name, email, phone
            FROM people
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s))
              AND REPLACE(REPLACE(TRIM(phone), ' ', ''), '-', '') =
                  REPLACE(REPLACE(TRIM(%s), ' ', ''), '-', '')
            LIMIT 1
            """,
            (name, phone),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def insert_audio_submission(
    person_id,
    name,
    phone,
    audio_filename,
    audio_path,
    duration_seconds,
    sample_rate_khz,
    bitrate_kbps,
    loudness_db,
    quality_estimate,
):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO audio_submissions (
                person_id, name, phone, audio_filename, audio_path,
                duration_seconds, sample_rate_khz, bitrate_kbps,
                loudness_db, quality_estimate
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                person_id,
                name,
                phone,
                audio_filename,
                audio_path,
                duration_seconds,
                sample_rate_khz,
                bitrate_kbps,
                loudness_db,
                quality_estimate,
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()


def get_all_submissions():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                a.id,
                a.person_id,
                a.name,
                a.phone,
                a.audio_filename,
                a.audio_path,
                a.duration_seconds,
                a.sample_rate_khz,
                a.bitrate_kbps,
                a.loudness_db,
                a.quality_estimate,
                a.created_at
            FROM audio_submissions a
            ORDER BY a.created_at DESC, a.id DESC
            """
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
