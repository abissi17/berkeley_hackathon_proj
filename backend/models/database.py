import json
import os

import psycopg2
import psycopg2.extras


def _get_conn():
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    return psycopg2.connect(db_url)


def init_db():
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS children (
                    id               SERIAL PRIMARY KEY,
                    child_name       TEXT NOT NULL,
                    child_age_months INTEGER NOT NULL,
                    zip_code         TEXT,
                    concerns         TEXT,
                    diagnosis_status TEXT DEFAULT 'none',
                    diagnosis_name   TEXT,
                    insurance        TEXT,
                    roadmap          JSONB,
                    letters          JSONB,
                    providers        JSONB,
                    created_at       TIMESTAMP DEFAULT NOW()
                )
            """)
        conn.commit()


def save_child(data: dict) -> int:
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO children
                    (child_name, child_age_months, zip_code, concerns,
                     diagnosis_status, diagnosis_name, insurance,
                     roadmap, letters, providers)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    data.get("child_name"),
                    data.get("child_age_months"),
                    data.get("zip_code"),
                    data.get("concerns"),
                    data.get("diagnosis_status", "none"),
                    data.get("diagnosis_name"),
                    data.get("insurance"),
                    json.dumps(data.get("roadmap", [])),
                    json.dumps(data.get("letters", {})),
                    json.dumps(data.get("providers", [])),
                ),
            )
            child_id = cur.fetchone()[0]
        conn.commit()
    return child_id


def get_all_children() -> list:
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, child_name, child_age_months, diagnosis_status, created_at FROM children ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_child(child_id: int) -> dict | None:
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM children WHERE id = %s", (child_id,))
            row = cur.fetchone()
    return dict(row) if row else None
