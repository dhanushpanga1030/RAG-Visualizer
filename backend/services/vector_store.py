import chromadb
from chromadb.config import Settings

_client = None
_collection = None


def get_collection(
    persist_dir: str = "./chroma_db",
    collection_name: str = "rag_chunks",
):
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(
    chunk_ids: list[str],
    texts: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict],
    persist_dir: str = "./chroma_db",
):
    collection = get_collection(persist_dir)
    collection.add(
        ids=chunk_ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )
    return len(chunk_ids)


def query_chunks(
    query_embedding: list[float],
    top_k: int = 5,
    persist_dir: str = "./chroma_db",
) -> list[dict]:
    collection = get_collection(persist_dir)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    if results["ids"] and results["ids"][0]:
        for i, chunk_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i]
            similarity = 1 - distance  # cosine distance -> similarity
            chunks.append({
                "id": chunk_id,
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "similarity": round(similarity, 4),
            })
    return chunks


def get_collection_count(persist_dir: str = "./chroma_db") -> int:
    collection = get_collection(persist_dir)
    return collection.count()


def reset_collection(persist_dir: str = "./chroma_db"):
    global _client, _collection
    if _client is not None and _collection is not None:
        try:
            _client.delete_collection("rag_chunks")
        except Exception:
            pass
    _collection = None
    _client = None
