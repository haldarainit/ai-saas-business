'use client';

import { memo, useEffect, useRef } from 'react';
import type { PreviewInfo } from '@/lib/stores/previews';

interface PortDropdownProps {
  activePreviewIndex: number;
  setActivePreviewIndex: (index: number) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (value: boolean) => void;
  setHasSelectedPreview: (value: boolean) => void;
  previews: PreviewInfo[];
}

export const PortDropdown = memo(
  ({
    activePreviewIndex,
    setActivePreviewIndex,
    isDropdownOpen,
    setIsDropdownOpen,
    setHasSelectedPreview,
    previews,
  }: PortDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sortedPreviews = previews
      .map((previewInfo, index) => ({ ...previewInfo, index }))
      .sort((a, b) => a.port - b.port);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      if (isDropdownOpen) {
        window.addEventListener('mousedown', handleClickOutside);
      } else {
        window.removeEventListener('mousedown', handleClickOutside);
      }

      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isDropdownOpen, setIsDropdownOpen]);

    const activePreview = previews[activePreviewIndex];

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:bg-slate-900/60 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/70"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="i-ph:plug text-sm" />
          {activePreview ? <span className="font-medium">{activePreview.port}</span> : <span>Port</span>}
        </button>
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-xl z-50 overflow-hidden dark:border-slate-700/50 dark:bg-slate-900">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 dark:text-slate-400 dark:border-slate-700/50">
              Ports
            </div>
            {sortedPreviews.map((preview) => (
              <button
                key={preview.port}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  activePreviewIndex === preview.index
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                onClick={() => {
                  setActivePreviewIndex(preview.index);
                  setIsDropdownOpen(false);
                  setHasSelectedPreview(true);
                }}
              >
                {preview.port}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export default PortDropdown;
