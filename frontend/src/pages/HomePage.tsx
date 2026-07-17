import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Layers, Sparkles, ArrowRight, Database, Zap, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const stages = [
  {
    icon: FileText,
    title: 'Ingestion',
    description: 'Upload a PDF, extract text, chunk it, generate embeddings, and store them in a vector database.',
    color: 'from-indigo-500 to-indigo-600',
    path: '/ingestion',
  },
  {
    icon: Search,
    title: 'Retrieval',
    description: 'Ask a question and watch semantic search find the most relevant chunks from your document.',
    color: 'from-violet-500 to-violet-600',
    path: '/retrieval',
  },
  {
    icon: Layers,
    title: 'Augmentation',
    description: 'See how retrieved chunks are combined with prompts to construct the perfect LLM input.',
    color: 'from-purple-500 to-purple-600',
    path: '/augmentation',
  },
  {
    icon: Sparkles,
    title: 'Generation',
    description: 'Watch the LLM generate an answer using the retrieved context, with live token streaming.',
    color: 'from-fuchsia-500 to-fuchsia-600',
    path: '/generation',
  },
];

const features = [
  { icon: Eye, title: 'Visual Learning', description: 'See every stage of the RAG pipeline through animations and interactive graphs.' },
  { icon: Zap, title: 'Real-time Processing', description: 'Watch chunks get created, embedded, and retrieved in real-time.' },
  { icon: Database, title: 'Multiple Backends', description: 'Experiment with ChromaDB, Qdrant, FAISS, and Pinecone.' },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1500px] mx-auto space-y-20 py-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 relative"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <Database className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-5xl sm:text-6xl lg:text-[56px] font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
          RAG Visualizer
        </h1>

        <p className="text-[17px] text-muted-foreground max-w-[700px] mx-auto leading-relaxed">
          Understand how <span className="text-foreground font-medium">Retrieval-Augmented Generation</span> works
          through interactive visualizations. Upload a document, explore each stage of the pipeline, and
          experiment with parameters in real time.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Button size="lg" onClick={() => navigate('/ingestion')} className="px-10 h-12 rounded-xl">
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/playground')} className="h-12 rounded-xl">
            Playground
          </Button>
        </div>
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[40px] font-bold text-center mb-12"
        >
          The RAG Pipeline
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Card
                  className="cursor-pointer group h-full flex flex-col hover:-translate-y-1.5"
                  onClick={() => navigate(stage.path)}
                >
                  <CardContent className="p-8 flex flex-col flex-1">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-6 group-hover:scale-108 transition-transform duration-200`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-[22px] font-semibold mb-3">{stage.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{stage.description}</p>
                    <div className="mt-6 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Explore <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {stages.map((s, i) => (
              <div key={s.title} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${s.color}`} />
                {i < stages.length - 1 && <div className="w-12 h-px bg-white/[0.08]" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.08] pt-20">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[40px] font-bold text-center mb-12"
        >
          Why RAG Visualizer?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:-translate-y-1.5">
                  <CardContent className="p-8 text-center flex flex-col items-center flex-1">
                    <Icon className="w-9 h-9 mb-5 text-primary" />
                    <h3 className="text-[22px] font-semibold mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center pb-12"
      >
        <Button size="lg" onClick={() => navigate('/ingestion')} className="px-12 h-12 rounded-xl">
          Start Learning
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
