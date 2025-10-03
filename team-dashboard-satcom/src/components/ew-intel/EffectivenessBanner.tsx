import { CheckCircle } from 'lucide-react';

interface EffectivenessBannerProps {
  effectiveness: string | null;
  onDismiss?: () => void;
}

export const EffectivenessBanner = ({ effectiveness, onDismiss }: EffectivenessBannerProps) => {
  if (!effectiveness) {
    return null;
  }

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-success/15 to-emerald-600/15 border-l-4 border-success rounded-lg">
      <div className="flex items-start gap-4">
        <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-success mb-2">
            Countermeasure Effectiveness
          </h3>
          <p className="text-sm text-text-primary leading-relaxed">
            {effectiveness}
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
