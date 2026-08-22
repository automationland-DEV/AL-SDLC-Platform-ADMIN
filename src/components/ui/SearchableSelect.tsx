import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        className="flex items-center justify-between w-full min-w-[200px] px-3.5 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg text-sm cursor-pointer hover:border-[var(--border-hover)] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-180"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2 font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-card)] z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-sky-500"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer hover:bg-[var(--bg-hover)] transition-colors ${
                    option.value === value
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                      : 'text-[var(--text-primary)]'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-center text-[var(--text-muted)]">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
