export interface Chunk {
  id: string;
  text: string;
  page: number;
  tokens: number;
  characters: number;
  color: string;
  topic?: string;
  embedding?: number[];
}

export interface Document {
  name: string;
  size: number;
  pages: number;
  chunks: Chunk[];
  totalTokens: number;
}

export interface RetrievalResult {
  chunk: Chunk;
  similarity: number;
}

export interface Prompt {
  systemInstructions: string;
  context: string;
  question: string;
  answerFormat: string;
}

export interface GenerationResult {
  answer: string;
  sources: RetrievalResult[];
  tokensGenerated: number;
  latency: number;
}

export interface PipelineState {
  currentStage: number;
  document: Document | null;
  chunks: Chunk[];
  retrievedChunks: RetrievalResult[];
  query: string;
  prompt: Prompt;
  generationResult: GenerationResult | null;
  settings: PipelineSettings;
}

export interface PipelineSettings {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  topK: number;
  similarityMetric: string;
  vectorDb: string;
  llmModel: string;
}

export const CHUNK_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
];
