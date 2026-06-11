from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(name="documents")


def save_document(text, document_id):
    # Remove old chunks for this document before re-adding
    try:
        existing = collection.get(where={"document_id": str(document_id)})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(text)

    if not chunks:
        return 0

    embeddings = model.encode(chunks).tolist()
    ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": str(document_id)} for _ in chunks]

    collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)
    return len(chunks)


def get_document_chunks(document_id, limit=20):
    """Retrieve all chunks for a document (used for quiz generation)."""
    try:
        results = collection.get(
            where={"document_id": str(document_id)},
            limit=limit
        )
        return results["documents"]
    except Exception:
        return []


def delete_document_chunks(document_id):
    """Delete all vector chunks for a document."""
    try:
        existing = collection.get(where={"document_id": str(document_id)})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass
