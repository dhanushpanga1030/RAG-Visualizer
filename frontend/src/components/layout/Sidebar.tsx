import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Search,
  Layers,
  Sparkles,
  Play,
  History,
  BookOpen,
  Database,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/ingestion', label: '1. Ingestion', icon: FileText, stage: 1 },
  { path: '/retrieval', label: '2. Retrieval', icon: Search, stage: 2 },
  { path: '/augmentation', label: '3. Augmentation', icon: Layers, stage: 3 },
  { path: '/generation', label: '4. Generation', icon: Sparkles, stage: 4 },
];

const bottomNavItems = [
  { path: '/playground', label: 'Playground', icon: Play },
  { path: '/history', label: 'History', icon: History },
];

const stageInfo: Record<string, { title: string; description: string; url?: string }> = {
  '/ingestion': {
    title: "What's happening here?",
    description: 'In this stage, we convert your PDF into chunks, generate embeddings for each chunk, and store them in a vector database. These vectors will be used later to find relevant information for your questions.',
    url: 'https://docs.langchain.com/docs/modules/data_connection/document_loaders/pdf',
  },
  '/retrieval': {
    title: 'What happens in this stage?',
    description: 'Your question is converted to an embedding vector. We then perform a similarity search in the vector database to find the top-k most relevant document chunks.',
    url: 'https://docs.llamaindex.ai/en/stable/understanding/rag/',
  },
  '/augmentation': {
    title: 'What happens in this stage?',
    description: 'The top relevant chunks are added to the system prompt and user question to provide context to the LLM. This helps the model generate accurate and grounded answers.',
    url: 'https://docs.llamaindex.ai/en/stable/understanding/rag/',
  },
  '/generation': {
    title: 'What happens in this stage?',
    description: 'The final prompt is sent to the LLM. The model processes the prompt with the provided context and generates a grounded, accurate answer. The response is streamed back token by token.',
  },
};

interface SidebarProps {
  currentStage: number;
  completedStages: number[];
}

export function Sidebar({ currentStage, completedStages }: SidebarProps) {
  const location = useLocation();
  const info = stageInfo[location.pathname];

  return (
    <aside className="w-[280px] hidden md:flex border-r border-white/[0.08] bg-[#12121a] flex-col h-screen relative z-10">
      <div className="p-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[17px]">RAG Visualizer</h1>
            <p className="text-xs text-muted-foreground">Understand RAG Visually</p>
          </div>
        </div>
      </div>

      <div className="p-5 border-b border-white/[0.08]">
        <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wider">PROGRESS</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((stage) => (
            <div key={stage} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                  completedStages.includes(stage) && "bg-success text-white",
                  currentStage === stage && "bg-primary text-white ring-2 ring-primary/50",
                  !completedStages.includes(stage) && currentStage !== stage && "bg-secondary text-muted-foreground"
                )}
              >
                {completedStages.includes(stage) ? '✓' : stage}
              </div>
              {stage < 4 && (
                <div className={`h-0.5 w-6 mx-1.5 transition-colors ${completedStages.includes(stage) ? 'bg-success' : 'bg-secondary'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )
          }
        >
          <Home className="w-4 h-4" />
          Home
        </NavLink>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isCompleted = completedStages.includes(item.stage);
          const isCurrent = currentStage === item.stage;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  isCompleted && !isCurrent && "text-success"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
              {isCompleted && (
                <span className="ml-auto text-success text-xs">✓</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {info && (
        <div className="p-4 border-t border-white/[0.08]">
          <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-primary mb-1.5">{info.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {info.description}
            </p>
            {info.url && (
              <a
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                Learn more <ArrowRight className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/[0.08] space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
        <NavLink
          to="/docs"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )
          }
        >
          <BookOpen className="w-4 h-4" />
          Documentation
        </NavLink>
      </div>
    </aside>
  );
}
