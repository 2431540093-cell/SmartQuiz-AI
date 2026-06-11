from chromadb import PersistentClient
from sentence_transformers import SentenceTransformer

client = PersistentClient(path="chroma_db")
collection = client.get_or_create_collection(name="documents")
embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def search_documents(query, document_id=None, top_k=3):
    query_embedding = embedding_model.encode(query).tolist()
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": top_k,
    }
    if document_id is not None:
        kwargs["where"] = {"document_id": str(document_id)}
    try:
        results = collection.query(**kwargs)
        docs = results["documents"][0]
        return docs if docs else []
    except Exception:
        return []
