"""
Compass — Flask backend.

AI-powered care navigation tool for parents of children with
developmental concerns and clinics managing multiple children.

Run:
    pip install -r requirements.txt
    flask run --port 5000
"""

import os
import uuid
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from flask import Flask, request, session, jsonify
from flask_cors import CORS

# Load .env before importing services that read os.getenv
load_dotenv(verbose=False)  # searches cwd and parent dirs, finds project-root .env

from models import db
from services.claude_service import generate_roadmap, get_chat_reply
from services.browserbase_service import scrape_providers, FALLBACK_PROVIDERS
from services.redis_service import (
    get_cached_providers,
    set_cached_providers,
    get_chat_history,
    append_chat_message,
)
from models.database import init_db, save_child, get_all_children, get_child
from routes.clinic import clinic_bp
from routes.children import children_bp
from routes.roadmap import roadmap_bp
from routes.letters import letters_bp
from routes.chat import chat_bp

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "compass-dev-secret-key-change-in-production")

    # SQLAlchemy
    db_url = os.getenv("DATABASE_URL", "")
    # SQLAlchemy requires postgresql:// not postgres://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    # Allow frontend dev server on :3000
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

    # Register blueprints
    app.register_blueprint(clinic_bp, url_prefix="/api/clinic")
    app.register_blueprint(children_bp, url_prefix="/api/children")
    app.register_blueprint(roadmap_bp, url_prefix="/api/roadmap")
    app.register_blueprint(letters_bp, url_prefix="/api/letters")
    app.register_blueprint(chat_bp, url_prefix="/api/chat/clinic")

    # Create SQLAlchemy tables
    with app.app_context():
        try:
            db.create_all()
            print("[db] SQLAlchemy tables created (or already exist).")
        except Exception as exc:
            print(f"[db] SQLAlchemy setup failed ({exc}) — clinic persistence disabled.")

    # --- startup: init legacy psycopg table (best-effort) ---
    try:
        init_db()
        print("[db] Legacy PostgreSQL table initialized (or already exists).")
    except Exception as exc:
        print(f"[db] Legacy PostgreSQL not available ({exc}).")

    return app


app = create_app()
executor = ThreadPoolExecutor(max_workers=4)


# ===================================================================
# POST /api/intake
# ===================================================================
@app.route("/api/intake", methods=["POST"])
def intake():
    """
    Main intake endpoint.  Accepts child's profile, runs Claude (roadmap
    + letters) and Browserbase (providers) in parallel, and returns all
    results.  Stores child data in the Flask session cookie.
    """
    data = request.get_json(silent=True) or {}

    # --- required fields ---
    child_name = data.get("child_name", "").strip()
    child_age_months = data.get("child_age_months")
    zip_code = data.get("zip_code", "").strip()
    concerns = data.get("concerns", "").strip()
    diagnosis_status = data.get("diagnosis_status", "none")
    diagnosis_name = data.get("diagnosis_name", "")
    insurance = data.get("insurance", "")
    save_to_db = data.get("save_to_db", False)

    if not child_name or child_age_months is None:
        return jsonify({"error": "child_name and child_age_months are required."}), 400

    intake_data = {
        "child_name": child_name,
        "child_age_months": int(child_age_months),
        "zip_code": zip_code,
        "concerns": concerns,
        "diagnosis_status": diagnosis_status,
        "diagnosis_name": diagnosis_name if diagnosis_status == "confirmed" else "",
        "insurance": insurance,
    }

    # --- check provider cache ---
    cached = get_cached_providers(zip_code) if zip_code else None

    # --- run Claude and Browserbase in parallel ---
    with ThreadPoolExecutor(max_workers=2) as pool:
        claude_future = pool.submit(generate_roadmap, intake_data)

        if cached:
            providers = cached
        else:
            browser_future = pool.submit(
                lambda: scrape_providers(zip_code) if zip_code else FALLBACK_PROVIDERS
            )
            providers = browser_future.result() or FALLBACK_PROVIDERS
            if zip_code and providers:
                set_cached_providers(zip_code, providers)

        roadmap = claude_future.result()

    # --- assemble response ---
    session_id = str(uuid.uuid4())
    letters = {}

    response = {
        "session_id": session_id,
        "roadmap": roadmap,
        "letters": letters,
        "providers": providers,
    }

    # --- store child in Flask session ---
    session["child"] = intake_data
    session["session_id"] = session_id

    # --- persist to PostgreSQL if clinic mode ---
    if save_to_db:
        try:
            child_id = save_child(
                {**intake_data, "roadmap": roadmap, "letters": letters, "providers": providers}
            )
            response["child_db_id"] = child_id
        except Exception as exc:
            print(f"[db] Failed to save child: {exc}")
            response["child_db_id"] = None

    return jsonify(response)


# ===================================================================
# POST /api/chat
# ===================================================================
@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Chat endpoint.  Uses the child's profile from the Flask session
    and maintains conversation history in Redis.
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    session_id = data.get("session_id") or session.get("session_id", "")

    if not message:
        return jsonify({"error": "message is required."}), 400

    child = session.get("child")
    if not child:
        return jsonify({"error": "No active session. Please complete the intake form first."}), 400

    # --- retrieve history ---
    history = get_chat_history(session_id)

    # --- record user message ---
    append_chat_message(session_id, "user", message)

    # --- get Claude reply ---
    reply = get_chat_reply(child, history, message)

    # --- record assistant reply ---
    append_chat_message(session_id, "assistant", reply)

    return jsonify({"reply": reply})


# ===================================================================
# GET /api/clinic/children
# ===================================================================
@app.route("/api/clinic/children", methods=["GET"])
def clinic_children():
    """Return all children in the clinic's PostgreSQL database."""
    try:
        children = get_all_children()
        return jsonify({"children": children})
    except Exception as exc:
        print(f"[db] Error listing children: {exc}")
        return jsonify({"children": [], "error": "Database unavailable."})


# ===================================================================
# GET /api/clinic/children/<id>
# ===================================================================
@app.route("/api/clinic/children/<int:child_id>", methods=["GET"])
def clinic_child_detail(child_id: int):
    """Return the full profile for a single child."""
    try:
        child = get_child(child_id)
        if child is None:
            return jsonify({"error": "Child not found."}), 404
        return jsonify(child)
    except Exception as exc:
        print(f"[db] Error fetching child {child_id}: {exc}")
        return jsonify({"error": "Database unavailable."}), 500


# ===================================================================
# Health check
# ===================================================================
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ===================================================================
# Main
# ===================================================================
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5001"))
    print(f"\n  Compass backend running at http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=True)
