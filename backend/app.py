from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os, json

load_dotenv()

from models import db, User, Document, ChatHistory, QuizResult
from rag.pdf_loader import extract_text_from_pdf
from rag.vector_store import save_document, delete_document_chunks
from rag.generator import generate_answer, generate_quiz

# ── App setup ──────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"]    = os.getenv("DATABASE_URL", "sqlite:///smartquiz.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"]             = os.getenv("JWT_SECRET_KEY", "change-me")
app.config["UPLOAD_FOLDER"]             = "uploads"

db.init_app(app)
bcrypt = Bcrypt(app)
jwt    = JWTManager(app)

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

with app.app_context():
    db.create_all()

# ── Helpers ────────────────────────────────────────────────────────────
def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)

# ── Health ─────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({"message": "SmartQuiz AI backend running"})

# ═══════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════

@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Vui lòng điền đầy đủ thông tin"}), 400
    if len(password) < 6:
        return jsonify({"error": "Mật khẩu tối thiểu 6 ký tự"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email đã được sử dụng"}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Tên người dùng đã tồn tại"}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(username=username, email=email, password_hash=hashed)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Email hoặc mật khẩu không đúng"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


@app.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})

# ═══════════════════════════════════════════════════════════════════════
# DOCUMENTS
# ═══════════════════════════════════════════════════════════════════════

@app.route("/documents", methods=["GET"])
@jwt_required()
def list_documents():
    user = get_current_user()
    docs = Document.query.filter_by(user_id=user.id).order_by(Document.uploaded_at.desc()).all()
    return jsonify([d.to_dict() for d in docs])


@app.route("/upload-pdf", methods=["POST"])
@jwt_required()
def upload_pdf():
    user = get_current_user()

    if "file" not in request.files:
        return jsonify({"error": "Không có file được tải lên"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Chưa chọn file"}), 400
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Chỉ chấp nhận file PDF"}), 400

    original_name = file.filename
    filename = f"user{user.id}_{secure_filename(file.filename)}"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    # Save document record to DB
    doc = Document(user_id=user.id, filename=filename, original_name=original_name)
    db.session.add(doc)
    db.session.commit()

    # Extract text and embed into vector store
    text = extract_text_from_pdf(filepath)
    chunks = save_document(text, document_id=doc.id)

    return jsonify({
        "message": "Tải lên thành công",
        "document": doc.to_dict(),
        "chunks": chunks
    }), 201


@app.route("/documents/<int:doc_id>", methods=["DELETE"])
@jwt_required()
def delete_document(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({"error": "Không tìm thấy tài liệu"}), 404

    # Delete file on disk
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], doc.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    # Delete vector store chunks
    delete_document_chunks(doc.id)

    db.session.delete(doc)
    db.session.commit()
    return jsonify({"message": "Đã xóa tài liệu"})

# ═══════════════════════════════════════════════════════════════════════
# CHAT (RAG)
# ═══════════════════════════════════════════════════════════════════════

@app.route("/ask-document", methods=["POST"])
@jwt_required()
def ask_document():
    user = get_current_user()
    data = request.get_json()
    question    = data.get("question", "").strip()
    document_id = data.get("document_id")

    if not question:
        return jsonify({"error": "Câu hỏi không được để trống"}), 400

    # Validate document ownership
    if document_id:
        doc = Document.query.filter_by(id=document_id, user_id=user.id).first()
        if not doc:
            return jsonify({"error": "Tài liệu không hợp lệ"}), 404

    answer = generate_answer(question, document_id=document_id)

    # Save to history
    history = ChatHistory(
        user_id=user.id,
        document_id=document_id,
        question=question,
        answer=answer
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({"answer": answer, "id": history.id})


@app.route("/chat-history", methods=["GET"])
@jwt_required()
def chat_history():
    user = get_current_user()
    document_id = request.args.get("document_id", type=int)

    q = ChatHistory.query.filter_by(user_id=user.id)
    if document_id:
        q = q.filter_by(document_id=document_id)
    items = q.order_by(ChatHistory.created_at.asc()).all()
    return jsonify([h.to_dict() for h in items])


@app.route("/chat-history", methods=["DELETE"])
@jwt_required()
def clear_chat_history():
    user = get_current_user()
    document_id = request.args.get("document_id", type=int)

    q = ChatHistory.query.filter_by(user_id=user.id)
    if document_id:
        q = q.filter_by(document_id=document_id)
    q.delete()
    db.session.commit()
    return jsonify({"message": "Đã xóa lịch sử chat"})

# ═══════════════════════════════════════════════════════════════════════
# QUIZ
# ═══════════════════════════════════════════════════════════════════════

@app.route("/generate-quiz", methods=["POST"])
@jwt_required()
def api_generate_quiz():
    user = get_current_user()
    data = request.get_json()
    document_id   = data.get("document_id")
    raw_text      = data.get("text")
    num_questions = int(data.get("num_questions", 5))

    if document_id:
        doc = Document.query.filter_by(id=document_id, user_id=user.id).first()
        if not doc:
            return jsonify({"error": "Tài liệu không hợp lệ"}), 404

    try:
        quiz = generate_quiz(
            document_id=document_id,
            raw_text=raw_text,
            num_questions=num_questions
        )
    except Exception as e:
        return jsonify({"error": f"Lỗi tạo quiz: {str(e)}"}), 500

    return jsonify(quiz)


@app.route("/quiz-results", methods=["POST"])
@jwt_required()
def save_quiz_result():
    user = get_current_user()
    data = request.get_json()

    document_id  = data.get("document_id")
    score        = data.get("score")
    total        = data.get("total")
    questions    = data.get("questions")   # list of {question, options, answer}
    user_answers = data.get("answers")     # dict {index: selected_option}

    if score is None or total is None or not questions:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    if document_id:
        doc = Document.query.filter_by(id=document_id, user_id=user.id).first()
        if not doc:
            document_id = None

    result = QuizResult(
        user_id=user.id,
        document_id=document_id,
        score=score,
        total=total,
        questions_json=json.dumps(questions, ensure_ascii=False),
        answers_json=json.dumps(user_answers, ensure_ascii=False)
    )
    db.session.add(result)
    db.session.commit()

    return jsonify({"id": result.id, "message": "Đã lưu kết quả"}), 201


@app.route("/quiz-results", methods=["GET"])
@jwt_required()
def list_quiz_results():
    user = get_current_user()
    results = (QuizResult.query
               .filter_by(user_id=user.id)
               .order_by(QuizResult.created_at.desc())
               .all())
    return jsonify([r.to_dict() for r in results])


@app.route("/quiz-results/<int:result_id>", methods=["GET"])
@jwt_required()
def get_quiz_result(result_id):
    user = get_current_user()
    result = QuizResult.query.filter_by(id=result_id, user_id=user.id).first()
    if not result:
        return jsonify({"error": "Không tìm thấy kết quả"}), 404
    return jsonify(result.to_dict(include_detail=True))


# ═══════════════════════════════════════════════════════════════════════
# PROFILE
# ═══════════════════════════════════════════════════════════════════════

@app.route("/profile/stats", methods=["GET"])
@jwt_required()
def profile_stats():
    user = get_current_user()
    doc_count    = Document.query.filter_by(user_id=user.id).count()
    quiz_count   = QuizResult.query.filter_by(user_id=user.id).count()
    chat_count   = ChatHistory.query.filter_by(user_id=user.id).count()

    results = QuizResult.query.filter_by(user_id=user.id).all()
    avg_score = 0
    if results:
        avg_score = round(sum(r.score / r.total * 100 for r in results) / len(results), 1)

    return jsonify({
        "user":       user.to_dict(),
        "doc_count":  doc_count,
        "quiz_count": quiz_count,
        "chat_count": chat_count,
        "avg_score":  avg_score
    })


if __name__ == "__main__":
    app.run(debug=True)
