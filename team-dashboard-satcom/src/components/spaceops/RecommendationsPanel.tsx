import { AlertCircle } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendation: string | null;
  onDismiss?: () => void;
}

export const RecommendationsPanel = ({ recommendation, onDismiss }: RecommendationsPanelProps) => {
  if (!recommendation) {
    return null;
  }

  return (
    <div className="mb-8 p-6 bg-primary/10 border-l-4 border-primary rounded-lg">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary mb-2">
            Countermeasure Available
          </h3>
          <p className="text-sm text-text-primary leading-relaxed">
            {recommendation}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
