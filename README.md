# RAG Visualizer

An interactive web application that visualizes how **Retrieval-Augmented Generation (RAG)** works — stage by stage, in real time.

Upload a PDF, explore the pipeline through animations and 3D visualizations, and experiment with parameters to see how each stage affects the output.

---

## Features

- **Stage 1 — Ingestion**: Upload a PDF, extract text, chunk it, generate embeddings, and store them in a vector database
- **Stage 2 — Retrieval**: Ask a question and watch semantic search find the most relevant chunks with 3D/2D vector space visualization
- **Stage 3 — Augmentation**: See how retrieved chunks are combined with prompts to construct the final LLM input
- **Stage 4 — Generation**: Watch the LLM generate an answer with live token streaming
- **Playground**: Modify parameters and reprocess to see how changes affect each stage

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Three Fiber (3D visualization)
- Framer Motion (animations)
- React Flow
- Radix UI primitives

### Backend
- FastAPI (Python)
- ChromaDB (vector storage)
- Gemini API (LLM + embeddings)
- PyPDF (PDF processing)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google API Key (for Gemini API)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```
GOOGLE_API_KEY=your_google_api_key_here
```

Start the backend server:

```bash
python main.py
```

The API runs at `http://localhost:8000`

## Usage

1. Open the app in your browser
2. Go to **Stage 1 — Ingestion** and upload a PDF
3. Watch the pipeline process your document into chunks and embeddings
4. Move to **Stage 2 — Retrieval** and ask a question
5. See the 3D vector space visualize semantic similarity
6. Check **Stage 3 — Augmentation** to see the constructed prompt
7. Go to **Stage 4 — Generation** to watch the LLM generate an answer
8. Use the **Playground** to tweak parameters and reprocess

## Project Structure

```
RAG-Visualizer/
├── frontend/
│   ├── src/
│   │   ├── components/     # UI primitives and layout components
│   │   ├── pages/          # Stage pages (Home, Ingestion, Retrieval, etc.)
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── backend/
│   ├── main.py             # FastAPI server
│   ├── services/           # PDF processing, embeddings, LLM, vector store
│   └── requirements.txt
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Pipeline statistics |
| POST | `/api/ingest` | Upload and process a PDF |
| POST | `/api/search` | Search for relevant chunks |
| POST | `/api/generate` | Generate an answer using the LLM |

## License

MIT
