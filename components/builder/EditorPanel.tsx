'use client';

import { memo, useCallback, useMemo } from 'react';
import { Save, Copy, Download, X, RotateCcw, ChevronRight, File } from 'lucide-react';
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

function FileBreadcrumb({ path }: { path: string }) {
  const segments = path.split('/');
  
  return (
    <div className="flex items-center text-sm text-slate-400">
      {segments.map((segment, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-slate-600" />}
          {index === segments.length - 1 ? (
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <File className="w-3.5 h-3.5" />
              {segment}
            </span>
          ) : (
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              {segment}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export const EditorPanel = memo(function EditorPanel({ isStreaming }: EditorPanelProps) {
  const {
    files,
    selectedFile,
    unsavedFiles,
    updateFile,
    saveFile,
    selectFile,
    fileHistory
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

  const handleReset = useCallback(() => {
    if (selectedFile && fileHistory && fileHistory[selectedFile]) {
      // Revert to original content
      const originalContent = fileHistory[selectedFile]!.originalContent;
      updateFile(selectedFile, originalContent);
      // We should probably also save it immediately if we want to "hard reset", 
      // but usually reset just means reverting unsaved changes or going back to base.
      // For now, let's just update the content. If it matches the last saved version on disk (which we don't track separately from "original" efficiently here),
      // it might still show as unsaved in our simple tracker. 
      // But let's assume "originalContent" is what we want.
      
      // Actually, if we reset, we might want to clear the unsaved status if it matches?
      // For simple implementation, let's just update content.
      
      // Wait, if we revert to original, we are technically making an edit to match original.
    }
  }, [selectedFile, fileHistory, updateFile]);

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
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-slate-700/50">
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Breadcrumbs */}
          <FileBreadcrumb path={selectedFile} />
          
          {isUnsaved && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded-full border border-orange-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              Unsaved
            </span>
          )}
          
          {isStreaming && (
            <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md animate-pulse">
              Generating...
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isUnsaved && (
             <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-700/50 rounded-md text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium mr-2"
              title="Revert to original"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isUnsaved}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
              isUnsaved 
                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          
          <div className="w-px h-4 bg-slate-700/50 mx-2" />
          
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors text-slate-400 hover:text-slate-200"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors text-slate-400 hover:text-slate-200"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => selectFile(null)}
            className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors text-slate-400 hover:text-slate-200 ml-1"
            title="Close file"
          >
            <X className="w-4 h-4" />
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
