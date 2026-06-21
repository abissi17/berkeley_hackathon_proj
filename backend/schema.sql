-- Compass schema — for reference and DBeaver use only.
-- Flask creates these automatically via db.create_all() on startup.

CREATE TABLE IF NOT EXISTS clinics (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    access_code TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS children_v2 (
    id               SERIAL PRIMARY KEY,
    clinic_id        INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    date_of_birth    DATE,
    diagnosis_notes  TEXT,
    mchat_score      INTEGER,
    mchat_responses  JSONB,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmaps (
    id           SERIAL PRIMARY KEY,
    child_id     INTEGER NOT NULL REFERENCES children_v2(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS letters (
    id           SERIAL PRIMARY KEY,
    child_id     INTEGER NOT NULL REFERENCES children_v2(id) ON DELETE CASCADE,
    letter_type  TEXT,
    content      TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    child_id   INTEGER NOT NULL REFERENCES children_v2(id) ON DELETE CASCADE,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);