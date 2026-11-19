import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  label?: string;
  icon?: React.ReactNode;
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
          isOpen
            ? 'border-primary shadow-lg ring-1 ring-primary/40 bg-surface-secondary'
            : 'border-border bg-surface-secondary hover:border-border/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && <span className="shrink-0 text-primary">{icon}</span>}
          <div className="min-w-0 flex-1">
            {label && (
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-muted leading-tight mb-0.5">
                {label}
              </span>
            )}
            <span
              className={`block text-sm font-semibold truncate ${
                selectedOption ? 'text-foreground' : 'text-muted'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Spacious Custom Dropdown Menu Popup */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 z-[100] mt-2.5 min-w-[280px] w-full bg-[#181512] border border-[#d4a853]/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-[#d4a853]/20 overflow-hidden backdrop-blur-2xl animate-fadeIn ${menuClassName}`}
        >
          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {options.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted">No options available</div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary/20 text-primary font-semibold border border-primary/30 shadow-sm'
                        : 'text-[#e8e2d5] hover:bg-white/10 hover:text-white font-normal'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-[14.5px] leading-snug">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs text-muted/80 truncate mt-0.5">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
