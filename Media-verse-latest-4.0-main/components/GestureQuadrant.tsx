import React from 'react';
import { useClick } from '../hooks/useClick';
import { ClickActions, GestureAction } from '../types';

interface GestureQuadrantProps {
  settings: ClickActions;
  onAction: (action: GestureAction) => void;
  sensitivity: number;
}

const GestureQuadrant: React.FC<GestureQuadrantProps> = ({ settings, onAction, sensitivity }) => {
  const handleClick = useClick({
    onClick: () => onAction(settings.singleClick),
    onDoubleClick: () => onAction(settings.doubleClick),
    onTripleClick: () => onAction(settings.tripleClick),
    delay: sensitivity,
  });

  return (
    <div
      className="w-full h-full"
      onClick={handleClick}
    />
  );
};

export default GestureQuadrant;
