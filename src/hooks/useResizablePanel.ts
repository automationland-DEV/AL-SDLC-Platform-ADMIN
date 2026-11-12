import { useCallback, useState } from 'react';

interface UseResizableOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: 'left' | 'right';
  storageKey?: string;
  onWidthChange?: (width: number) => void;
}

export function useResizablePanel({
  defaultWidth,
  minWidth,
  maxWidth,
  side,
  storageKey,
  onWidthChange,
}: UseResizableOptions) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = Number(saved);
          if (!Number.isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
            return parsed;
          }
        }
      } catch {
        /* ignore */
      }
    }
    return defaultWidth;
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;
      let frame: number | null = null;

      const onMove = (ev: MouseEvent) => {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
          const next = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
          setWidth(next);
          onWidthChange?.(next);
        });
      };

      const onUp = (ev: MouseEvent) => {
        if (frame !== null) cancelAnimationFrame(frame);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
        const finalWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
        if (storageKey) {
          try {
            window.localStorage.setItem(storageKey, String(finalWidth));
          } catch {
            /* ignore */
          }
        }
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [width, minWidth, maxWidth, side, storageKey, onWidthChange],
  );

  const handleReset = useCallback(() => {
    setWidth(defaultWidth);
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
    onWidthChange?.(defaultWidth);
  }, [defaultWidth, storageKey, onWidthChange]);

  return { width, setWidth, handleMouseDown, handleReset };
}
