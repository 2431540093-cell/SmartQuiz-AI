# SmartQuiz AI – v2

## Cấu trúc
```
smartquiz-ai/
├── backend/
│   ├── app.py           # Flask API (Auth, Documents, Chat, Quiz)
│   ├── models.py        # SQLAlchemy: User, Document, ChatHistory, QuizResult
│   ├── requirements.txt
│   ├── .env             # GEMINI_API_KEY, JWT_SECRET_KEY
│   └── rag/
│       ├── pdf_loader.py
│       ├── vector_store.py  # ChromaDB + document_id filtering
│       ├── retriever.py
│       └── generator.py
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── components/{Sidebar, Layout, ProtectedRoute}
        └── pages/{Login, Register, Dashboard, Chat, Quiz, Results, Profile}
```

## Chạy backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Chạy frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints
| Method | URL | Auth | Mô tả |
|--------|-----|------|-------|
| POST | /auth/register | ❌ | Đăng ký |
| POST | /auth/login | ❌ | Đăng nhập → JWT |
| GET | /auth/me | ✅ | Thông tin user |
| GET | /documents | ✅ | Danh sách tài liệu |
| POST | /upload-pdf | ✅ | Upload PDF → embed ChromaDB |
| DELETE | /documents/:id | ✅ | Xóa tài liệu |
| POST | /ask-document | ✅ | Hỏi AI (RAG) + lưu history |
| GET | /chat-history | ✅ | Lịch sử chat |
| DELETE | /chat-history | ✅ | Xóa lịch sử |
| POST | /generate-quiz | ✅ | Tạo quiz từ doc hoặc text |
| POST | /quiz-results | ✅ | Lưu kết quả |
| GET | /quiz-results | ✅ | Danh sách kết quả |
| GET | /quiz-results/:id | ✅ | Chi tiết kết quả |
| GET | /profile/stats | ✅ | Thống kê người dùng |
