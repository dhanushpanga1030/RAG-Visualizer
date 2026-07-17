from sentence_transformers import SentenceTransformer

_model = None


def get_model(model_name: str = "BAAI/bge-small-en-v1.5") -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(model_name)
    return _model


def generate_embeddings(
    texts: list[str],
    model_name: str = "BAAI/bge-small-en-v1.5",
) -> list[list[float]]:
    model = get_model(model_name)
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def generate_query_embedding(
    query: str,
    model_name: str = "BAAI/bge-small-en-v1.5",
) -> list[float]:
    model = get_model(model_name)
    embedding = model.encode([query], show_progress_bar=False)
    return embedding[0].tolist()


def get_embedding_dimensions(model_name: str = "BAAI/bge-small-en-v1.5") -> int:
    model = get_model(model_name)
    return model.get_sentence_embedding_dimension()
