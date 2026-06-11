import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from rag.retriever import search_documents
from rag.vector_store import get_document_chunks

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


def generate_answer(question, document_id=None):
    documents = search_documents(question, document_id=document_id, top_k=4)
    if not documents:
        return "Không tìm thấy thông tin trong tài liệu."

    context = "\n\n".join(documents)
    prompt = f"""Bạn là trợ lý học tập AI.
Chỉ trả lời dựa trên nội dung tài liệu dưới đây.
Nếu tài liệu không chứa thông tin để trả lời thì nói: "Không tìm thấy thông tin trong tài liệu."

TÀI LIỆU:
{context}

CÂU HỎI:
{question}"""
    response = model.generate_content(prompt)
    return response.text


def generate_quiz(document_id=None, raw_text=None, num_questions=5):
    if document_id is not None:
        chunks = get_document_chunks(document_id, limit=15)
        text = "\n\n".join(chunks)
    elif raw_text:
        text = raw_text
    else:
        return []

    if not text.strip():
        return []

    prompt = f"""Generate {num_questions} multiple choice quiz questions from the following study material.

Return ONLY a valid JSON array, no explanation, no markdown.

Format:
[
  {{
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "answer": "..."
  }}
]

Study Material:
{text[:8000]}"""

    response = model.generate_content(prompt)
    ai_text = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(ai_text)
