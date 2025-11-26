'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white flex justify-between items-center"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute mt-1 w-full rounded-md bg-gray-800 border border-gray-600 shadow-lg z-10">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-700"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
