import os
import anthropic
from flask import Blueprint, request, jsonify
from models import db, Child, ChatMessage

chat_bp = Blueprint("chat_bp", __name__)

SYSTEM_PROMPT_TEMPLATE = (
    "You are a compassionate care navigator helping families of children with "
    "developmental and neurological conditions. You are currently assisting with "
    "a child named {name}, born {dob}. Parent notes: {notes}. "
    "Always be warm and supportive. Never provide medical diagnoses. Help families "
    "understand their options, navigate support systems, and advocate for their child. "
    "If asked about specific medical conditions, explain you can help navigate resources "
    "but recommend speaking with healthcare providers for clinical questions."
)


@chat_bp.route("/<int:child_id>", methods=["POST"])
def send_message(child_id):
    child = Child.query.get_or_404(child_id)
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "message is required."}), 400

    # Save user message
    db.session.add(ChatMessage(child_id=child_id, role="user", content=message))
    db.session.flush()

    # Build full history for Claude
    history = (
        ChatMessage.query.filter_by(child_id=child_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    messages = [{"role": m.role, "content": m.content} for m in history]

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        name=child.name,
        dob=child.date_of_birth.isoformat() if child.date_of_birth else "unknown",
        notes=child.diagnosis_notes or "None",
    )

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        reply = response.content[0].text
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": f"Claude API error: {exc}"}), 500

    # Save assistant reply
    db.session.add(ChatMessage(child_id=child_id, role="assistant", content=reply))
    db.session.commit()

    return jsonify({"reply": reply})


@chat_bp.route("/<int:child_id>", methods=["GET"])
def get_history(child_id):
    messages = (
        ChatMessage.query.filter_by(child_id=child_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return jsonify([
        {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
        for m in messages
    ])


@chat_bp.route("/<int:child_id>", methods=["DELETE"])
def clear_history(child_id):
    ChatMessage.query.filter_by(child_id=child_id).delete()
    db.session.commit()
    return jsonify({"message": "cleared"})