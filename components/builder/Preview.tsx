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
  const { previews, isStreaming } = useWorkbenchStore();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Device & Viewport State
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showFrame, setShowFrame] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [scale, setScale] = useState(1);

  // Get the preview URL (from props or store)
  const previewUrl = sandboxUrl || (previews.length > 0 ? previews[0].url : '');

  useEffect(() => {
    if (previewUrl) {
      setCurrentUrl(previewUrl);
      setIsLoading(true);
      setHasError(false);
    }
  }, [previewUrl]);

  // Handle resizing to fit scale
  useEffect(() => {
    if (!containerRef.current || selectedDevice.name === 'Responsive') {
        setScale(1);
        return;
    }

    const updateScale = () => {
        if (!containerRef.current) return;
        
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        const containerHeight = containerRef.current.clientHeight - 48;
        
        const targetWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
        const targetHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

        // Add extra space for frame
        const frameX = showFrame && selectedDevice.hasFrame ? 30 : 0;
        const frameY = showFrame && selectedDevice.hasFrame ? 60 : 0;

        const scaleX = containerWidth / (targetWidth + frameX);
        const scaleY = containerHeight / (targetHeight + frameY);
        
        setScale(Math.min(1, scaleX, scaleY));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    updateScale();

    return () => observer.disconnect();
  }, [selectedDevice, isLandscape, showFrame]);


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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
       containerRef.current?.requestFullscreen();
       setIsFullscreen(true);
    } else {
       document.exitFullscreen();
       setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
      const handler = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handler);
      return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (currentUrl) {
      window.open(`/live-preview?url=${encodeURIComponent(currentUrl)}`, '_blank');
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

  // Calculate dimensions for iframe container
  const getContainerStyle = () => {
    if (selectedDevice.name === 'Responsive') {
      return { width: '100%', height: '100%' };
    }

    const width = isLandscape ? selectedDevice.height : selectedDevice.width;
    const height = isLandscape ? selectedDevice.width : selectedDevice.height;

    return {
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        transition: 'all 0.3s ease-in-out'
    };
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50 relative z-20">
        {/* URL Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Window Options Menu */}
          <div className="relative">
            <button
                onClick={() => setShowOptions(!showOptions)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
                    showOptions ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
            >
                {selectedDevice.type === 'mobile' ? <Smartphone className="w-4 h-4" /> : 
                 selectedDevice.type === 'tablet' ? <Tablet className="w-4 h-4" /> : 
                 <Monitor className="w-4 h-4" />}
                <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown */}
            {showOptions && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                    <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-20 overflow-hidden text-sm">
                        
                         {/* View Settings */}
                        <div className="p-2 border-b border-slate-700/50 space-y-1">
                            <div className="text-xs font-semibold text-slate-500 px-2 py-1">Window Options</div>
                            <button 
                                onClick={() => handleOpenExternal()}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded text-left"
                            >
                                <span className="flex items-center gap-2">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Open in new tab
                                </span>
                            </button>
                            <button 
                                onClick={() => setShowFrame(!showFrame)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded text-left"
                            >
                                <span className="flex items-center gap-2">
                                    <Smartphone className="w-3.5 h-3.5" />
                                    Show Device Frame
                                </span>
                                {showFrame && <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                            </button>
                            <button 
                                onClick={() => setIsLandscape(!isLandscape)}
                                disabled={selectedDevice.name === 'Responsive'}
                                className={`w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded text-left ${selectedDevice.name === 'Responsive' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="flex items-center gap-2">
                                    <RotateCw className="w-3.5 h-3.5" />
                                    Landscape Mode
                                </span>
                                {isLandscape && <div className="w-2 h-2 rounded-full bg-orange-500 mr-1" />}
                            </button>
                        </div>

                        {/* Device List */}
                        <div className="p-2 max-h-[300px] overflow-y-auto">
                            <div className="text-xs font-semibold text-slate-500 px-2 py-1">Devices</div>
                            {DEVICES.map(device => (
                                <button
                                    key={device.name}
                                    onClick={() => {
                                        setSelectedDevice(device);
                                        setShowOptions(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2 py-2 rounded text-left transition-colors ${
                                        selectedDevice.name === device.name ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {device.type === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : 
                                         device.type === 'tablet' ? <Tablet className="w-3.5 h-3.5" /> : 
                                         <Monitor className="w-3.5 h-3.5" />}
                                        <div className="flex flex-col">
                                            <span>{device.name}</span>
                                            {device.width > 0 && <span className="text-[10px] text-slate-500">{device.width} x {device.height}</span>}
                                        </div>
                                    </span>
                                    {selectedDevice.name === device.name && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
          </div>

          <div className="w-px h-4 bg-slate-700/50 mx-1" />

          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Preview Frame */}
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
        <div style={getContainerStyle()} className={`relative ${selectedDevice.name !== 'Responsive' ? 'shadow-2xl' : ''}`}>
             
             {/* CSS Device Frame */}
             {selectedDevice.hasFrame && showFrame && (
                 <div className="absolute inset-0 pointer-events-none z-20 border-[12px] border-[#2a2a2e] rounded-[2.5rem] shadow-xl">
                    {/* Notch/Camera Area */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#2a2a2e] rounded-b-xl" />
                 </div>
             )}

            {/* Inner Iframe */}
            <iframe
                ref={iframeRef}
                src={currentUrl}
                className={`w-full h-full bg-white ${selectedDevice.hasFrame && showFrame ? 'rounded-[1.8rem]' : ''} ${selectedDevice.name === 'Responsive' ? '' : 'border border-slate-700/50'}`}
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
