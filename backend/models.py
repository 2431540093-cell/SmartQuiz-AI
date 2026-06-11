from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    documents    = db.relationship("Document",    backref="user", lazy=True, cascade="all, delete-orphan")
    chat_history = db.relationship("ChatHistory", backref="user", lazy=True, cascade="all, delete-orphan")
    quiz_results = db.relationship("QuizResult",  backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "created_at": self.created_at.isoformat()
        }


class Document(db.Model):
    __tablename__ = "documents"
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    filename      = db.Column(db.String(256), nullable=False)   # saved filename on disk
    original_name = db.Column(db.String(256), nullable=False)   # original upload name
    uploaded_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":            self.id,
            "original_name": self.original_name,
            "uploaded_at":   self.uploaded_at.isoformat()
        }


class ChatHistory(db.Model):
    __tablename__ = "chat_history"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=True)
    question    = db.Column(db.Text, nullable=False)
    answer      = db.Column(db.Text, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "document_id": self.document_id,
            "question":    self.question,
            "answer":      self.answer,
            "created_at":  self.created_at.isoformat()
        }


class QuizResult(db.Model):
    __tablename__ = "quiz_results"
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    document_id    = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=True)
    score          = db.Column(db.Integer, nullable=False)
    total          = db.Column(db.Integer, nullable=False)
    questions_json = db.Column(db.Text, nullable=False)  # JSON: [{question, options, answer}]
    answers_json   = db.Column(db.Text, nullable=False)  # JSON: {"0": "option_text", ...}
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    document = db.relationship("Document", lazy=True)

    def to_dict(self, include_detail=False):
        data = {
            "id":          self.id,
            "document_id": self.document_id,
            "document_name": self.document.original_name if self.document else None,
            "score":       self.score,
            "total":       self.total,
            "percentage":  round(self.score / self.total * 100, 1) if self.total else 0,
            "created_at":  self.created_at.isoformat()
        }
        if include_detail:
            import json
            data["questions"] = json.loads(self.questions_json)
            data["answers"]   = json.loads(self.answers_json)
        return data
