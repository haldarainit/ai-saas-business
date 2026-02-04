'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { Terminal as TerminalComponent } from './terminal/Terminal';
import { useWorkbenchStore } from '@/lib/stores/workbench';

interface TerminalProps {
  onClose?: () => void;
}

export const Terminal = memo(function Terminal({ onClose }: TerminalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const workbenchStore = useWorkbenchStore();
  
  // Use a ref to track if we've attached to avoid re-attaching unnecessarily
  const attachedRef = useRef(false);

  return (
    <div 
      className={`flex flex-col bg-[#1a1a1a] border-t border-slate-700/50 w-full ${
        isMaximized ? 'fixed inset-0 z-50 h-full' : 'h-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-sm text-slate-300">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden relative bg-[#0f172a]">
        <TerminalComponent
          className="absolute inset-0"
          theme="dark"
          readonly={false}
          onTerminalReady={(terminal) => {
             if (!attachedRef.current) {
                 // Attach to the BoltShell which is used by ActionRunner for AI commands
                 workbenchStore.terminalStore.attachBoltTerminal(terminal);
                 attachedRef.current = true;
             }
          }}
          onTerminalResize={(cols, rows) => {
             workbenchStore.terminalStore.onTerminalResize(cols, rows);
          }}
        />
      </div>
    </div>
  );
});
