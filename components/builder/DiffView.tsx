'use client';

import { useMemo } from 'react';
import { diffLines, type Change } from 'diff';
import { useWorkbenchStore } from '@/lib/stores/workbench';

interface DiffViewProps {
  filePath?: string;
}

export function DiffView({ filePath }: DiffViewProps) {
  const { selectedFile, fileHistory, files } = useWorkbenchStore();
  
  const targetFile = filePath || selectedFile;
  
  const diffData = useMemo(() => {
    if (!targetFile) return null;
    
    const history = fileHistory[targetFile];
    const currentFile = files[targetFile];
    
    if (!history || !currentFile) return null;
    
    const originalContent = history.originalContent || '';
    const currentContent = currentFile.content || '';
    
    // Normalize line endings
    const normalizedOriginal = originalContent.replace(/\r\n/g, '\n');
    const normalizedCurrent = currentContent.replace(/\r\n/g, '\n');
    
    if (normalizedOriginal === normalizedCurrent) {
      return { changes: [], stats: { additions: 0, deletions: 0 } };
    }
    
    const changes = diffLines(normalizedOriginal, normalizedCurrent, {
      newlineIsToken: false,
      ignoreWhitespace: false
    });
    
    const stats = changes.reduce(
      (acc, change) => {
        if (change.added) {
          acc.additions += change.count || 0;
        }
        if (change.removed) {
          acc.deletions += change.count || 0;
        }
        return acc;
      },
      { additions: 0, deletions: 0 }
    );
    
    return { changes, stats };
  }, [targetFile, fileHistory, files]);

  if (!targetFile) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-slate-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-lg font-medium">No file selected</p>
          <p className="text-sm mt-1">Select a file to see changes</p>
        </div>
      </div>
    );
  }

  if (!diffData || diffData.changes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-slate-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-300">No changes</p>
          <p className="text-sm mt-1">The file has not been modified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-slate-300">{targetFile}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-400">+{diffData.stats.additions}</span>
          <span className="text-sm text-red-400">-{diffData.stats.deletions}</span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        {diffData.changes.map((change: Change, index: number) => {
          const lines = change.value.split('\n');
          // Remove last empty line from split
          if (lines[lines.length - 1] === '') {
            lines.pop();
          }
          
          return lines.map((line, lineIndex) => {
            const key = `${index}-${lineIndex}`;
            
            if (change.added) {
              return (
                <div
                  key={key}
                  className="flex hover:bg-green-900/30 bg-green-900/20"
                >
                  <div className="w-12 shrink-0 px-2 py-0.5 text-right text-slate-600 border-r border-slate-700 select-none">
                    +
                  </div>
                  <div className="flex-1 px-4 py-0.5 text-green-300 whitespace-pre">
                    {line || ' '}
                  </div>
                </div>
              );
            }
            
            if (change.removed) {
              return (
                <div
                  key={key}
                  className="flex hover:bg-red-900/30 bg-red-900/20"
                >
                  <div className="w-12 shrink-0 px-2 py-0.5 text-right text-slate-600 border-r border-slate-700 select-none">
                    -
                  </div>
                  <div className="flex-1 px-4 py-0.5 text-red-300 whitespace-pre line-through opacity-70">
                    {line || ' '}
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={key}
                className="flex hover:bg-slate-800/50"
              >
                <div className="w-12 shrink-0 px-2 py-0.5 text-right text-slate-600 border-r border-slate-700 select-none">
                  &nbsp;
                </div>
                <div className="flex-1 px-4 py-0.5 text-slate-400 whitespace-pre">
                  {line || ' '}
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

export default DiffView;
