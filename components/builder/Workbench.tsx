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
  GripVertical,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronDown,
  Clock
} from 'lucide-react';
import { useWorkbenchStore, DEVICES } from '@/lib/stores/workbench';
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
    // Preview State
    previewUrl,
    setPreviewUrl,
    previewDevice,
    setPreviewDevice,
    previewIsLandscape,
    setPreviewIsLandscape
  } = useWorkbenchStore();

  const [activeView, setActiveView] = useState<ViewTab>('code');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showDeviceOptions, setShowDeviceOptions] = useState(false);

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

  const handleOpenExternal = useCallback(() => {
    const url = previewUrl || sandboxUrl;
    if (!url) return;

    const match = url.match(/^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/);
    const targetUrl = match ? `/webcontainer/preview/${match[1]}` : url;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }, [previewUrl, sandboxUrl]);

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

        {/* Preview Controls (Center/Right) */}
        {activeView === 'preview' && (
           <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              {/* URL Bar */}
              <div className="flex items-center gap-2 flex-1 max-w-md min-w-[200px]">
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded-md flex-1 min-w-0">
                    <div className="text-slate-500 shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </div>
                    <input
                        type="text"
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                // Trigger refresh by updating store slightly or just expect user to hit refresh
                                onRefresh?.();
                            }
                        }}
                        className="bg-transparent text-xs text-slate-300 flex-1 min-w-0 outline-none"
                        spellCheck={false}
                    />
                </div>
              </div>

               {/* Separator */}
               <div className="w-px h-4 bg-slate-700/50" />

              {/* Device Selector */}
              <div className="relative">
                <button
                    onClick={() => setShowDeviceOptions(!showDeviceOptions)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors text-xs font-medium ${
                        showDeviceOptions ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    {previewDevice.type === 'mobile' ? <Settings className="w-3.5 h-3.5" /> : 
                     previewDevice.type === 'tablet' ? <Settings className="w-3.5 h-3.5" /> : 
                     <Settings className="w-3.5 h-3.5" />}
                    <span>{previewDevice.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-75" />
                </button>

                {/* Dropdown */}
                {showDeviceOptions && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDeviceOptions(false)} />
                        <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden text-sm">
                            
                             {/* View Settings */}
                            <div className="p-2 border-b border-slate-700/50 space-y-1">
                                <div className="text-xs font-semibold text-slate-500 px-2 py-1">Window Options</div>
                                <button 
                                    onClick={() => setPreviewIsLandscape(!previewIsLandscape)}
                                    disabled={previewDevice.name === 'Responsive'}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded text-left ${previewDevice.name === 'Responsive' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Landscape Mode
                                    </span>
                                    {previewIsLandscape && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                                </button>
                            </div>

                            {/* Device List */}
                            <div className="p-2 max-h-[300px] overflow-y-auto">
                                <div className="text-xs font-semibold text-slate-500 px-2 py-1">Devices</div>
                                {DEVICES.map(device => (
                                    <button
                                        key={device.name}
                                        onClick={() => {
                                            setPreviewDevice(device as any);
                                            setShowDeviceOptions(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2 py-2 rounded text-left transition-colors ${
                                            previewDevice.name === device.name ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{device.name}</span>
                                            {device.width > 0 && <span className="text-[10px] text-slate-500">{device.width}x{device.height}</span>}
                                        </span>
                                        {previewDevice.name === device.name && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
              </div>
           </div>
        )}

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Refresh Action (Only show for Preview) */}
          {activeView === 'preview' && (
            <>
              <button
                onClick={handleOpenExternal}
                disabled={!previewUrl && !sandboxUrl}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
                title="Refresh preview"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

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
        {/* Sidebar (No Activity Bar) */}
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

          {/* Terminal - Always mounted but hidden when closed to preserve state */}
          <>
            {/* Terminal Resize Handle - Only render when visible */}
            {showTerminal && (
              <div 
                className={`h-1 shrink-0 cursor-row-resize transition-colors z-30 ${
                  isTerminalResizing ? 'bg-orange-500' : 'bg-slate-800 hover:bg-orange-500'
                }`}
                onMouseDown={startTerminalResize}
              />
            )}
            <div 
              className="shrink-0 overflow-hidden"
              style={{ 
                height: `${terminalHeight}px`,
                display: showTerminal ? 'block' : 'none' 
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
