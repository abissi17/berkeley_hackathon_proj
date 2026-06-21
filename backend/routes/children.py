from datetime import date
from flask import Blueprint, request, jsonify
from models import db, Child

children_bp = Blueprint("children_bp", __name__)


@children_bp.route("/", methods=["POST"])
def create_child():
    data = request.get_json(silent=True) or {}
    clinic_id = data.get("clinic_id")
    name = (data.get("name") or "").strip()

    if not clinic_id or not name:
        return jsonify({"error": "clinic_id and name are required."}), 400

    dob = None
    if data.get("dob"):
        try:
            dob = date.fromisoformat(data["dob"])
        except ValueError:
            return jsonify({"error": "dob must be ISO format (YYYY-MM-DD)."}), 400

    child = Child(
        clinic_id=clinic_id,
        name=name,
        date_of_birth=dob,
        diagnosis_notes=data.get("notes"),
        mchat_score=data.get("mchat_score"),
        mchat_responses=data.get("mchat_responses"),
    )
    db.session.add(child)
    db.session.commit()

    return jsonify({"id": child.id, "name": child.name}), 201


@children_bp.route("/<int:clinic_id>", methods=["GET"])
def list_children(clinic_id):
    children = Child.query.filter_by(clinic_id=clinic_id).order_by(Child.created_at.desc()).all()
    return jsonify([
        {
            "id": c.id,
            "name": c.name,
            "date_of_birth": c.date_of_birth.isoformat() if c.date_of_birth else None,
            "diagnosis_notes": c.diagnosis_notes,
            "mchat_score": c.mchat_score,
        }
        for c in children
    ])


@children_bp.route("/detail/<int:child_id>", methods=["GET"])
def get_child(child_id):
    child = Child.query.get_or_404(child_id)
    return jsonify({
        "id": child.id,
        "clinic_id": child.clinic_id,
        "name": child.name,
        "date_of_birth": child.date_of_birth.isoformat() if child.date_of_birth else None,
        "diagnosis_notes": child.diagnosis_notes,
        "mchat_score": child.mchat_score,
        "mchat_responses": child.mchat_responses,
        "created_at": child.created_at.isoformat(),
    })


@children_bp.route("/<int:child_id>", methods=["DELETE"])
def delete_child(child_id):
    child = Child.query.get_or_404(child_id)
    db.session.delete(child)
    db.session.commit()
    return jsonify({"message": "deleted"})
