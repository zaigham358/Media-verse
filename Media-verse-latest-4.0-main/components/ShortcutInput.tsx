
import React, { useState, useEffect, useRef } from 'react';

interface ShortcutInputProps {
  value: string;
  onChange: (newValue: string) => void;
}

const formatKey = (e: KeyboardEvent): string => {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Control');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    let key = e.key;
    if (key === ' ') key = 'Space';

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        parts.push(key.toUpperCase());
    }

    return parts.join('+');
};

const ShortcutInput: React.FC<ShortcutInputProps> = ({ value, onChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsRecording(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setIsRecording(false);
      return;
    }
    
    // Ignore lonely modifier key presses
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
    }

    const newKey = formatKey(e.nativeEvent);
    if (newKey) {
        onChange(newKey);
    }
    setIsRecording(false);
  };

  const displayText = isRecording ? 'Press keys...' : value.replace('CONTROL', 'Ctrl/Cmd').replace('ARROW', '');

  return (
    <button
      ref={inputRef}
      onClick={() => setIsRecording(true)}
      onKeyDown={isRecording ? handleKeyDown : undefined}
      className={`w-40 text-left bg-input-bg text-xs text-text-secondary px-2 py-1 rounded-md font-mono border ${isRecording ? 'border-primary' : 'border-transparent'} focus:outline-none focus:border-primary`}
    >
      {displayText}
    </button>
  );
};

export default ShortcutInput;
