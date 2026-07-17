import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Scissors, Brain, Database, X, Hash, Type, BookOpen, ChevronRight, List, Grid3x3, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { StageHeader } from '@/components/layout/StageHeader';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { usePipelineStore } from '@/store/pipeline';
import type { Chunk } from '@/types';

const pipelineSteps = [
  { icon: FileText, label: 'Upload PDF', key: 'upload' },
  { icon: Scissors, label: 'Extract Text', key: 'extract' },
  { icon: Scissors, label: 'Chunking', key: 'chunk' },
  { icon: Brain, label: 'Generate Embeddings', key: 'embed' },
  { icon: Database, label: 'Store in Vector DB', key: 'store' },
];

export function IngestionPage() {
  const { state, updateSettings, processDocument, setCurrentStage } = usePipelineStore();
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [processingLabel, setProcessingLabel] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setProcessing(true);
    setShowSuccess(false);
    setError(null);
    setCurrentStage(1);

    setProcessingStep(0);
    setProcessingLabel('Uploading PDF...');
    await new Promise(r => setTimeout(r, 300));

    setProcessingStep(1);
    setProcessingLabel('Extracting text...');
    await new Promise(r => setTimeout(r, 200));

    setProcessingStep(2);
    setProcessingLabel('Chunking document...');

    setProcessingStep(3);
    setProcessingLabel('Generating embeddings (first time may take 30-60s)...');

    try {
      setProcessingStep(4);
      setProcessingLabel('Storing in vector database...');
      await processDocument(file);
      setProcessingStep(5);
      setProcessingLabel('Done!');
      setProcessing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      setProcessing(false);
      setProcessingStep(-1);
      setError(err?.message || 'Failed to process PDF. Please try again.');
    }
  }, [processDocument, setCurrentStage]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const embeddingDims = state.settings.embeddingModel === 'text-embedding-3-small' ? '1536'
    : state.settings.embeddingModel === 'nomic-embed-text' ? '768' : '384';

  const chunkDelays = useMemo(() =>
    state.chunks.map((_, i) => (i * 0.03) % 0.3),
  [state.chunks]);

  return (
    <div className="space-y-8">
      <StageHeader stage={1} totalStages={4} title="Ingestion" subtitle="Transform your document into searchable knowledge" />

      <InfoPanel
        title="What's happening here?"
        description="In this stage, we convert your PDF into chunks, generate embeddings for each chunk, and store them in a vector database. These vectors will be used later to find relevant information for your questions."
        learnMoreUrl="https://docs.langchain.com/docs/modules/data_connection/document_loaders/pdf"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" /> Pipeline Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!state.document && !processing ? (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all cursor-pointer ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-white/[0.08] hover:border-primary/50'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Drag & drop your PDF here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : processing ? (
                <div className="space-y-6 py-4">
                  <Progress value={(processingStep / pipelineSteps.length) * 100} className="h-3" />
                  <p className="text-sm text-primary font-medium text-center">{processingLabel}</p>
                  <div className="flex items-center justify-between">
                    {pipelineSteps.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                              i < processingStep ? 'bg-success text-white' :
                              i === processingStep ? 'bg-primary text-white animate-pulse' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                              {i < processingStep ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{step.label}</span>
                          </div>
                          {i < pipelineSteps.length - 1 && (
                            <ChevronRight className="w-5 h-5 text-muted-foreground mx-2 mt-[-16px]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                    <FileText className="w-10 h-10 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{state.document!.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSize(state.document!.size)} · {state.document!.pages} pages · {state.chunks.length} chunks
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    {pipelineSteps.map((step, i) => {
                      return (
                        <div key={step.key} className="flex items-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success text-white flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{step.label}</span>
                          </div>
                          {i < pipelineSteps.length - 1 && (
                            <ChevronRight className="w-5 h-5 text-success mx-2 mt-[-16px]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive px-5 py-4 rounded-xl">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Upload Failed</p>
                    <p className="text-xs mt-1 opacity-80">{error}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setError(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {state.chunks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Document Chunks <span className="text-muted-foreground font-normal">({state.chunks.length} chunks)</span></CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Your document has been split into chunks. Each color represents a unique chunk.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
                        {state.chunks.map((chunk, idx) => (
                          <motion.button
                            key={chunk.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: chunkDelays[idx] }}
                            className={`aspect-square rounded-xl relative overflow-hidden transition-all hover:scale-105 ${
                              selectedChunk?.id === chunk.id ? 'ring-2 ring-white/80 scale-105' : ''
                            }`}
                            style={{ backgroundColor: chunk.color }}
                            onClick={() => setSelectedChunk(chunk)}
                            title={chunk.id}
                          >
                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-lg">
                              {chunk.id.replace('chunk_', '')}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {state.chunks.map((chunk) => (
                          <button
                            key={chunk.id}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                              selectedChunk?.id === chunk.id
                                ? 'bg-primary/10 border border-primary/30'
                                : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                            }`}
                            onClick={() => setSelectedChunk(chunk)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: chunk.color }}>
                              {chunk.id.replace('chunk_', '')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{chunk.text}</p>
                              <p className="text-xs text-muted-foreground">Page {chunk.page} · {chunk.tokens} tokens</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <AnimatePresence>
                      {selectedChunk && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border border-border rounded-xl p-5 mt-4 bg-secondary/30"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ backgroundColor: selectedChunk.color }}>
                              {selectedChunk.id.replace('chunk_', '')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{selectedChunk.id}</span>
                                {selectedChunk.topic && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{selectedChunk.topic}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Page {selectedChunk.page}</span>
                                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {selectedChunk.tokens} tokens</span>
                                <span className="flex items-center gap-1"><Type className="w-3.5 h-3.5" /> {selectedChunk.characters.toLocaleString()} chars</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedChunk(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{selectedChunk.text}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8 lg:sticky lg:top-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">⚙</span> Ingestion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm">Chunk Size (tokens)</label>
                  <span className="text-sm text-primary font-mono">{state.settings.chunkSize}</span>
                </div>
                <Slider
                  value={[state.settings.chunkSize]}
                  min={128}
                  max={2048}
                  step={64}
                  onValueChange={([v]) => updateSettings({ chunkSize: v })}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>128</span>
                  <span>2048</span>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2 bg-secondary/50 rounded-lg py-1">Current: {state.settings.chunkSize} tokens</p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm">Chunk Overlap (tokens)</label>
                  <span className="text-sm text-primary font-mono">{state.settings.chunkOverlap}</span>
                </div>
                <Slider
                  value={[state.settings.chunkOverlap]}
                  min={0}
                  max={512}
                  step={32}
                  onValueChange={([v]) => updateSettings({ chunkOverlap: v })}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>512</span>
                </div>
              </div>
              <div>
                <label className="text-sm mb-2 block">Embedding Model</label>
                <Select value={state.settings.embeddingModel} onValueChange={(v) => updateSettings({ embeddingModel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAAI/bge-small-en-v1.5">BAAI/bge-small-en-v1.5</SelectItem>
                    <SelectItem value="nomic-embed-text">Nomic Embed</SelectItem>
                    <SelectItem value="text-embedding-3-small">OpenAI text-embedding-3-small</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!state.document && !processing && (
                <Button className="w-full" size="lg" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Process PDF
                </Button>
              )}
            </CardContent>
          </Card>

          {state.document && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-primary">📊</span> Ingestion Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Pages', state.document.pages],
                  ['Total Tokens', state.document.totalTokens.toLocaleString()],
                  ['Chunks Created', state.chunks.length],
                  ['Avg. Tokens / Chunk', Math.round(state.document.totalTokens / state.chunks.length)],
                  ['Embedding Dimension', embeddingDims],
                  ['Vector DB', state.settings.vectorDb],
                  ['Est. Processing Time', `${(state.chunks.length * 0.035).toFixed(1)} sec`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{String(label)}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {state.chunks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chunk Legend <span className="text-xs text-muted-foreground font-normal">(showing first 10)</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {state.chunks.slice(0, 10).map((chunk) => (
                    <div key={chunk.id} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: chunk.color }} />
                      <span className="text-muted-foreground">{chunk.id.replace('chunk_', '')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw]"
          >
            <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success px-5 py-3 rounded-xl shadow-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">PDF processed successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
