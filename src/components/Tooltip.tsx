import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 280;
      const margin = 12;

      // Center horizontally relative to trigger icon
      let left = rect.left + rect.width / 2 - popupWidth / 2;
      if (left < margin) {
        left = margin;
      } else if (left + popupWidth > window.innerWidth - margin) {
        left = window.innerWidth - popupWidth - margin;
      }

      // Check vertical space (flip to top if close to bottom)
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 120 && rect.top > 120 ? 'top' : 'bottom';
      const top = placement === 'bottom' ? rect.bottom + 6 : rect.top - 6;

      setCoords({ top, left, placement });
    }
  }, []);

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="ヘルプ"
      >
        <HelpCircle size={14} />
      </span>
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={`tooltip-popup tooltip-placement-${coords.placement}`}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
              zIndex: 9999,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
