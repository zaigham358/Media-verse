
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className }) => {
  const progress = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full bg-input-bg rounded-full h-1.5 ${className}`}>
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
