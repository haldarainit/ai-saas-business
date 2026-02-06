'use client';

import { useState } from 'react';
import type { ElementInfo } from './Inspector';

interface InspectorPanelProps {
  selectedElement: ElementInfo | null;
  isVisible: boolean;
  onClose: () => void;
}

export const InspectorPanel = ({ selectedElement, isVisible, onClose }: InspectorPanelProps) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'box'>('styles');

  if (!isVisible || !selectedElement) {
    return null;
  }

  const getRelevantStyles = (styles: Record<string, string>) => {
    const relevantProps = [
      'display',
      'position',
      'width',
      'height',
      'margin',
      'padding',
      'border',
      'background',
      'color',
      'font-size',
      'font-family',
      'text-align',
      'flex-direction',
      'justify-content',
      'align-items',
    ];

    return relevantProps.reduce((acc, prop) => {
      const value = styles[prop];
      if (value) acc[prop] = value;
      return acc;
    }, {} as Record<string, string>);
  };

  return (
    <div className="fixed right-4 top-20 w-80 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-40 max-h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <h3 className="font-medium text-slate-200">Element Inspector</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="p-3 border-b border-slate-700/50">
        <div className="text-sm">
          <div className="font-mono text-blue-400">
            {selectedElement.tagName.toLowerCase()}
            {selectedElement.id && <span className="text-green-400">#{selectedElement.id}</span>}
            {selectedElement.className && (
              <span className="text-yellow-400">.{selectedElement.className.split(' ')[0]}</span>
            )}
          </div>
          {selectedElement.textContent && (
            <div className="mt-1 text-slate-400 text-xs truncate">"{selectedElement.textContent}"</div>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-700/50">
        {(['styles', 'box'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize ${
              activeTab === tab ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-3 overflow-y-auto max-h-96">
        {activeTab === 'styles' && (
          <div className="space-y-2">
            {Object.entries(getRelevantStyles(selectedElement.styles)).map(([prop, value]) => (
              <div key={prop} className="flex justify-between text-sm">
                <span className="text-slate-400">{prop}:</span>
                <span className="text-slate-200 font-mono">{value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'box' && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Width:</span>
              <span className="text-slate-200">{Math.round(selectedElement.rect.width)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Height:</span>
              <span className="text-slate-200">{Math.round(selectedElement.rect.height)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Top:</span>
              <span className="text-slate-200">{Math.round(selectedElement.rect.top)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Left:</span>
              <span className="text-slate-200">{Math.round(selectedElement.rect.left)}px</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorPanel;

