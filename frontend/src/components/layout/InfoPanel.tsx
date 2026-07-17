import { ArrowRight } from 'lucide-react';

interface InfoPanelProps {
  title: string;
  description: string;
  learnMoreUrl?: string;
}

export function InfoPanel({ title, description, learnMoreUrl }: InfoPanelProps) {
  return (
    <div className="bg-gradient-to-b from-primary/[0.08] to-transparent border border-primary/[0.15] border-l-4 border-l-primary rounded-xl p-6">
      <h3 className="text-sm font-semibold text-primary mb-2">{title}</h3>
      <p className="text-[15px] text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          className="inline-flex items-center text-xs text-primary hover:underline"
        >
          Learn more
          <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      )}
    </div>
  );
}
