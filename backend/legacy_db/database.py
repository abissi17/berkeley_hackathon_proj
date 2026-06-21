"""
PostgreSQL connection, schema, and queries for the clinic dashboard.

For the hackathon MVP, this uses a single `children` table with
JSONB columns for roadmap, letters, and providers — no normalization
needed.  init_db() runs on app startup and creates the table if it
doesn't exist yet.

Uses psycopg 3.x — the module is ``psycopg`` (not ``psycopg2``).
"""

import os
import json
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/compass")


def _get_conn():
    """Open a new connection.  Caller is responsible for closing it."""
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
        connect_timeout=3,  # fail fast if PostgreSQL is not running
    )


def init_db():
    """Create the children table if it doesn't exist.  Call once on startup."""
    conn = _get_conn()
    try:
        conn.execute("""
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
            );
        """)
        conn.commit()
    finally:
        conn.close()


def save_child(data: dict) -> int:
    """Insert a new child record (full intake + generated outputs).
    Returns the new row id."""
    conn = _get_conn()
    try:
        row = conn.execute(
            """
            INSERT INTO children
                (child_name, child_age_months, zip_code, concerns,
                 diagnosis_status, diagnosis_name, insurance,
                 roadmap, letters, providers)
            VALUES
                (%(child_name)s, %(child_age_months)s, %(zip_code)s,
                 %(concerns)s, %(diagnosis_status)s, %(diagnosis_name)s,
                 %(insurance)s, %(roadmap)s, %(letters)s, %(providers)s)
            RETURNING id;
            """,
            {
                "child_name": data["child_name"],
                "child_age_months": data["child_age_months"],
                "zip_code": data.get("zip_code", ""),
                "concerns": data.get("concerns", ""),
                "diagnosis_status": data.get("diagnosis_status", "none"),
                "diagnosis_name": data.get("diagnosis_name", None),
                "insurance": data.get("insurance", None),
                "roadmap": json.dumps(data.get("roadmap", [])),
                "letters": json.dumps(data.get("letters", {})),
                "providers": json.dumps(data.get("providers", [])),
            },
        ).fetchone()
        conn.commit()
        return row["id"] if row else -1
    finally:
        conn.close()


def get_all_children() -> list[dict]:
    """Return summary list of all children for the clinic dashboard."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, child_name, child_age_months, diagnosis_status,
                   created_at
            FROM children
            ORDER BY created_at DESC;
            """
        ).fetchall()
        return [
            {
                "id": r["id"],
                "child_name": r["child_name"],
                "child_age_months": r["child_age_months"],
                "diagnosis_status": r["diagnosis_status"],
                "created_at": r["created_at"].isoformat()
                if r["created_at"]
                else None,
            }
            for r in rows
        ]
    finally:
        conn.close()


def get_child(child_id: int) -> dict | None:
    """Return the full record for a single child, or None if not found."""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM children WHERE id = %s;", (child_id,)
        ).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "child_name": row["child_name"],
            "child_age_months": row["child_age_months"],
            "zip_code": row["zip_code"],
            "concerns": row["concerns"],
            "diagnosis_status": row["diagnosis_status"],
            "diagnosis_name": row["diagnosis_name"],
            "insurance": row["insurance"],
            "roadmap": row["roadmap"] or [],
            "letters": row["letters"] or {},
            "providers": row["providers"] or [],
            "created_at": row["created_at"].isoformat()
            if row["created_at"]
            else None,
        }
    finally:
        conn.close()
