import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Chọn giá trị',
  className = '',
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 220;
      const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

      setMenuStyle({
        position: 'fixed',
        top: openUpwards ? `${rect.top - 6}px` : `${rect.bottom + 6}px`,
        transform: openUpwards ? 'translateY(-100%)' : 'none',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        minWidth: '140px',
        zIndex: 99999,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        className={`flex items-center justify-between w-full px-3.5 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg text-sm transition-all duration-180 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
          disabled
            ? 'opacity-60 cursor-not-allowed pointer-events-none select-none'
            : 'cursor-pointer hover:border-[var(--border-hover)]'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? undefined : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="truncate mr-2 font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl py-1.5 max-h-60 overflow-y-auto"
          >
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                    value === option.value
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate" title={option.label}>
                    {option.label}
                  </span>
                  {value === option.value && (
                    <Check className="w-4 h-4 ml-2 flex-shrink-0 text-sky-500" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2.5 text-xs text-[var(--text-muted)] text-center">
                Không có lựa chọn
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
