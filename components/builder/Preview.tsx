'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Smartphone, 
  Tablet, 
  Monitor,
  RotateCcw,
  ChevronDown,
  AlertCircle,
  Loader2,
  Globe
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';

type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'responsive';

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; icon: React.ReactNode; label: string }> = {
  mobile: { width: '375px', icon: <Smartphone className="w-4 h-4" />, label: 'Mobile' },
  tablet: { width: '768px', icon: <Tablet className="w-4 h-4" />, label: 'Tablet' },
  desktop: { width: '1280px', icon: <Monitor className="w-4 h-4" />, label: 'Desktop' },
  responsive: { width: '100%', icon: <Monitor className="w-4 h-4" />, label: 'Responsive' }
};

interface PreviewProps {
  sandboxUrl?: string;
}

export function Preview({ sandboxUrl }: PreviewProps) {
  const { previews, isStreaming } = useWorkbenchStore();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [viewport, setViewport] = useState<ViewportSize>('responsive');
  const [retryCount, setRetryCount] = useState(0);

  // Get the preview URL (from props or store)
  const previewUrl = sandboxUrl || (previews.length > 0 ? previews[0].url : '');

  useEffect(() => {
    if (previewUrl) {
      setCurrentUrl(previewUrl);
      setIsLoading(true);
      setHasError(false);
    }
  }, [previewUrl]);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current && currentUrl) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = `${currentUrl}?t=${Date.now()}`;
    }
  }, [currentUrl]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // Auto-retry up to 3 times
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        handleRefresh();
      }, 2000);
    }
  }, [retryCount, handleRefresh]);

  const handleOpenExternal = useCallback(() => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  }, [currentUrl]);

  if (!currentUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 text-slate-500">
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-lg font-medium">No preview available</p>
          <p className="text-sm mt-1">Generate code to see a live preview</p>
          {isStreaming && (
            <div className="mt-4 flex items-center justify-center gap-2 text-orange-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
        {/* URL Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-md flex-1 min-w-0 max-w-md">
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
              className="bg-transparent text-xs text-slate-400 flex-1 min-w-0 outline-none"
            />
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 mx-4">
          {(Object.entries(VIEWPORT_SIZES) as [ViewportSize, typeof VIEWPORT_SIZES[ViewportSize]][]).map(([key, { icon, label }]) => (
            <button
              key={key}
              onClick={() => setViewport(key)}
              className={`p-1.5 rounded transition-colors ${
                viewport === key
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#1e1e1e]">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-400">Loading preview...</p>
              {retryCount > 0 && (
                <p className="text-xs text-slate-500 mt-1">Retry {retryCount}/3</p>
              )}
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-300">Preview unavailable</p>
              <p className="text-sm text-slate-500 mt-1">The sandbox might still be starting up</p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  handleRefresh();
                }}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Iframe Container */}
        <div
          className="h-full transition-all duration-300 bg-white"
          style={{
            width: VIEWPORT_SIZES[viewport].width,
            maxWidth: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}

export default Preview;
