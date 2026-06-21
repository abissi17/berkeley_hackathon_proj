from flask import Blueprint, request, jsonify
from models import db, Clinic
from sqlalchemy.exc import IntegrityError

clinic_bp = Blueprint("clinic_bp", __name__)


@clinic_bp.route("/create", methods=["POST"])
def create_clinic():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    access_code = (data.get("access_code") or "").strip()

    if not name or not access_code:
        return jsonify({"error": "name and access_code are required."}), 400

    clinic = Clinic(name=name, access_code=access_code)
    db.session.add(clinic)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "access_code already exists."}), 409

    return jsonify({"id": clinic.id, "name": clinic.name, "access_code": clinic.access_code}), 201


@clinic_bp.route("/login", methods=["POST"])
def login_clinic():
    data = request.get_json(silent=True) or {}
    access_code = (data.get("access_code") or "").strip()

    clinic = Clinic.query.filter_by(access_code=access_code).first()
    if not clinic:
        return jsonify({"error": "Clinic not found."}), 404

    return jsonify({"id": clinic.id, "name": clinic.name})
