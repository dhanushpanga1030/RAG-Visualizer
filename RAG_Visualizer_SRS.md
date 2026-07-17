# Software Requirements Specification (SRS)

## Project Title

**RAG Visualizer – Interactive RAG Learning & Visualization Platform**

**Version:** 1.0  
**Status:** Baseline  
**Prepared By:** Software Architecture Team  
**Date:** July 17, 2026

---

# 1. Introduction

## 1.1 Purpose

The purpose of this project is to build an **interactive educational web application** that visually explains how a Retrieval-Augmented Generation (RAG) system works.

Unlike traditional RAG chatbots, this platform focuses on **visual learning**, allowing users to observe every major stage of the RAG pipeline through animations, interactive graphs, and real-time visualizations.

The application will guide users through **four major stages** of RAG using dedicated pages.

---

# 2. Objectives

- Learn the complete RAG pipeline visually.
- Understand how PDFs become searchable knowledge.
- Observe chunk creation and embeddings.
- Visualize semantic search in vector space.
- Understand prompt construction.
- Observe LLM response generation.
- Experiment with chunk sizes and other RAG parameters.

---

# 3. Target Users

- AI Beginners
- Students
- Developers learning RAG
- AI Trainers
- Universities
- Research Labs
- Technical Interview Candidates

---

# 4. Product Overview

```text
Home
│
├── Stage 1 – Ingestion
├── Stage 2 – Retrieval
├── Stage 3 – Augmentation
└── Stage 4 – Generation
```

Each stage is presented as an interactive learning page.

---

# 5. Functional Requirements

## Stage 1 – Ingestion

### Objective
Convert uploaded PDFs into searchable vector embeddings.

### Features

- Drag & Drop PDF upload
- PDF metadata (name, size, pages)
- Animated processing pipeline:
  - PDF
  - Extract Text
  - Chunking
  - Embedding Generation
  - Store in Vector Database
- Chunk Size slider (128–2048 tokens)
- Chunk Overlap slider
- Embedding model selector
- Process PDF button

### Chunk Visualization

- Every chunk has a unique color.
- Colors remain consistent across all four stages.
- Click a chunk to view:
  - Chunk ID
  - Page Number
  - Token Count
  - Character Count
  - Chunk Text

### Statistics

- Pages
- Total Tokens
- Chunks Created
- Average Tokens per Chunk
- Embedding Dimensions
- Vector Database
- Estimated Processing Time

---

## Stage 2 – Retrieval

### Objective
Visualize semantic retrieval.

### Features

- Question input
- Query embedding animation
- Interactive vector space
- Colored chunk nodes
- Query node
- Similarity search animation
- Top-K retrieved chunk list
- Chunk preview panel
- Retrieval statistics

---

## Stage 3 – Augmentation

### Objective
Visualize prompt construction.

### Features

- System Prompt panel
- Retrieved Chunks panel
- User Question panel
- Animated merge into Final Prompt
- Prompt preview
- Copy Prompt button
- Prompt statistics

---

## Stage 4 – Generation

### Objective
Visualize LLM answer generation.

### Features

- Prompt → LLM → Thinking → Streaming → Answer
- Live token streaming
- Source citations
- Final answer panel
- Copy / Download answer
- Generation statistics
- Token utilization visualization

---

# Navigation

- Home
- Stage 1 – Ingestion
- Stage 2 – Retrieval
- Stage 3 – Augmentation
- Stage 4 – Generation
- Playground

---

# Playground

Users can modify:

- Chunk Size
- Chunk Overlap
- Embedding Model
- Top-K
- Similarity Metric
- Vector Database

Changes update visualizations in real time.

---

# Non-Functional Requirements

- Initial load < 2 seconds
- Smooth 60 FPS animations
- Real-time processing indicators
- Responsive design
- Secure file uploads
- HTTPS communication

---

# Technology Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Animation
- Framer Motion

## Visualization
- React Flow
- React Three Fiber
- Three.js

## Backend
- FastAPI

## PDF Processing
- PyMuPDF
- LangChain Text Splitters

## Embeddings
- BAAI/bge-small-en-v1.5
- Nomic Embed
- OpenAI text-embedding-3-small

## Vector Database
- ChromaDB
- Qdrant
- FAISS
- Pinecone

## LLM
- Gemini
- OpenAI
- Ollama

---

# Future Enhancements

- Multi-document RAG
- Side-by-side embedding model comparison
- 3D embedding explorer
- Pipeline replay
- Export visualizations
- Support for DOCX, PPTX, HTML, Audio
- Developer mode with API inspection
