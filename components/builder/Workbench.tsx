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
  Download,
  Upload,
  Settings,
  RefreshCw,
  FileText,
  Search as SearchIcon,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import FileTree from './FileTree';
import EditorPanel from './EditorPanel';
import Preview from './Preview';
import DiffView from './DiffView';
import Terminal from './Terminal';

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
      // Account for activity bar width (48px)
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
    setShowChat
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
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        {/* View Tabs */}
        <div className="flex items-center gap-1">
          {/* Toggle Chat Sidebar */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors mr-1"
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            {showChat ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
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

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Refresh */}
          {activeView === 'preview' && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Download */}
          <button
            onClick={onDownload}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
            title="Download project"
          >
            <Download className="w-4 h-4" />
          </button>

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
        {/* Activity Bar */}
        <div className="w-12 bg-slate-900 border-r border-slate-700/50 flex flex-col items-center py-4 gap-4 z-20 shrink-0">
          <button 
            onClick={() => {
              if (sidebarTab === 'files' && sidebarVisible) {
                setSidebarVisible(false);
              } else {
                setSidebarTab('files');
                setSidebarVisible(true);
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              sidebarTab === 'files' && sidebarVisible
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
            title="Explorer"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (sidebarTab === 'search' && sidebarVisible) {
                setSidebarVisible(false);
              } else {
                setSidebarTab('search');
                setSidebarVisible(true);
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              sidebarTab === 'search' && sidebarVisible
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
            title="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
          <button 
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors" 
            title="Source Control"
          >
            <GitCompare className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar */}
        {sidebarVisible && (
          <div 
            className="flex flex-col bg-[#1e1e1e] overflow-hidden shrink-0 relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            {sidebarTab === 'files' && <FileTree />}
            {sidebarTab === 'search' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 shrink-0">
                  <span className="text-sm font-medium text-slate-300">SEARCH</span>
                </div>
                <div className="p-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="w-full px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  Enter text to search
                </div>
              </div>
            )}
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

          {/* Terminal */}
          {showTerminal && (
            <>
              {/* Terminal Resize Handle */}
              <div 
                className={`h-1 shrink-0 cursor-row-resize transition-colors z-30 ${
                  isTerminalResizing ? 'bg-orange-500' : 'bg-slate-800 hover:bg-orange-500'
                }`}
                onMouseDown={startTerminalResize}
              />
              <div 
                className="shrink-0 overflow-hidden"
                style={{ height: `${terminalHeight}px` }}
              >
                <Terminal onClose={() => setShowTerminal(false)} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default Workbench;
