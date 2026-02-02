'use client';

import { memo, useState } from 'react';
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
  FileText
} from 'lucide-react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import FileTree from './FileTree';
import EditorPanel from './EditorPanel';
import Preview from './Preview';
import DiffView from './DiffView';
import Terminal from './Terminal';

type ViewTab = 'code' | 'preview' | 'diff';

interface WorkbenchProps {
  sandboxUrl?: string;
  isStreaming?: boolean;
  onDownload?: () => void;
  onRefresh?: () => void;
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

  const views: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'code', label: 'Code', icon: <Code className="w-4 h-4" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'diff', label: 'Diff', icon: <GitCompare className="w-4 h-4" /> }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700/50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
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
      <div className="flex-1 overflow-hidden flex">
        {/* Activity Bar */}
        <div className="w-12 bg-slate-900 border-r border-slate-700/50 flex flex-col items-center py-4 gap-4 z-20">
          <button className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors" title="Explorer">
            <FileText className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors" title="Search">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors" title="Source Control">
            <GitCompare className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Group orientation="horizontal">
            {/* File Tree */}
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <FileTree />
            </Panel>

            <Separator className="w-1 bg-slate-800 hover:bg-orange-500 transition-colors cursor-col-resize z-30" />

            {/* Editor/Preview/Diff */}
            <Panel defaultSize={80}>
              <Group orientation="vertical">
                {/* Main View */}
                <Panel defaultSize={showTerminal ? 70 : 100}>
                  <div className="h-full relative bg-[#1e1e1e]">
                    {/* Code View */}
                    <div className={`absolute inset-0 transition-opacity ${activeView === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                      <EditorPanel isStreaming={isStreaming} />
                    </div>

                    {/* Preview View */}
                    <div className={`absolute inset-0 transition-opacity ${activeView === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                      <Preview sandboxUrl={sandboxUrl} />
                    </div>

                    {/* Diff View */}
                    <div className={`absolute inset-0 transition-opacity ${activeView === 'diff' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                      <DiffView />
                    </div>
                  </div>
                </Panel>

                {/* Terminal */}
                {showTerminal && (
                  <>
                    <Separator className="h-1 bg-slate-800 hover:bg-orange-500 transition-colors cursor-row-resize z-30" />
                    <Panel defaultSize={30} minSize={15} maxSize={50}>
                      <Terminal onClose={() => setShowTerminal(false)} />
                    </Panel>
                  </>
                )}
              </Group>
            </Panel>
          </Group>
        </div>
      </div>
    </div>
  );
});

export default Workbench;
