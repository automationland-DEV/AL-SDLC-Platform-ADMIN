import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  avatar?: string;
  email?: string;
}

interface MultiSearchableSelectProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSearchableSelect({
  options,
  values,
  onChange,
  placeholder = 'Chọn một mục...',
  className = '',
}: MultiSearchableSelectProps) {
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
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (option.email && option.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="flex items-center justify-between w-full min-w-[200px] min-h-[42px] px-3.5 py-1.5 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg text-sm cursor-pointer hover:border-[var(--border-hover)] focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all duration-180"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1 pr-2">
          {values.length === 0 ? (
            <span className="text-[var(--text-muted)] py-1">{placeholder}</span>
          ) : (
            values.map((val) => {
              const opt = options.find((o) => o.value === val);
              if (!opt) return null;
              return (
                <span
                  key={val}
                  className="flex items-center gap-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium px-2 py-1 rounded-md"
                >
                  {opt.avatar && <img src={opt.avatar} alt="" className="w-4 h-4 rounded-full" />}
                  {opt.label}
                  <button
                    onClick={(e) => removeOption(e, val)}
                    className="ml-0.5 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden">
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

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer hover:bg-[var(--bg-hover)] transition-colors ${
                      isSelected
                        ? 'bg-sky-500/5'
                        : ''
                    }`}
                    onClick={() => toggleOption(option.value)}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {option.avatar ? (
                        <img src={option.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-[var(--border-color)] shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">
                            {option.label.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col truncate">
                        <span className={`truncate ${isSelected ? 'text-sky-600 dark:text-sky-400 font-semibold' : 'text-[var(--text-primary)]'}`}>
                          {option.label}
                        </span>
                        {option.email && (
                          <span className="text-[10px] text-[var(--text-muted)] truncate">{option.email}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                      isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-input)]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })
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
