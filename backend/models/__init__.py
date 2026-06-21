from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Clinic(db.Model):
    __tablename__ = "clinics"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    access_code = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    children = db.relationship("Child", backref="clinic", cascade="all, delete-orphan")


class Child(db.Model):
    __tablename__ = "children_v2"

    id = db.Column(db.Integer, primary_key=True)
    clinic_id = db.Column(db.Integer, db.ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    diagnosis_notes = db.Column(db.Text, nullable=True)
    mchat_score = db.Column(db.Integer, nullable=True)
    mchat_responses = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    roadmaps = db.relationship("Roadmap", backref="child", cascade="all, delete-orphan")
    letters = db.relationship("Letter", backref="child", cascade="all, delete-orphan")
    chat_messages = db.relationship("ChatMessage", backref="child", cascade="all, delete-orphan")


class Roadmap(db.Model):
    __tablename__ = "roadmaps"

    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey("children_v2.id", ondelete="CASCADE"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)


class Letter(db.Model):
    __tablename__ = "letters"

    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey("children_v2.id", ondelete="CASCADE"), nullable=False)
    letter_type = db.Column(db.String(50))
    content = db.Column(db.Text, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey("children_v2.id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
