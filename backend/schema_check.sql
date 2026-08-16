USE consultbae_db;

-- Your Task 1 table already exists.
-- This table is compatible with the backend.
CREATE TABLE IF NOT EXISTS audio_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    name VARCHAR(150),
    phone VARCHAR(30),
    audio_filename VARCHAR(255),
    audio_path VARCHAR(500),
    duration_seconds DECIMAL(10,2),
    sample_rate_khz DECIMAL(10,2),
    bitrate_kbps DECIMAL(10,2),
    loudness_db DECIMAL(10,2),
    quality_estimate VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES people(person_id)
);
