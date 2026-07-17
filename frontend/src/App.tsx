import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { HomePage } from '@/pages/HomePage';
import { IngestionPage } from '@/pages/IngestionPage';
import { RetrievalPage } from '@/pages/RetrievalPage';
import { AugmentationPage } from '@/pages/AugmentationPage';
import { GenerationPage } from '@/pages/GenerationPage';
import { PlaygroundPage } from '@/pages/PlaygroundPage';
import { usePipelineStore } from '@/store/pipeline';

function App() {
  const { state } = usePipelineStore();

  const completedStages: number[] = [];
  if (state.document) completedStages.push(1);
  if (state.retrievedChunks.length > 0) completedStages.push(2);
  if (state.prompt.context) completedStages.push(3);
  if (state.generationResult) completedStages.push(4);

  return (
    <Router>
      <div className="flex h-screen bg-background relative">
        <Sidebar currentStage={state.currentStage} completedStages={completedStages} />
        <main className="flex-1 overflow-auto min-h-0 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/[0.02] rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-background)_70%)]" />
          </div>
          <div className="p-8 lg:p-10 max-w-[1500px] mx-auto relative">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/ingestion" element={<IngestionPage />} />
              <Route path="/retrieval" element={<RetrievalPage />} />
              <Route path="/augmentation" element={<AugmentationPage />} />
              <Route path="/generation" element={<GenerationPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/history" element={<div className="text-muted-foreground">History page coming soon</div>} />
              <Route path="/docs" element={<div className="text-muted-foreground">Documentation page coming soon</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
