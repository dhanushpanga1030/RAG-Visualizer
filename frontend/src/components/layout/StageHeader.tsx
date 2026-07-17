import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StageHeaderProps {
  stage: number;
  totalStages: number;
  title: string;
  subtitle: string;
}

const stageRoutes = [
  '/ingestion',
  '/retrieval',
  '/augmentation',
  '/generation',
];

export function StageHeader({ stage, totalStages, title, subtitle }: StageHeaderProps) {
  const navigate = useNavigate();
  
  const goNext = () => {
    if (stage < totalStages) {
      navigate(stageRoutes[stage]);
    }
  };
  
  const goPrev = () => {
    if (stage > 1) {
      navigate(stageRoutes[stage - 2]);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <p className="text-sm text-primary mb-2 font-medium">Stage {stage} of {totalStages}</p>
        <h1 className="text-[40px] font-bold mb-3 leading-tight">{stage}. {title}</h1>
        <p className="text-[16px] text-muted-foreground max-w-[700px] leading-relaxed">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {stage > 1 && (
          <Button variant="outline" size="default" onClick={goPrev} className="h-12 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        {stage < totalStages && (
          <Button size="default" onClick={goNext} className="h-12 rounded-xl">
            Next Stage
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        {stage === totalStages && (
          <Button size="default" onClick={() => navigate('/playground')} className="h-12 rounded-xl">
            View Full Pipeline
          </Button>
        )}
      </div>
    </div>
  );
}
