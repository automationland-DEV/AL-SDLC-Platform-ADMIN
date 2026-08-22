import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DAYS_OF_WEEK = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DatePicker({ value, onChange, placeholder = 'Select date', className = '', disabled = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial date or use current date for calendar view
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
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

  // Update calendar view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
         
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Mon=0, Sun=6
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    // Format to YYYY-MM-DD local time
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setIsOpen(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`prev-${i}`} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] text-sm opacity-50">
          {daysInPrevMonth - firstDay + i + 1}
        </div>
      );
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value && new Date(value).getDate() === i && new Date(value).getMonth() === currentMonth && new Date(value).getFullYear() === currentYear;
      
      days.push(
        <button
          key={`current-${i}`}
          onClick={(e) => { e.stopPropagation(); handleDateSelect(i); }}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
            isSelected 
              ? 'bg-primary-500 text-white font-bold' 
              : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next month padding to fill 6 rows of 7 days (42 cells)
    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div key={`next-${i}`} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] text-sm opacity-50">
          {i}
        </div>
      );
    }

    return days;
  };

  // Format displayed value
  const displayValue = value ? new Date(value).toLocaleDateString('vi-VN') : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          disabled ? 'opacity-60 cursor-not-allowed pointer-events-none select-none' : 'cursor-pointer hover:border-primary-500'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? undefined : 0}
      >
        <span className={displayValue ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-[var(--text-muted)]" />
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-[var(--text-primary)] font-semibold text-sm">
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <button onClick={handleNextMonth} className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendarDays()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
            <button 
              onClick={handleClear}
              className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
            <button 
              onClick={handleToday}
              className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
