import os
import time
import uuid
import traceback
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.pdf_processor import chunk_text, extract_text_from_pdf
from services.embeddings import (
    generate_embeddings,
    generate_query_embedding,
    get_embedding_dimensions,
)
from services.vector_store import (
    add_chunks,
    get_collection_count,
    query_chunks,
    reset_collection,
)
from services.llm import configure_gemini, generate_answer, generate_answer_streaming

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if GOOGLE_API_KEY:
        configure_gemini(GOOGLE_API_KEY)
    yield


app = FastAPI(title="RAG Visualizer API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class ProcessPDFRequest(BaseModel):
    chunk_size: int = 512
    chunk_overlap: int = 100
    embedding_model: str = EMBEDDING_MODEL


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    similarity_metric: str = "cosine"
    embedding_model: str = EMBEDDING_MODEL


class GenerateRequest(BaseModel):
    system_instructions: str
    context: str
    question: str
    answer_format: str = ""
    model: str = GEMINI_MODEL
    temperature: float = 0.2
    max_tokens: int = 2048


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "gemini_configured": bool(GOOGLE_API_KEY),
        "embedding_model": EMBEDDING_MODEL,
        "llm_model": GEMINI_MODEL,
    }


@app.post("/api/ingest")
async def ingest_pdf(
    file: UploadFile = File(...),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(100),
    embedding_model: str = Form(EMBEDDING_MODEL),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    start_time = time.time()

    try:
        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        raw_text, total_pages = extract_text_from_pdf(pdf_bytes)

        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. The PDF may be image-based or empty.")

        if chunk_overlap >= chunk_size:
            chunk_overlap = max(0, chunk_size // 4)

        chunks_text = chunk_text(raw_text, chunk_size, chunk_overlap)
        if not chunks_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

    embeddings = generate_embeddings(chunks_text, embedding_model)

    reset_collection(CHROMA_PERSIST_DIR)

    chunk_ids = [f"chunk_{i+1}" for i in range(len(chunks_text))]
    metadatas = []
    for i, text in enumerate(chunks_text):
        page_estimate = min(total_pages, int((i / len(chunks_text)) * total_pages) + 1)
        metadatas.append({
            "page": page_estimate,
            "tokens": len(text.split()),
            "characters": len(text),
            "chunk_index": i,
        })

    add_chunks(chunk_ids, chunks_text, embeddings, metadatas, CHROMA_PERSIST_DIR)

    total_tokens = sum(m["tokens"] for m in metadatas)
    elapsed = time.time() - start_time

    return {
        "document": {
            "name": file.filename,
            "size": len(pdf_bytes),
            "pages": total_pages,
            "total_tokens": total_tokens,
        },
        "chunks": [
            {
                "id": chunk_ids[i],
                "text": chunks_text[i],
                "page": metadatas[i]["page"],
                "tokens": metadatas[i]["tokens"],
                "characters": metadatas[i]["characters"],
                "topic": _assign_topic(i),
            }
            for i in range(len(chunks_text))
        ],
        "stats": {
            "chunks_created": len(chunks_text),
            "avg_tokens_per_chunk": round(total_tokens / len(chunks_text)),
            "embedding_dimensions": get_embedding_dimensions(embedding_model),
            "processing_time": round(elapsed, 2),
        },
    }


@app.post("/api/search")
def search_chunks(request: SearchRequest):
    start_time = time.time()

    try:
        query_emb = generate_query_embedding(request.query, request.embedding_model)
        results = query_chunks(query_emb, request.top_k, CHROMA_PERSIST_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    elapsed = time.time() - start_time

    return {
        "results": [
            {
                "chunk": {
                    "id": r["id"],
                    "text": r["text"],
                    "page": r["metadata"].get("page", 0),
                    "tokens": r["metadata"].get("tokens", 0),
                    "characters": r["metadata"].get("characters", 0),
                    "topic": _assign_topic(r["metadata"].get("chunk_index", 0)),
                },
                "similarity": r["similarity"],
            }
            for r in results
        ],
        "stats": {
            "total_chunks_searched": get_collection_count(CHROMA_PERSIST_DIR),
            "chunks_retrieved": len(results),
            "search_time_ms": round(elapsed * 1000),
            "query_model": request.embedding_model,
            "vector_dimension": get_embedding_dimensions(request.embedding_model),
        },
    }


@app.post("/api/generate")
def generate(request: GenerateRequest):
    if not GOOGLE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Google Gemini API key not configured. Set GOOGLE_API_KEY in .env",
        )

    prompt = f"""[SYSTEM INSTRUCTIONS]
{request.system_instructions}

[CONTEXT]
{request.context}

[QUESTION]
{request.question}

[ANSWER FORMAT]
{request.answer_format}"""

    start_time = time.time()
    try:
        result = generate_answer(prompt, request.model, request.temperature, request.max_tokens)
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Your free-tier daily limit (20 requests/day) has been reached. "
                       "Wait until tomorrow or upgrade your plan at https://ai.google.dev/gemini-api/docs/rate-limits",
            )
        raise HTTPException(status_code=500, detail=f"Generation failed: {err_msg}")
    elapsed = time.time() - start_time

    return {
        "answer": result["answer"],
        "tokens_generated": result["completion_tokens"],
        "prompt_tokens": result["prompt_tokens"],
        "total_tokens": result["tokens_used"],
        "latency": round(elapsed, 2),
    }


@app.post("/api/generate/stream")
def generate_stream(request: GenerateRequest):
    if not GOOGLE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Google Gemini API key not configured. Set GOOGLE_API_KEY in .env",
        )

    prompt = f"""[SYSTEM INSTRUCTIONS]
{request.system_instructions}

[CONTEXT]
{request.context}

[QUESTION]
{request.question}

[ANSWER FORMAT]
{request.answer_format}"""

    def event_generator():
        for token in generate_answer_streaming(prompt, request.model, request.temperature, request.max_tokens):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/stats")
def get_stats():
    return {
        "total_chunks": get_collection_count(CHROMA_PERSIST_DIR),
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimensions": get_embedding_dimensions(EMBEDDING_MODEL),
        "vector_db": "ChromaDB",
        "llm_model": GEMINI_MODEL,
    }


@app.post("/api/reset")
def reset():
    reset_collection(CHROMA_PERSIST_DIR)
    return {"status": "ok", "message": "Vector store reset"}


# ── Helpers ───────────────────────────────────────────────────────────────────

_topics = [
    "RAG Overview", "RAG Components", "RAG Benefits", "RAG Applications",
    "Embeddings", "Vector Search", "Chunking", "Prompt Engineering",
    "LLM Basics", "RAG Architecture", "Document Processing", "Similarity Metrics",
    "Context Window", "Token Generation", "RAG Pipeline", "Knowledge Base",
    "Semantic Search", "Query Processing", "Model Selection", "Fine-tuning",
]


def _assign_topic(index: int) -> str:
    return _topics[index % len(_topics)]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
