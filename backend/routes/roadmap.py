import os
import anthropic
from flask import Blueprint, jsonify
from models import db, Child, Roadmap

roadmap_bp = Blueprint("roadmap_bp", __name__)

SYSTEM_PROMPT = (
    "You are a compassionate care navigator helping families of children with "
    "developmental and neurological conditions. You create clear, actionable, "
    "step-by-step roadmaps. Never provide medical diagnoses. Always frame "
    "suggestions as topics to discuss with healthcare providers."
)


@roadmap_bp.route("/generate/<int:child_id>", methods=["POST"])
def generate_roadmap(child_id):
    child = Child.query.get_or_404(child_id)

    user_message = (
        f"Create a personalized care navigation roadmap for a child named {child.name}. "
        f"Background notes: {child.diagnosis_notes or 'None provided'}. "
        f"M-CHAT score if available: {child.mchat_score or 'Not taken'}. "
        f"The roadmap should include: "
        f"1) Immediate next steps (0-30 days), "
        f"2) Short-term goals (1-3 months), "
        f"3) Key providers to contact, "
        f"4) Questions to ask at the next doctor visit. "
        f"Format as clear markdown with headers."
    )

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        content = response.content[0].text
    except Exception as exc:
        return jsonify({"error": f"Claude API error: {exc}"}), 500

    roadmap = Roadmap(child_id=child_id, content=content)
    db.session.add(roadmap)
    db.session.commit()

    return jsonify({"roadmap": content})


@roadmap_bp.route("/<int:child_id>", methods=["GET"])
def get_roadmap(child_id):
    roadmap = (
        Roadmap.query.filter_by(child_id=child_id)
        .order_by(Roadmap.generated_at.desc())
        .first()
    )
    if not roadmap:
        return jsonify({"roadmap": None})
    return jsonify({"roadmap": roadmap.content, "generated_at": roadmap.generated_at.isoformat()})