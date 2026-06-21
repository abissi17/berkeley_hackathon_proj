import os
import anthropic
from flask import Blueprint, request, session, jsonify
from models import db, Child, Letter

letters_bp = Blueprint("letters_bp", __name__)

SYSTEM_PROMPT = (
    "You are an expert at writing clear, professional advocacy letters for families "
    "of children with developmental needs. Write ready-to-send letters that are "
    "empathetic but firm."
)

LETTER_PROMPTS = {
    "school_iep": (
        "Write a formal letter from a parent to a school district requesting an IEP "
        "evaluation for their child named {name}. Background: {notes}. The letter "
        "should be professional, cite IDEA law, and request an evaluation within 60 days."
    ),
    "insurance": (
        "Write a formal letter to an insurance company requesting coverage for "
        "developmental therapy services for a child named {name}. Background: {notes}. "
        "Include language about medical necessity and appeal rights."
    ),
    "pediatrician": (
        "Write a letter from a parent to their pediatrician requesting referrals for "
        "developmental specialists for their child named {name}. Background: {notes}. "
        "List specific types of specialists to request."
    ),
}


@letters_bp.route("", methods=["POST"])
def generate_session_letters():
    """Generate all three letters for the current parent session."""
    child = session.get("child")
    if not child:
        return jsonify({"error": "No active session. Please complete the intake form first."}), 400

    name = child.get("child_name", "your child")
    age = child.get("child_age_months", "unknown")
    concerns = child.get("concerns", "developmental concerns")
    insurance = child.get("insurance") or "not specified"

    prompts = {
        "school": (
            f"Write a concise 3-paragraph letter (under 200 words) from a parent to a school district "
            f"requesting an IEP evaluation for {name}, age {age} months. Concerns: {concerns}. "
            f"Cite IDEA, 60-day evaluation timeline. Use [CAPS] placeholders for parent name, address, phone, district name. "
            f"Say 'developmental concerns', never name a diagnosis."
        ),
        "insurance": (
            f"Write a concise 3-paragraph letter (under 200 words) to an insurance company requesting "
            f"coverage for developmental therapy for {name}, age {age} months. Insurer: {insurance}. Concerns: {concerns}. "
            f"Mention EPSDT and medical necessity. Use [CAPS] placeholders for parent name, address, member ID. "
            f"Say 'developmental concerns', never name a diagnosis."
        ),
        "regional_center": (
            f"Write a concise 3-paragraph letter (under 200 words) to a California Regional Center "
            f"requesting Early Start intake for {name}, age {age} months. Concerns: {concerns}. "
            f"Cite IDEA Part C, Early Start, 45-day timeline. Use [CAPS] placeholders for parent name, address, phone, center name. "
            f"Say 'developmental concerns', never name a diagnosis."
        ),
    }

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        results = {}
        for key, prompt in prompts.items():
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}],
            )
            results[key] = response.content[0].text
        return jsonify({"letters": results})
    except Exception as exc:
        return jsonify({"error": f"Letter generation failed: {exc}"}), 500


@letters_bp.route("/generate/<int:child_id>", methods=["POST"])
def generate_letter(child_id):
    child = Child.query.get_or_404(child_id)
    data = request.get_json(silent=True) or {}
    letter_type = data.get("letter_type", "").strip()

    if letter_type not in LETTER_PROMPTS:
        return jsonify({"error": f"letter_type must be one of: {', '.join(LETTER_PROMPTS)}"}), 400

    user_message = LETTER_PROMPTS[letter_type].format(
        name=child.name,
        notes=child.diagnosis_notes or "None provided",
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

    letter = Letter(child_id=child_id, letter_type=letter_type, content=content)
    db.session.add(letter)
    db.session.commit()

    return jsonify({"letter": content, "letter_type": letter_type})


@letters_bp.route("/<int:child_id>", methods=["GET"])
def get_letters(child_id):
    letters = (
        Letter.query.filter_by(child_id=child_id)
        .order_by(Letter.generated_at.desc())
        .all()
    )
    return jsonify([
        {
            "id": l.id,
            "letter_type": l.letter_type,
            "content": l.content,
            "generated_at": l.generated_at.isoformat(),
        }
        for l in letters
    ])