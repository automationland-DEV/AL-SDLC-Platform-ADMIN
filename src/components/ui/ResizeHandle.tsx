interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  side: 'left' | 'right';
  className?: string;
}

export function ResizeHandle({ onMouseDown, onDoubleClick, side, className = '' }: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={`absolute top-0 ${
        side === 'right' ? '-right-1.5' : '-left-1.5'
      } z-40 flex h-full w-3 cursor-col-resize select-none items-center justify-center group ${className}`}
      title="Drag to resize (Double click to reset)"
    >
      <div className="h-full w-[3px] rounded-full bg-transparent transition-colors group-hover:bg-sky-500/60 group-active:bg-sky-500" />
    </div>
  );
}

export default ResizeHandle;
