import React, { useEffect, useState } from 'react';

// A simple horizontal progress bar for this component
const FeedbackProgressBar: React.FC<{ value: number }> = ({ value }) => {
    const progress = Math.max(0, Math.min(100, value));
    return (
        <div className="w-full bg-[rgb(var(--player-scrubber-bg))] rounded-full h-1.5">
            <div
                className="h-1.5 rounded-full"
                style={{ width: `${progress}%`, backgroundColor: 'rgb(var(--player-text-primary))' }}
            ></div>
        </div>
    );
};

export interface Feedback {
  id: number;
  icon: React.ReactNode;
  text?: string;
  value?: number;
  max?: number;
}

interface PlayerFeedbackIndicatorProps {
  feedback: Feedback | null;
}

const PlayerFeedbackIndicator: React.FC<PlayerFeedbackIndicatorProps> = ({ feedback }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (feedback) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1200); // Show for 1.2 seconds
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-black/60 text-white rounded-lg p-4 transition-opacity duration-200 pointer-events-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}
         style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="flex flex-col items-center space-y-3 w-36 text-center">
        <div className="w-8 h-8">{feedback.icon}</div>
        {feedback.text && <span className="text-base font-bold whitespace-nowrap">{feedback.text}</span>}
        {(typeof feedback.value !== 'undefined' && typeof feedback.max !== 'undefined') && (
          <div className="w-full">
            <FeedbackProgressBar value={(feedback.value / feedback.max) * 100} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerFeedbackIndicator;
