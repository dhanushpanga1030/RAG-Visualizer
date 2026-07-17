import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Settings, Database, MessageSquare, ArrowDown, FileText, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageHeader } from '@/components/layout/StageHeader';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { usePipelineStore } from '@/store/pipeline';

function CircularGauge({ value, label }: { value: number; label: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius + 10} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius + 10} fill="none"
          stroke={value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#6366f1'}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="transition-all duration-1000"
        />
        <text x="60" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          {value.toFixed(1)}%
        </text>
        <text x="60" y="72" textAnchor="middle" fill="#a1a1aa" fontSize="9">
          Utilization
        </text>
      </svg>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function AugmentationPage() {
  const { state, setCurrentStage } = usePipelineStore();
  const [copied, setCopied] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  useEffect(() => {
    if (state.retrievedChunks.length > 0) {
      setCurrentStage(3);
      const timer = setTimeout(() => {
        setTimeout(() => setShowFinal(true), 600);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.retrievedChunks.length, setCurrentStage]);

  const fullPrompt = [
    '[SYSTEM INSTRUCTIONS]',
    state.prompt.systemInstructions,
    '',
    '[CONTEXT]',
    ...state.retrievedChunks.map(r => `[${r.chunk.id}] ${r.chunk.text}`),
    '',
    '[QUESTION]',
    state.prompt.question || '(No question)',
    '',
    '[ANSWER FORMAT]',
    state.prompt.answerFormat,
  ].join('\n');

  const systemTokens = state.prompt.systemInstructions.split(' ').length;
  const contextTokens = state.retrievedChunks.reduce((a, r) => a + r.chunk.tokens, 0);
  const questionTokens = state.prompt.question ? Math.ceil(state.prompt.question.split(' ').length * 1.3) : 0;
  const totalTokens = systemTokens + contextTokens + questionTokens;
  const maxContext = 4096;
  const utilization = (totalTokens / maxContext) * 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
        <div className="space-y-8">
      <StageHeader stage={3} totalStages={4} title="Augmentation" subtitle="We combine the retrieved chunks with the user question and system instructions to build the final prompt for the LLM." />

      <InfoPanel
        title="What happens in this stage?"
        description="The top relevant chunks are added to the system prompt and user question to provide context to the LLM. This helps the model generate accurate and grounded answers."
        learnMoreUrl="https://docs.llamaindex.ai/en/stable/understanding/rag/"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">🔗</span> Prompt Construction Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                {[
                  { icon: Settings, label: 'System Instructions', sub: 'Define behavior', color: 'from-indigo-500 to-indigo-600', ready: !!state.prompt.systemInstructions },
                  { icon: Database, label: 'Retrieved Chunks', sub: `Top ${state.retrievedChunks.length} relevant chunks`, color: 'from-violet-500 to-violet-600', ready: state.retrievedChunks.length > 0 },
                  { icon: MessageSquare, label: 'User Question', sub: "The user's query", color: 'from-purple-500 to-purple-600', ready: !!state.prompt.question },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border ${
                          item.ready ? 'border-primary/30 bg-primary/5' : 'border-white/[0.08] bg-secondary/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      </motion.div>
                      {i < 2 && <span className="text-muted-foreground text-base">+</span>}
                    </div>
                  );
                })}
                <span className="text-muted-foreground text-base">→</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    showFinal ? 'border-success bg-success/5' : 'border-white/[0.08] bg-secondary/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Final Prompt</p>
                    <p className="text-xs text-muted-foreground">Ready for LLM</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                    System Instructions
                    <Info className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/50 rounded-lg p-4 min-h-[12rem] h-auto max-h-48 overflow-y-auto">
                    <p className="text-sm text-muted-foreground leading-relaxed">{state.prompt.systemInstructions}</p>
                  </div>
                  <p className="text-xs text-primary mt-2">Tokens: {systemTokens}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">2</span>
                    Retrieved Chunks (Top {state.retrievedChunks.length})
                    <Info className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.retrievedChunks.length > 0 ? (
                    <div className="space-y-2 min-h-[12rem] h-auto max-h-48 overflow-y-auto">
                      {state.retrievedChunks.map((r) => (
                        <div key={r.chunk.id} className="flex items-start gap-3 p-2 bg-secondary/50 rounded-lg">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: r.chunk.color }}>
                            {r.chunk.id.replace('chunk_', '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium">Chunk {r.chunk.id.replace('chunk_', '')}</span>
                              <span className="text-xs text-muted-foreground">(Page {r.chunk.page})</span>
                              <span className="text-xs text-success ml-auto">{r.similarity.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{r.chunk.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[12rem] h-auto max-h-48 flex items-center justify-center text-sm text-muted-foreground">
                      No chunks retrieved yet
                    </div>
                  )}
                  <p className="text-xs text-accent mt-2">Total Tokens: {contextTokens.toLocaleString()}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold">3</span>
                    User Question
                    <Info className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/50 rounded-lg p-4 min-h-[12rem] h-auto max-h-48 overflow-y-auto">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {state.prompt.question || 'No question provided yet. Go to Stage 2 to ask a question.'}
                    </p>
                  </div>
                  <p className="text-xs text-success mt-2">Tokens: {questionTokens}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <AnimatePresence>
            {state.retrievedChunks.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                <div className="flex justify-center py-2">
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <ArrowDown className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showFinal && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-warning text-white flex items-center justify-center text-xs font-bold">4</span>
                      Final Prompt (Preview)
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Total Tokens: <span className="text-foreground font-medium">{totalTokens.toLocaleString()}</span></span>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copied ? 'Copied!' : 'Copy Prompt'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/50 rounded-lg p-5 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {fullPrompt}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

    <div className="space-y-8">
          {state.retrievedChunks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" /> Retrieved Chunk Sources
                  <Info className="w-4 h-4 text-muted-foreground ml-auto" />
                </CardTitle>
                <p className="text-xs text-muted-foreground">Click a chunk to view full content</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {state.retrievedChunks.map((r) => (
                  <div key={r.chunk.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: r.chunk.color }}>
                      {r.chunk.id.replace('chunk_', '')}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="text-muted-foreground">Page {r.chunk.page}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="text-muted-foreground">{r.chunk.tokens} tokens</span>
                    </div>
                    <span className="text-xs font-mono text-success">{r.similarity.toFixed(2)}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">📊</span> Augmentation Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <CircularGauge value={utilization} label="of context used" />
              </div>
              <div className="space-y-3 divide-y divide-border/50">
                {[
                  ['Retrieved Chunks', state.retrievedChunks.length],
                  ['Total Context Tokens', contextTokens.toLocaleString()],
                  ['System Prompt Tokens', systemTokens],
                  ['Question Tokens', questionTokens],
                  ['Final Prompt Tokens', totalTokens.toLocaleString()],
                  ['Max Context Length', maxContext.toLocaleString()],
                  ['Utilization', `${utilization.toFixed(1)}%`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{String(label)}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {showFinal && utilization < 80 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm">Good job! Your prompt is well within the context window limit.</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
