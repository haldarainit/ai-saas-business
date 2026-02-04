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
  Globe,
  Maximize2,
  Minimize2,
  Settings, 
  Check,
  RotateCw
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface Device {
  name: string;
  type: DeviceType;
  width: number;
  height: number;
  hasFrame?: boolean;
}

const DEVICES: Device[] = [
  { name: 'Responsive', type: 'desktop', width: 0, height: 0, hasFrame: false },
  { name: 'iPhone 14 Pro', type: 'mobile', width: 393, height: 852, hasFrame: true },
  { name: 'iPhone SE', type: 'mobile', width: 375, height: 667, hasFrame: true },
  { name: 'Pixel 7', type: 'mobile', width: 412, height: 915, hasFrame: true },
  { name: 'iPad Mini', type: 'tablet', width: 768, height: 1024, hasFrame: true },
  { name: 'iPad Pro 11"', type: 'tablet', width: 834, height: 1194, hasFrame: true },
  { name: 'Desktop', type: 'desktop', width: 1440, height: 900, hasFrame: false },
];

interface PreviewProps {
  sandboxUrl?: string;
}

export function Preview({ sandboxUrl }: PreviewProps) {
  const { 
    previews, 
    isStreaming, 
    previewUrl: storePreviewUrl,
    setPreviewUrl, 
    previewDevice,
    previewShowFrame,
    previewIsLandscape,
    previewScale,
    setPreviewScale
  } = useWorkbenchStore();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Sync prop/store URL to global preview URL
  useEffect(() => {
    const url = sandboxUrl || (previews.length > 0 ? previews[0].url : '');
    if (url && url !== storePreviewUrl) {
      setPreviewUrl(url);
    }
  }, [sandboxUrl, previews, setPreviewUrl, storePreviewUrl]);

  // Reset loading state when URL changes
  useEffect(() => {
    if (storePreviewUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [storePreviewUrl]);

  // Handle resizing to fit scale
  useEffect(() => {
    if (!containerRef.current || previewDevice.name === 'Responsive') {
        setPreviewScale(1);
        return;
    }

    const updateScale = () => {
        if (!containerRef.current) return;
        
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        const containerHeight = containerRef.current.clientHeight - 48;
        
        const targetWidth = previewIsLandscape ? previewDevice.height : previewDevice.width;
        const targetHeight = previewIsLandscape ? previewDevice.width : previewDevice.height;

        // Add extra space for frame
        const frameX = previewShowFrame && previewDevice.hasFrame ? 30 : 0;
        const frameY = previewShowFrame && previewDevice.hasFrame ? 60 : 0;

        const scaleX = containerWidth / (targetWidth + frameX);
        const scaleY = containerHeight / (targetHeight + frameY);
        
        setPreviewScale(Math.min(1, scaleX, scaleY));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    updateScale();

    return () => observer.disconnect();
  }, [previewDevice, previewIsLandscape, previewShowFrame, setPreviewScale]);


  const handleRefresh = useCallback(() => {
    if (iframeRef.current && storePreviewUrl) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = `${storePreviewUrl}?t=${Date.now()}`;
    }
  }, [storePreviewUrl]);

  // Expose refresh functionality to parent via custom event or store if needed?
  // Current design: Workbench header will have refresh button. 
  // We can expose a "triggerRefresh" atom in store, or just re-set the URL with a query param?
  // Actually, standard way: changing the URL (even with query param) triggers refresh.
  // BUT the iframe.src update logic is inside the rendered component.
  // Workbench Refresh button needs to trigger `iframeRef.current.src = ...` which is here.
  // One way: add a `refreshPreview` counter to store. 
  // OR: Workbench refresh button just calls `setPreviewUrl(url + '?t=' + Date.now())`.
  
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

  if (!storePreviewUrl) {
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

  // Calculate dimensions for iframe container
  const getContainerStyle = () => {
    if (previewDevice.name === 'Responsive') {
      return { width: '100%', height: '100%' };
    }

    const width = previewIsLandscape ? previewDevice.height : previewDevice.width;
    const height = previewIsLandscape ? previewDevice.width : previewDevice.height;

    return {
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${previewScale})`,
        transformOrigin: 'center center',
        transition: 'all 0.3s ease-in-out'
    };
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Preview Frame - No Toolbar */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#1e1e1e]"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 rounded-lg">
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950 rounded-lg">
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

        {/* Device Frame & Iframe */}
        <div style={getContainerStyle()} className={`relative ${previewDevice.name !== 'Responsive' ? 'shadow-2xl' : ''}`}>
             
             {/* CSS Device Frame */}
             {previewDevice.hasFrame && previewShowFrame && (
                 <div className="absolute inset-0 pointer-events-none z-20 border-[12px] border-[#2a2a2e] rounded-[2.5rem] shadow-xl">
                    {/* Notch/Camera Area */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#2a2a2e] rounded-b-xl" />
                 </div>
             )}

            {/* Inner Iframe */}
            <iframe
                ref={iframeRef}
                src={storePreviewUrl}
                className={`w-full h-full bg-white ${previewDevice.hasFrame && previewShowFrame ? 'rounded-[1.8rem]' : ''} ${previewDevice.name === 'Responsive' ? '' : 'border border-slate-700/50'}`}
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
