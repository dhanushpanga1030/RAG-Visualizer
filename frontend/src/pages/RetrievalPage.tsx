import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Hash, Type, Sparkles, RotateCcw, ChevronRight, CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StageHeader } from '@/components/layout/StageHeader';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { usePipelineStore } from '@/store/pipeline';
import type { RetrievalResult } from '@/types';

function ChunkDot({ position, color, isRetrieved, onClick }: {
  position: [number, number, number];
  color: string;
  isRetrieved: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && isRetrieved) {
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <sphereGeometry args={[isRetrieved ? 0.12 : 0.06, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={isRetrieved ? color : '#000000'}
        emissiveIntensity={isRetrieved ? 0.5 : 0}
        transparent
        opacity={isRetrieved ? 1 : 0.3}
      />
      {isRetrieved && (
        <mesh>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}
    </mesh>
  );
}

function QueryDot({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x += 0.01;
      currentPos.current.lerp(new THREE.Vector3(...position), 0.1);
      meshRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color="#ffffff" emissive="#6366f1" emissiveIntensity={1} />
    </mesh>
  );
}

function ConnectionLine({ from, to, color, opacity }: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  opacity: number;
}) {
  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={opacity}
      dashed
      dashScale={5}
      dashSize={0.5}
      gapSize={0.5}
    />
  );
}

function VectorSpace3D({ chunks, retrievedChunks, queryPos }: {
  chunks: { x: number; y: number; z: number; color: string; id: string }[];
  retrievedChunks: RetrievalResult[];
  queryPos: [number, number, number];
}) {
  const retrievedIds = new Set(retrievedChunks.map(r => r.chunk.id));

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={true} enablePan={true} />

      {chunks.map((c) => (
        <ChunkDot
          key={c.id}
          position={[c.x, c.y, c.z]}
          color={c.color}
          isRetrieved={retrievedIds.has(c.id)}
          onClick={() => {}}
        />
      ))}

      <QueryDot position={queryPos} />

      {retrievedChunks.map((r) => {
        const chunk = chunks.find(c => c.id === r.chunk.id);
        if (!chunk) return null;
        return (
          <ConnectionLine
            key={r.chunk.id}
            from={queryPos}
            to={[chunk.x, chunk.y, chunk.z]}
            color={r.chunk.color}
            opacity={r.similarity}
          />
        );
      })}
    </>
  );
}

function VectorSpace2D({ chunks, retrievedChunks, queryPos }: {
  chunks: { x: number; y: number; color: string; id: string }[];
  retrievedChunks: RetrievalResult[];
  queryPos: { x: number; y: number } | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < rect.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, rect.height); ctx.stroke();
    }
    for (let i = 0; i < rect.height; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(rect.width, i); ctx.stroke();
    }

    const retrievedIds = new Set(retrievedChunks.map(r => r.chunk.id));

    chunks.forEach((c) => {
      const isRetrieved = retrievedIds.has(c.id);
      ctx.beginPath();
      ctx.arc(c.x, c.y, isRetrieved ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = isRetrieved ? 1 : 0.3;
      ctx.fill();
      if (isRetrieved) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    if (queryPos) {
      retrievedChunks.forEach((r) => {
        const chunk = chunks.find(c => c.id === r.chunk.id);
        if (chunk) {
          ctx.beginPath();
          ctx.moveTo(queryPos.x, queryPos.y);
          ctx.lineTo(chunk.x, chunk.y);
          ctx.strokeStyle = r.chunk.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = r.similarity;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      });

      ctx.beginPath();
      ctx.arc(queryPos.x, queryPos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#0a0a0f';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Q', queryPos.x, queryPos.y);
    }
  }, [chunks, retrievedChunks, queryPos]);

  return <canvas ref={canvasRef} className="w-full h-full rounded-lg" />;
}

export function RetrievalPage() {
  const { state, retrieveChunks, setCurrentStage, updateSettings } = usePipelineStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<RetrievalResult | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryPos, setQueryPos] = useState<{ x: number; y: number } | null>(null);
  const [queryPos3D, setQueryPos3D] = useState<[number, number, number]>([0, 0, 0]);
  const [animatedQueryPos, setAnimatedQueryPos] = useState<[number, number, number]>([0, 0, 0]);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'embedding' | 'searching' | 'done'>('idle');

  const chunkPositions = useMemo(() =>
    state.chunks.map((_, i) => {
      const total = state.chunks.length;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenAngle * i;
      const r = Math.sqrt(i / Math.max(total, 1)) * 3;
      return {
        x: r * Math.cos(theta),
        y: (i / Math.max(total, 1) - 0.5) * 4,
        z: r * Math.sin(theta),
      };
    }),
  [state.chunks.length]);

  const canvasChunks = state.chunks.map((c, i) => ({
    ...chunkPositions[i],
    color: c.color,
    id: c.id,
  }));

  const embeddingBlocks = useMemo(() =>
    Array.from({ length: 32 }).map((_, i) => ({
      hue: (i * 11 + 240) % 360,
      opacity: 0.7 + (((i * 7 + 3) % 10) / 10) * 0.3,
    })),
  []);

  const searchTime = useMemo(() => `${(Math.random() * 15 + 5).toFixed(0)} ms`, []);

  useEffect(() => {
    if (searchPhase === 'idle' || searchPhase === 'done') return;
    const target = searchPhase === 'embedding' ? [2, 1.5, 0] : queryPos3D;
    let frame: number;
    const animate = () => {
      setAnimatedQueryPos(prev => {
        const dx = target[0] - prev[0];
        const dy = target[1] - prev[1];
        const dz = target[2] - prev[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.05) return target;
        return [prev[0] + dx * 0.08, prev[1] + dy * 0.08, prev[2] + dz * 0.08];
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [searchPhase, queryPos3D]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || state.chunks.length === 0) return;
    setIsSearching(true);
    setShowSuccess(false);
    setError(null);
    setSearchPhase('embedding');
    setQueryPos({ x: 400, y: 200 });

    try {
      await new Promise(r => setTimeout(r, 800));
      setSearchPhase('searching');
      setQueryPos3D([0.5, 0.3, 0.2]);
      await new Promise(r => setTimeout(r, 400));
      await retrieveChunks(query);
      setSearchPhase('done');
      setIsSearching(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      setIsSearching(false);
      setSearchPhase('idle');
      setError(err?.message || 'Search failed. Make sure you have ingested a document first.');
    }
  }, [query, state.chunks.length, retrieveChunks]);

  useEffect(() => {
    if (state.retrievedChunks.length > 0) {
      setCurrentStage(2);
    }
  }, [state.retrievedChunks.length, setCurrentStage]);

  const embeddingDims = state.settings.embeddingModel === 'text-embedding-3-small' ? '1536'
    : state.settings.embeddingModel === 'nomic-embed-text' ? '768' : '384';

  return (
        <div className="space-y-8">
      <StageHeader stage={2} totalStages={4} title="Retrieval" subtitle="We convert your question into a vector and search the vector database to find the most relevant chunks." />

      <InfoPanel
        title="What happens in this stage?"
        description="Your question is converted to an embedding vector. We then perform a similarity search in the vector database to find the top-k most relevant document chunks."
        learnMoreUrl="https://docs.llamaindex.ai/en/stable/understanding/rag/"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-3">Ask a question</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="What is Retrieval-Augmented Generation (RAG)?"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border border-white/[0.08] text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-foreground">⊞</span> Press Enter to search
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Query Embedding
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-mono text-xs">{state.settings.embeddingModel}</span>
                  </div>
                  <div className="flex gap-0.5 flex-wrap">
                    {embeddingBlocks.map((block, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: `hsl(${block.hue}, 70%, 50%)`,
                          opacity: block.opacity,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{embeddingDims} dimensions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Vector Space Visualization
                  <Info className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Each dot represents a document chunk in the vector database.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === '3d' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                  >
                    3D View
                  </button>
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === '2d' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                  >
                    2D View
                  </button>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.location.reload()}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[350px] lg:h-[400px] bg-background rounded-2xl overflow-hidden border border-white/[0.08] relative">
                {isSearching && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {searchPhase === 'embedding' ? 'Converting query to embedding...' :
                     searchPhase === 'searching' ? 'Searching vector space...' : 'Processing...'}
                  </div>
                )}
                {viewMode === '3d' ? (
                  <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                    <VectorSpace3D
                      chunks={canvasChunks}
                      retrievedChunks={state.retrievedChunks}
                      queryPos={animatedQueryPos}
                    />
                  </Canvas>
                ) : (
                  <VectorSpace2D
                    chunks={canvasChunks}
                    retrievedChunks={state.retrievedChunks}
                    queryPos={queryPos}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">★</span> Query Vector
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-success" /> Top {state.settings.topK} Results
                </div>
                {state.chunks.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.id.replace('chunk_', '')}
                  </div>
                ))}
                {state.chunks.length > 5 && <span>... and more</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">Tip: The closer the dot to the query vector (★), the more similar the content.</p>
            </CardContent>
          </Card>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive px-5 py-4 rounded-xl">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Search Failed</p>
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
            {state.retrievedChunks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top {state.retrievedChunks.length} Retrieved Chunks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {state.retrievedChunks.map((result, i) => (
                      <motion.div
                        key={result.chunk.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedResult?.chunk.id === result.chunk.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-border/80 bg-secondary/30'
                        }`}
                        onClick={() => setSelectedResult(selectedResult?.chunk.id === result.chunk.id ? null : result)}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: result.chunk.color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Chunk {result.chunk.id.replace('chunk_', '')}</span>
                            <span className="text-xs text-muted-foreground">Page {result.chunk.page} · {result.chunk.tokens} tokens</span>
                          </div>
                          {result.chunk.topic && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{result.chunk.topic}</span>
                          )}
                        </div>
                        <span className="text-sm font-mono font-bold text-success shrink-0">
                          {result.similarity.toFixed(2)}
                        </span>
                      </motion.div>
                    ))}
                    <button className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1 cursor-default opacity-70">
                      <ListIcon className="w-4 h-4" /> View All Results ({state.chunks.length})
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedResult.chunk.color }} />
                      Preview: Chunk {selectedResult.chunk.id.replace('chunk_', '')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedResult.chunk.text}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs px-3 py-1 bg-secondary rounded-full flex items-center gap-1"><BookOpen className="w-3 h-3" /> Page: {selectedResult.chunk.page}</span>
                      <span className="text-xs px-3 py-1 bg-secondary rounded-full flex items-center gap-1"><Hash className="w-3 h-3" /> Tokens: {selectedResult.chunk.tokens}</span>
                      <span className="text-xs px-3 py-1 bg-secondary rounded-full flex items-center gap-1"><Type className="w-3 h-3" /> Characters: {selectedResult.chunk.characters.toLocaleString()}</span>
                      <span className="text-xs px-3 py-1 bg-secondary rounded-full">Chunk ID: {selectedResult.chunk.id}</span>
                      <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                        navigator.clipboard.writeText(selectedResult.chunk.text);
                      }}>
                        View Full Chunk <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

    <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retrieval Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
            </CardContent>
          </Card>

          {state.retrievedChunks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-primary">📊</span> Retrieval Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Total Chunks in DB', state.chunks.length],
                  ['Search Type', state.settings.similarityMetric],
                  ['Top K', state.settings.topK],
                  ['Search Time', searchTime],
                  ['Query Model', state.settings.embeddingModel],
                  ['Vector Dimension', embeddingDims],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{String(label)}</span>
                    <span className="font-medium truncate">{String(value)}</span>
                  </div>
                ))}
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
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Successfully retrieved top {state.retrievedChunks.length} relevant chunks!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/>
      <line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  );
}
