import { useState, useCallback, useEffect } from 'react';
import type { PipelineState, Chunk, RetrievalResult, PipelineSettings } from '@/types';
import { CHUNK_COLORS } from '@/types';

const API_BASE = '/api';

const defaultSettings: PipelineSettings = {
  chunkSize: 512,
  chunkOverlap: 100,
  embeddingModel: 'BAAI/bge-small-en-v1.5',
  topK: 5,
  similarityMetric: 'Cosine Similarity',
  vectorDb: 'ChromaDB',
  llmModel: 'gemini-3.5-flash',
};

const defaultPrompt = {
  systemInstructions: `You are a helpful AI assistant. Use the provided context from the retrieved documents to answer the user question.\n\nIf the answer is not in the context, respond with "I don't know".\n\nAlways cite the source chunks used in your answer.`,
  context: '',
  question: '',
  answerFormat: 'Provide a clear and concise answer using the context above. Cite the chunk numbers in your response.',
};

const initialState: PipelineState = {
  currentStage: 0,
  document: null,
  chunks: [],
  retrievedChunks: [],
  query: '',
  prompt: defaultPrompt,
  generationResult: null,
  settings: defaultSettings,
};

let globalState = { ...initialState };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function setGlobalState(updater: (prev: PipelineState) => PipelineState) {
  globalState = updater(globalState);
  notifyListeners();
}

export function usePipelineStore() {
  const [state, setState] = useState(globalState);

  useEffect(() => {
    const listener = () => setState({ ...globalState });
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setCurrentStage = useCallback((stage: number) => {
    setGlobalState((prev) => ({ ...prev, currentStage: stage }));
  }, []);

  const updateSettings = useCallback((settings: Partial<PipelineSettings>) => {
    setGlobalState((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  const setPrompt = useCallback((prompt: Partial<PipelineState['prompt']>) => {
    setGlobalState((prev) => ({ ...prev, prompt: { ...prev.prompt, ...prompt } }));
  }, []);

  const processDocument = useCallback(async (file: File) => {
    const settings = globalState.settings;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_size', String(settings.chunkSize));
    formData.append('chunk_overlap', String(settings.chunkOverlap));
    formData.append('embedding_model', settings.embeddingModel);

    const res = await fetch(`${API_BASE}/ingest`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Ingestion failed. Check that the backend is running.' }));
      throw new Error(err.detail || 'Ingestion failed');
    }

    const data = await res.json();

    if (!data.chunks || data.chunks.length === 0) {
      throw new Error('No chunks were created. The PDF may be image-based or empty.');
    }

    const chunks: Chunk[] = data.chunks.map((c: any) => ({
      id: c.id,
      text: c.text,
      page: c.page,
      tokens: c.tokens,
      characters: c.characters,
      color: CHUNK_COLORS[parseInt(c.id.replace('chunk_', ''), 10) % CHUNK_COLORS.length],
      topic: c.topic,
    }));

    setGlobalState((prev) => ({
      ...prev,
      document: {
        name: data.document.name,
        size: data.document.size,
        pages: data.document.pages,
        chunks,
        totalTokens: data.document.total_tokens,
      },
      chunks,
    }));

    return data;
  }, []);

  const retrieveChunks = useCallback(async (query: string) => {
    const settings = globalState.settings;

    if (globalState.chunks.length === 0) {
      throw new Error('No documents ingested yet. Please upload a PDF in Stage 1 first.');
    }

    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: settings.topK,
        similarity_metric: settings.similarityMetric,
        embedding_model: settings.embeddingModel,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Search failed. Make sure documents are ingested.' }));
      throw new Error(err.detail || 'Search failed');
    }

    const data = await res.json();

    const retrievedChunks: RetrievalResult[] = data.results.map((r: any) => ({
      chunk: {
        id: r.chunk.id,
        text: r.chunk.text,
        page: r.chunk.page,
        tokens: r.chunk.tokens,
        characters: r.chunk.characters,
        color: CHUNK_COLORS[parseInt(r.chunk.id.replace('chunk_', ''), 10) % CHUNK_COLORS.length],
        topic: r.chunk.topic,
      },
      similarity: r.similarity,
    }));

    setGlobalState((prev) => ({
      ...prev,
      query,
      retrievedChunks,
      prompt: {
        ...prev.prompt,
        question: query,
        context: retrievedChunks.map((t) => `[Chunk ${t.chunk.id}] ${t.chunk.text}`).join('\n\n'),
      },
    }));

    return data;
  }, []);

  const generateAnswer = useCallback(async () => {
    const { prompt, settings, retrievedChunks } = globalState;

    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instructions: prompt.systemInstructions,
        context: prompt.context,
        question: prompt.question,
        answer_format: prompt.answerFormat,
        model: settings.llmModel,
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Generation failed' }));
      throw new Error(err.detail || 'Generation failed');
    }

    const data = await res.json();

    setGlobalState((prev) => ({
      ...prev,
      generationResult: {
        answer: data.answer,
        sources: retrievedChunks,
        tokensGenerated: data.tokens_generated,
        latency: data.latency,
      },
    }));

    return data;
  }, []);

  const resetPipeline = useCallback(() => {
    fetch(`${API_BASE}/reset`, { method: 'POST' }).catch(() => {});
    setGlobalState(() => ({ ...initialState }));
  }, []);

  return {
    state,
    setCurrentStage,
    updateSettings,
    setPrompt,
    processDocument,
    retrieveChunks,
    generateAnswer,
    resetPipeline,
  };
}
