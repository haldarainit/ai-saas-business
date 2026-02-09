'use client';

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Code, 
  Eye, 
  GitCompare, 
  Terminal as TerminalIcon,
  X,
  PanelLeftClose,
  PanelLeft,
  FolderTree,
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import FileTree from './FileTree';
import EditorPanel from './EditorPanel';
import Preview from './Preview';
import DiffView from './DiffView';
import { Terminal } from './Terminal';

type ViewTab = 'code' | 'preview' | 'diff';
type SidebarTab = 'files' | 'search';

interface WorkbenchProps {
  sandboxUrl?: string;
  isStreaming?: boolean;
  onDownload?: () => void;
  onRefresh?: () => void;
}

// Custom resizable hook for sidebar
function useResizable(initialWidth: number, minWidth: number, maxWidth: number) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return { width, isResizing, startResize, containerRef };
}

// Custom hook for terminal resize
function useVerticalResizable(initialHeight: number, minHeight: number, maxHeight: number) {
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      
      setHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minHeight, maxHeight]);

  return { height, isResizing, startResize, containerRef };
}

export const Workbench = memo(function Workbench({
  sandboxUrl,
  isStreaming = false,
  onDownload,
  onRefresh
}: WorkbenchProps) {
  const {
    showWorkbench,
    currentView,
    setCurrentView,
    showTerminal,
    setShowTerminal,
    showChat,
    setShowChat,
  } = useWorkbenchStore();

  const [activeView, setActiveView] = useState<ViewTab>('code');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Resizable sidebar
  const { width: sidebarWidth, isResizing: isSidebarResizing, startResize: startSidebarResize, containerRef: mainContainerRef } = 
    useResizable(240, 160, 400);

  // Resizable terminal
  const { height: terminalHeight, isResizing: isTerminalResizing, startResize: startTerminalResize, containerRef: editorContainerRef } = 
    useVerticalResizable(200, 100, 400);

  const views: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'code', label: 'Code', icon: <Code className="w-4 h-4" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'diff', label: 'Diff', icon: <GitCompare className="w-4 h-4" /> }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700/50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50 shrink-0 h-10 gap-2">
        {/* Left Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* File Explorer Toggle */}
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className={`p-1.5 rounded-lg transition-colors mr-1 ${
              sidebarVisible ? 'bg-slate-700 text-white' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300'
            }`}
            title={sidebarVisible ? 'Hide Files' : 'Show Files'}
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors mr-2"
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            {showChat ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {/* View Switcher */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {view.icon}
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle Terminal */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-1.5 rounded-lg transition-colors ${
              showTerminal
                ? 'bg-green-500/20 text-green-400'
                : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-300'
            }`}
            title={showTerminal ? 'Hide terminal' : 'Show terminal'}
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={mainContainerRef}
        className="flex-1 overflow-hidden flex min-h-0"
        style={{ cursor: isSidebarResizing ? 'col-resize' : undefined }}
      >
        {/* Sidebar */}
        {sidebarVisible && (
          <div 
            className="flex flex-col bg-[#1e1e1e] overflow-hidden shrink-0 relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            {sidebarTab === 'files' && <FileTree />}
            {sidebarTab === 'search' && null}
          </div>
        )}

        {/* Sidebar Resize Handle */}
        {sidebarVisible && (
          <div 
            className={`w-1 shrink-0 cursor-col-resize transition-colors z-30 ${
              isSidebarResizing ? 'bg-orange-500' : 'bg-slate-800 hover:bg-orange-500'
            }`}
            onMouseDown={startSidebarResize}
          />
        )}

        {/* Editor/Preview/Diff Area */}
        <div 
          ref={editorContainerRef}
          className="flex-1 flex flex-col overflow-hidden min-w-0"
        >
          {/* Main View */}
          <div 
            className="relative bg-[#1e1e1e] overflow-hidden"
            style={{ flex: showTerminal ? '1 1 0' : '1 1 100%', minHeight: 0 }}
          >
            {/* Code View */}
            <div 
              className={`absolute inset-0 ${activeView === 'code' ? 'z-10' : 'z-0 pointer-events-none'}`}
              style={{ 
                visibility: activeView === 'code' ? 'visible' : 'hidden',
                opacity: activeView === 'code' ? 1 : 0
              }}
            >
              <EditorPanel isStreaming={isStreaming} />
            </div>

            {/* Preview View */}
            <div 
              className={`absolute inset-0 ${activeView === 'preview' ? 'z-10' : 'z-0 pointer-events-none'}`}
              style={{ 
                visibility: activeView === 'preview' ? 'visible' : 'hidden',
                opacity: activeView === 'preview' ? 1 : 0
              }}
            >
              <Preview sandboxUrl={sandboxUrl} />
            </div>

            {/* Diff View */}
            <div 
              className={`absolute inset-0 ${activeView === 'diff' ? 'z-10' : 'z-0 pointer-events-none'}`}
              style={{ 
                visibility: activeView === 'diff' ? 'visible' : 'hidden',
                opacity: activeView === 'diff' ? 1 : 0
              }}
            >
              <DiffView />
            </div>
          </div>

          {/* Terminal - Always mounted to preserve shell state for command execution */}
          <>
            {/* Terminal Resize Handle - Only visible when terminal is shown */}
            {showTerminal && (
              <div 
                className={`h-1 shrink-0 cursor-row-resize transition-colors z-30 ${
                  isTerminalResizing ? 'bg-orange-500' : 'bg-slate-800 hover:bg-orange-500'
                }`}
                onMouseDown={startTerminalResize}
              />
            )}
            {/* Terminal container - always mounted but hidden when not shown */}
            <div 
              className="shrink-0 overflow-hidden"
              style={{ 
                height: showTerminal ? `${terminalHeight}px` : '100px',
                visibility: showTerminal ? 'visible' : 'hidden',
                position: showTerminal ? 'relative' : 'absolute',
                clip: showTerminal ? undefined : 'rect(0 0 0 0)',
                clipPath: showTerminal ? undefined : 'inset(50%)',
                overflow: 'hidden',
              }}
            >
              <Terminal onClose={() => setShowTerminal(false)} />
            </div>
          </>
        </div>
      </div>
    </div>
  );
});

export default Workbench;
