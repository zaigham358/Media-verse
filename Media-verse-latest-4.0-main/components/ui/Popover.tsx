import React, { useRef, useEffect, ReactNode } from 'react';

type Position = 
  'bottom-right' | 'bottom-left' | 'bottom-center' |
  'top-right' | 'top-left' | 'top-center';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactElement;
  children: ReactNode;
  position?: Position;
}

// FIX: Changed `position: Position` to `position: string` to resolve type error.
// The component's `position` prop is being inferred as a generic string,
// so this change makes the helper function's signature match the actual usage.
const getPositionClasses = (position: string) => {
    switch (position) {
        case 'top-left': return 'bottom-full left-0 mb-2';
        case 'top-center': return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        case 'top-right': return 'bottom-full right-0 mb-2';
        case 'bottom-left': return 'top-full left-0 mt-2';
        case 'bottom-center': return 'top-full left-1/2 -translate-x-1/2 mt-2';
        case 'bottom-right':
        default:
            return 'top-full right-0 mt-2';
    }
};

const Popover: React.FC<PopoverProps> = ({ isOpen, onClose, trigger, children, position = 'bottom-right' }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const positionClasses = getPositionClasses(position);

  return (
    <div ref={popoverRef} className="relative inline-flex">
      <div>
        {trigger}
      </div>
      {isOpen && (
        <div className={`absolute z-50 ${positionClasses}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Popover;