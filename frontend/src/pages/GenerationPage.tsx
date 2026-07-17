import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Download, Check, Clock, Hash, Cpu, FileText, ChevronRight, CheckCircle2, ThumbsUp, ThumbsDown, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StageHeader } from '@/components/layout/StageHeader';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { usePipelineStore } from '@/store/pipeline';

export function GenerationPage() {
  const { state, generateAnswer, setCurrentStage } = usePipelineStore();
  const [generating, setGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamComplete, setStreamComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pipelineSteps = [
    { label: 'Final Prompt', sub: `${state.retrievedChunks.reduce((a, r) => a + r.chunk.tokens, 0)} tokens`, icon: FileText },
    { label: `LLM (Model)`, sub: state.settings.llmModel, icon: Sparkles },
    { label: 'Processing', sub: 'Generating answer...', icon: Cpu },
    { label: 'Final Answer', sub: 'Streaming response', icon: FileText },
  ];

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    setStreamingText('');
    setStreamComplete(false);
    setShowSuccess(false);
    setFeedback(null);
    setError(null);

    for (let i = 0; i < pipelineSteps.length - 1; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const result = await generateAnswer();
      setCurrentStep(3);

      const fullText = result?.answer || '';

      for (let i = 0; i <= fullText.length; i++) {
        await new Promise(r => setTimeout(r, 12));
        setStreamingText(fullText.slice(0, i));
      }

      setCurrentStep(4);
      setStreamComplete(true);
      setGenerating(false);
      setCurrentStage(4);
      setShowSuccess(true);
    } catch (err: any) {
      setCurrentStep(4);
      setGenerating(false);
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota')) {
        setError('Gemini API daily quota exceeded (20 requests/day on free tier). Wait until tomorrow or get a new API key at https://aistudio.google.com/apikey');
      } else {
        setError(msg || 'Generation failed. Check that your GOOGLE_API_KEY is valid.');
      }
    }
  }, [generating, generateAnswer, setCurrentStage, pipelineSteps.length]);

  const handleCopy = () => {
    const text = state.generationResult?.answer || streamingText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = state.generationResult?.answer || streamingText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rag-answer.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tokens = streamingText.split(' ');
  const promptTokens = state.retrievedChunks.reduce((a, r) => a + r.chunk.tokens, 0) + 82;
  const generatedTokens = tokens.length;
  const totalEstTokens = promptTokens + generatedTokens;

  return (
        <div className="space-y-8">
      <StageHeader stage={4} totalStages={4} title="Generation" subtitle="The LLM generates the final answer using the augmented prompt." />

      <InfoPanel
        title="What happens in this stage?"
        description="The final prompt is sent to the LLM. The model processes the prompt with the provided context and generates a grounded, accurate answer. The response is streamed back token by token."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Generation Pipeline</CardTitle>
              <Button onClick={handleGenerate} disabled={generating || state.retrievedChunks.length === 0}>
                {generating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Sparkles className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {generating ? 'Generating...' : 'Generate Answer'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {pipelineSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-center">
                      <motion.div
                        className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                          i < currentStep ? 'bg-success text-white' :
                          i === currentStep && generating ? 'bg-primary text-white' :
                          i === currentStep ? 'bg-primary text-white' :
                           'bg-secondary text-muted-foreground border border-white/[0.08]'
                        }`}
                        animate={i === currentStep && generating ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        {i < currentStep ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </motion.div>
                        {i < pipelineSteps.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-1 ${i < currentStep ? 'bg-success' : 'bg-secondary'}`} />
                        )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1 mt-2">
                {pipelineSteps.map((s, i) => (
                  <div key={s.label} className="text-center max-w-[100px]">
                    <span className={i === currentStep ? 'text-primary font-medium' : ''}>{s.label}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{s.sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive px-5 py-4 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Generation Failed</p>
                <p className="text-xs mt-1 opacity-80">{error}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setError(null)}>
                <span className="text-xs">×</span>
              </Button>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                ⚡ Live Generation (Streaming)
              </CardTitle>
              {generating && (
                <span className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Generating...
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/50 rounded-2xl p-6 min-h-[160px] sm:min-h-[200px] relative">
                {streamingText ? (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingText}</p>
                    {!streamComplete && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-2 h-4 bg-primary ml-0.5"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Sparkles className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm">Click "Generate Answer" to start</p>
                    <p className="text-xs mt-1">Make sure you've completed Stage 2 first</p>
                  </div>
                )}
              </div>

              {streamingText && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tokens generated: {generatedTokens} / ~250</span>
                    <span>Speed: {(generatedTokens / 3).toFixed(1)} tokens/s</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {tokens.slice(-30).map((token, i) => (
                      <motion.span
                        key={`${i}-${token}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/20"
                      >
                        {token}
                      </motion.span>
                    ))}
                    {tokens.length > 30 && <span className="text-xs text-muted-foreground self-center">...</span>}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Streaming...</span>
                      <span>{Math.min(100, Math.round((generatedTokens / 250) * 100))}%</span>
                    </div>
                    <Progress value={Math.min(100, (generatedTokens / 250) * 100)} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <AnimatePresence>
            {state.generationResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" /> Final Answer
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copied ? 'Copied' : 'Copy Answer'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-1" />
                        Download Answer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-[15px] leading-relaxed">{state.generationResult.answer}</p>
                    <p className="text-xs text-muted-foreground">The model has generated a response using the provided context. The answer is grounded in {state.generationResult.sources.length} retrieved chunks.</p>

                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Was this answer helpful?</span>
                      <Button
                        variant={feedback === 'up' ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={feedback === 'down' ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                      >
                        <ThumbsDown className="w-4 h-4" />
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
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Sources Used in Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(state.generationResult?.sources || state.retrievedChunks).map((s) => (
                <div key={s.chunk.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: s.chunk.color }}>
                    {s.chunk.id.replace('chunk_', '')}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-medium">Chunk {s.chunk.id.replace('chunk_', '')}</span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground">Page {s.chunk.page}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">Similarity: {s.similarity.toFixed(2)}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">View</Button>
                </div>
              ))}
              <button className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1">
                <ChevronRight className="w-4 h-4" /> View All Retrieved Chunks ({state.retrievedChunks.length})
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">📊</span> Generation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Model', value: state.settings.llmModel },
                { label: 'Temperature', value: '0.2' },
                { label: 'Max Tokens', value: '512' },
                { label: 'Top P', value: '0.95' },
                { label: 'Stop Sequences', value: 'None' },
                { label: 'Prompt Tokens', value: promptTokens.toLocaleString() },
                { label: 'Completion Tokens', value: generatedTokens.toString() },
                { label: 'Total Tokens', value: totalEstTokens.toLocaleString() },
                { label: 'Latency', value: `${(state.generationResult?.latency || 2.43).toFixed(2)} sec` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium font-mono text-xs">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Token Streaming Visualization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-muted-foreground">Prompt Tokens ({promptTokens.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success" />
                  <span className="text-muted-foreground">Generated Tokens ({generatedTokens})</span>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-0.5">
                {Array.from({ length: 50 }).map((_, i) => {
                  const isPrompt = i < Math.ceil((promptTokens / totalEstTokens) * 50);
                  const isActive = isPrompt || i < Math.ceil((generatedTokens / Math.max(totalEstTokens, 1)) * 50);
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm transition-colors ${
                        isPrompt ? 'bg-primary' :
                        isActive ? 'bg-success' :
                        'bg-secondary'
                      }`}
                      style={{ opacity: isActive ? (isPrompt ? 0.8 : 0.6 + (i / 50) * 0.4) : 0.2 }}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Total: ~{totalEstTokens.toLocaleString()} tokens (Estimated)
              </p>
            </CardContent>
          </Card>
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
              <span className="text-sm font-medium">Answer generated successfully!</span>
              <span className="text-xs text-success/70">{(state.generationResult?.latency || 2.43).toFixed(2)} sec</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
