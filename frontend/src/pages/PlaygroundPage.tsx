import { useState } from 'react';
import { Sliders, Database, Cpu, BarChart3, RefreshCw, FileText, Search, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePipelineStore } from '@/store/pipeline';

export function PlaygroundPage() {
  const { state, updateSettings, processDocument, retrieveChunks, generateAnswer } = usePipelineStore();
  const [activeTab, setActiveTab] = useState('ingestion');

  const handleReprocess = () => {
    if (state.document) {
      const mockFile = new File([''], state.document.name, { type: 'application/pdf' });
      processDocument(mockFile);
    }
  };

  const handleReRetrieve = () => {
    if (state.query) {
      retrieveChunks(state.query);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-primary mb-2 font-medium">Experiment</p>
          <h1 className="text-[40px] font-bold mb-3 leading-tight">Playground</h1>
          <p className="text-[16px] text-muted-foreground max-w-[700px] leading-relaxed">Modify parameters and see how they affect the RAG pipeline in real time</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/80 backdrop-blur">
          <TabsTrigger value="ingestion" className="gap-2"><FileText className="w-4 h-4" /> Ingestion</TabsTrigger>
          <TabsTrigger value="retrieval" className="gap-2"><Search className="w-4 h-4" /> Retrieval</TabsTrigger>
          <TabsTrigger value="generation" className="gap-2"><Sparkles className="w-4 h-4" /> Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="ingestion" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" /> Chunking Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm">Chunk Size</label>
                    <span className="text-sm text-primary font-mono">{state.settings.chunkSize} tokens</span>
                  </div>
                  <Slider
                    value={[state.settings.chunkSize]}
                    min={128}
                    max={2048}
                    step={64}
                    onValueChange={([v]) => updateSettings({ chunkSize: v })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>128 (fine-grained)</span>
                    <span>2048 (broad)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm">Chunk Overlap</label>
                    <span className="text-sm text-primary font-mono">{state.settings.chunkOverlap} tokens</span>
                  </div>
                  <Slider
                    value={[state.settings.chunkOverlap]}
                    min={0}
                    max={512}
                    step={32}
                    onValueChange={([v]) => updateSettings({ chunkOverlap: v })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0 (no overlap)</span>
                    <span>512 (maximum)</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-2 block">Embedding Model</label>
                  <Select value={state.settings.embeddingModel} onValueChange={(v) => updateSettings({ embeddingModel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAAI/bge-small-en-v1.5">BAAI/bge-small-en-v1.5 (384 dims)</SelectItem>
                      <SelectItem value="nomic-embed-text">Nomic Embed (768 dims)</SelectItem>
                      <SelectItem value="text-embedding-3-small">OpenAI text-embedding-3-small (1536 dims)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleReprocess} disabled={!state.document}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reprocess Document
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Chunk Size Effects</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Smaller chunks (128-256): More precise retrieval, better context isolation</li>
                    <li>• Larger chunks (512-2048): More context per chunk, may include irrelevant info</li>
                  </ul>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Overlap Effects</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Higher overlap: Better context preservation across chunks</li>
                    <li>• Lower overlap: More unique chunks, less redundancy</li>
                  </ul>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Current Chunk Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Total Chunks: <span className="text-primary font-medium">{state.chunks.length}</span></div>
                    <div>Avg Size: <span className="text-primary font-medium">{state.chunks.length ? Math.round(state.chunks.reduce((a, c) => a + c.tokens, 0) / state.chunks.length) : 0}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retrieval" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" /> Retrieval Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm">Top-K</label>
                    <span className="text-sm text-primary font-mono">{state.settings.topK}</span>
                  </div>
                  <Slider
                    value={[state.settings.topK]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={([v]) => updateSettings({ topK: v })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 (most focused)</span>
                    <span>20 (most comprehensive)</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-2 block">Similarity Metric</label>
                  <Select value={state.settings.similarityMetric} onValueChange={(v) => updateSettings({ similarityMetric: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cosine Similarity">Cosine Similarity</SelectItem>
                      <SelectItem value="Euclidean Distance">Euclidean Distance</SelectItem>
                      <SelectItem value="Dot Product">Dot Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm mb-2 block">Vector Database</label>
                  <Select value={state.settings.vectorDb} onValueChange={(v) => updateSettings({ vectorDb: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ChromaDB">ChromaDB</SelectItem>
                      <SelectItem value="Qdrant">Qdrant</SelectItem>
                      <SelectItem value="FAISS">FAISS</SelectItem>
                      <SelectItem value="Pinecone">Pinecone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleReRetrieve} disabled={!state.query || state.chunks.length === 0}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-retrieve
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Metric Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Cosine Similarity', desc: 'Measures angle between vectors. Best for high-dimensional embeddings.', best: true },
                  { name: 'Euclidean Distance', desc: 'Measures straight-line distance. Good for lower-dimensional spaces.' },
                  { name: 'Dot Product', desc: 'Product of vector magnitudes. Fast but sensitive to vector magnitude.' },
                ].map((metric) => (
                  <div key={metric.name} className={`p-4 rounded-lg border ${metric.best ? 'border-primary bg-primary/5' : 'border-border bg-secondary/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{metric.name}</span>
                      {metric.best && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Recommended</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generation" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" /> LLM Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm mb-2 block">LLM Model</label>
                  <Select value={state.settings.llmModel} onValueChange={(v) => updateSettings({ llmModel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                      <SelectItem value="GPT-4o-mini">GPT-4o-mini</SelectItem>
                      <SelectItem value="Ollama (local)">Ollama (local)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={generateAnswer} disabled={!state.prompt.context}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Answer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" /> Pipeline Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: FileText, label: 'Stage 1: Ingestion', status: state.document ? 'complete' : 'pending', detail: state.document ? `${state.chunks.length} chunks` : 'No document' },
                  { icon: Search, label: 'Stage 2: Retrieval', status: state.retrievedChunks.length > 0 ? 'complete' : 'pending', detail: state.retrievedChunks.length > 0 ? `${state.retrievedChunks.length} chunks retrieved` : 'No query' },
                  { icon: Layers, label: 'Stage 3: Augmentation', status: state.prompt.context ? 'complete' : 'pending', detail: state.prompt.context ? 'Prompt built' : 'Waiting' },
                  { icon: Sparkles, label: 'Stage 4: Generation', status: state.generationResult ? 'complete' : 'pending', detail: state.generationResult ? 'Answer generated' : 'Waiting' },
                ].map(({ icon: Icon, label, status, detail }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Icon className={`w-5 h-5 ${status === 'complete' ? 'text-success' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      status === 'complete' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {status === 'complete' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
