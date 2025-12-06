import { MouseEvent, useCallback, useRef } from 'react';

type ClickHandler = (event: MouseEvent) => void;

interface UseClickProps {
  onClick?: ClickHandler;
  onDoubleClick?: ClickHandler;
  onTripleClick?: ClickHandler;
  delay?: number;
}

export const useClick = ({ onClick, onDoubleClick, onTripleClick, delay = 250 }: UseClickProps): ClickHandler => {
  const clickCount = useRef(0);
  const timer = useRef<number | null>(null);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      clickCount.current += 1;
      
      if (timer.current) {
        clearTimeout(timer.current);
      }
      
      event.persist();

      timer.current = window.setTimeout(() => {
        if (clickCount.current === 1) {
          onClick?.(event);
        } else if (clickCount.current === 2) {
          onDoubleClick?.(event);
        } else if (clickCount.current >= 3) {
          onTripleClick?.(event);
        }
        clickCount.current = 0;
      }, delay);
    },
    [onClick, onDoubleClick, onTripleClick, delay]
  );

  return handleClick;
};
