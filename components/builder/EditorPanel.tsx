'use client';

import { memo, useCallback, useMemo } from 'react';
import { Save, Copy, Download, X } from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import dynamic from 'next/dynamic';

// Dynamic import for CodeMirror to avoid SSR issues
const CodeMirrorEditor = dynamic(
  () => import('./CodeMirrorEditor'),
  { ssr: false, loading: () => <div className="h-full bg-[#1e1e1e] flex items-center justify-center text-slate-500">Loading editor...</div> }
);

interface EditorPanelProps {
  isStreaming?: boolean;
}

export const EditorPanel = memo(function EditorPanel({ isStreaming }: EditorPanelProps) {
  const {
    files,
    selectedFile,
    unsavedFiles,
    updateFile,
    saveFile,
    selectFile
  } = useWorkbenchStore();

  const currentContent = useMemo(() => {
    if (!selectedFile || !files[selectedFile] || files[selectedFile]?.type !== 'file') return '';
    return (files[selectedFile] as { content: string }).content;
  }, [files, selectedFile]);

  const isUnsaved = selectedFile ? unsavedFiles.has(selectedFile) : false;

  const handleChange = useCallback((content: string) => {
    if (selectedFile) {
      updateFile(selectedFile, content);
    }
  }, [selectedFile, updateFile]);

  const handleSave = useCallback(async () => {
    if (selectedFile) {
      await saveFile(selectedFile);
    }
  }, [selectedFile, saveFile]);

  const handleCopy = useCallback(() => {
    if (currentContent) {
      navigator.clipboard.writeText(currentContent);
    }
  }, [currentContent]);

  const handleDownload = useCallback(() => {
    if (currentContent && selectedFile) {
      const blob = new Blob([currentContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [currentContent, selectedFile]);

  const getLanguageFromFile = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'jsx';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'css': case 'scss': case 'sass': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      default: return 'javascript';
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-slate-500">
        <div className="text-center">
          <div className="bg-transparent mb-4 flex justify-center opacity-20">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M7 8L3 12L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M17 8L21 12L17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M14 4L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <p className="text-lg font-medium text-slate-400">No file selected</p>
          <p className="text-sm mt-1 text-slate-600">Select a file from the tree to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          {/* File tab */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 rounded-md border border-slate-700/50">
            <span className="text-sm text-slate-300 font-mono">{selectedFile.split('/').pop()}</span>
            {isUnsaved && (
              <span className="w-2 h-2 rounded-full bg-orange-500 box-shadow-orange" title="Unsaved changes" />
            )}
          </div>
          
          {isStreaming && (
            <span className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md animate-pulse">
              Generating...
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={!isUnsaved}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed group"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors group"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors group"
            title="Download file"
          >
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          </button>
          <button
            onClick={() => selectFile(null)}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors group"
            title="Close file"
          >
            <X className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden relative">
        <CodeMirrorEditor
          value={currentContent}
          onChange={handleChange}
          onSave={handleSave}
          language={getLanguageFromFile(selectedFile)}
          readOnly={isStreaming}
        />
      </div>
    </div>
  );
});

export default EditorPanel;
