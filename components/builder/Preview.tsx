'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Scan,
  RotateCw,
  Ruler,
  QrCode,
} from 'lucide-react';
import { DEVICES, useWorkbenchStore } from '@/lib/stores/workbench';
import PortDropdown from './PortDropdown';
import ScreenshotSelector from './ScreenshotSelector';
import Inspector, { type ElementInfo } from './Inspector';
import InspectorPanel from './InspectorPanel';
import ExpoQrModal from './ExpoQrModal';

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
    setPreviewDevice,
    previewShowFrame,
    setPreviewShowFrame,
    previewIsLandscape,
    setPreviewIsLandscape,
    previewScale,
    setPreviewScale,
  } = useWorkbenchStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const hasSelectedPreview = useRef(false);
  const [displayPath, setDisplayPath] = useState('/');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isInspectorMode, setIsInspectorMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [showInspectorPanel, setShowInspectorPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const activePreview = previews[activePreviewIndex];
  const activeBaseUrl = activePreview?.baseUrl;

  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      const minPortIndex = previews.reduce((minIndex, preview, index, array) => {
        return preview.port < array[minIndex].port ? index : minIndex;
      }, 0);
      if (minPortIndex !== activePreviewIndex) {
        setActivePreviewIndex(minPortIndex);
      }
    }
  }, [previews, activePreviewIndex]);

  useEffect(() => {
    if (sandboxUrl && previews.length > 0 && !hasSelectedPreview.current) {
      const matchIndex = previews.findIndex((preview) => preview.baseUrl === sandboxUrl);
      if (matchIndex >= 0 && matchIndex !== activePreviewIndex) {
        setActivePreviewIndex(matchIndex);
      }
    }
  }, [sandboxUrl, previews, activePreviewIndex]);

  useEffect(() => {
    if (!activeBaseUrl) {
      setIframeUrl((prev) => (prev ? undefined : prev));
      return;
    }

    let targetPath = displayPath.trim() || '/';
    if (!targetPath.startsWith('/')) targetPath = `/${targetPath}`;
    const nextUrl = `${activeBaseUrl}${targetPath}`;
    setIframeUrl((prev) => (prev === nextUrl ? prev : nextUrl));
  }, [activeBaseUrl, displayPath]);

  useEffect(() => {
    if (activeBaseUrl && activeBaseUrl !== storePreviewUrl) {
      setPreviewUrl(activeBaseUrl);
    }
  }, [activeBaseUrl, setPreviewUrl, storePreviewUrl]);

  useEffect(() => {
    if (storePreviewUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [storePreviewUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current || previewDevice.name === 'Responsive') {
      setPreviewScale(1);
      return;
    }

    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 48;
      const containerHeight = containerRef.current.clientHeight - 48;
      const targetWidth = previewIsLandscape ? previewDevice.height : previewDevice.width;
      const targetHeight = previewIsLandscape ? previewDevice.width : previewDevice.height;
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
    if (iframeRef.current && iframeUrl) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = `${iframeUrl}?t=${Date.now()}`;
    }
  }, [iframeUrl]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        handleRefresh();
      }, 2000);
    }
  }, [retryCount, handleRefresh]);

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
      transition: 'all 0.3s ease-in-out',
    };
  };

  const openInNewTab = () => {
    if (!activePreview?.baseUrl) return;
    const match = activePreview.baseUrl.match(/^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/);
    const targetUrl = match ? `/webcontainer/preview/${match[1]}` : activePreview.baseUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  if (!activePreview?.baseUrl) {
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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-slate-900/60">
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
          title="Refresh preview"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white ${
            isSelectionMode ? 'bg-slate-800 text-white' : ''
          }`}
          title={isSelectionMode ? 'Exit selection' : 'Select screenshot area'}
        >
          <Scan className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const next = !isInspectorMode;
            setIsInspectorMode(next);
            if (next) setShowInspectorPanel(true);
          }}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white ${
            isInspectorMode ? 'bg-slate-800 text-white' : ''
          }`}
          title={isInspectorMode ? 'Disable inspector' : 'Enable inspector'}
        >
          <Ruler className="w-4 h-4" />
        </button>

        <PortDropdown
          activePreviewIndex={activePreviewIndex}
          setActivePreviewIndex={setActivePreviewIndex}
          isDropdownOpen={isPortDropdownOpen}
          setIsDropdownOpen={setIsPortDropdownOpen}
          setHasSelectedPreview={(value) => (hasSelectedPreview.current = value)}
          previews={previews}
        />

        <div className="flex-1 flex items-center gap-1 bg-slate-900/50 border border-slate-700/50 rounded-full px-2 py-1 text-xs">
          <span className="i-ph:globe text-sm text-slate-400" />
          <input
            title="URL Path"
            className="w-full bg-transparent outline-none text-slate-300"
            type="text"
            value={displayPath}
            onChange={(event) => setDisplayPath(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && activePreview) {
                let targetPath = displayPath.trim();
                if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;
                setDisplayPath(targetPath);
                setIframeUrl(`${activePreview.baseUrl}${targetPath}`);
              }
            }}
          />
        </div>

        <button
          onClick={() => setPreviewDevice(DEVICES[0])}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white ${
            previewDevice.name === 'Responsive' ? 'bg-slate-800 text-white' : ''
          }`}
          title="Responsive"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPreviewDevice(DEVICES.find((d) => d.type === 'tablet') || DEVICES[0])}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white ${
            previewDevice.type === 'tablet' ? 'bg-slate-800 text-white' : ''
          }`}
          title="Tablet"
        >
          <Tablet className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPreviewDevice(DEVICES.find((d) => d.type === 'mobile') || DEVICES[0])}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white ${
            previewDevice.type === 'mobile' ? 'bg-slate-800 text-white' : ''
          }`}
          title="Mobile"
        >
          <Smartphone className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPreviewIsLandscape(!previewIsLandscape)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
          title="Toggle landscape"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPreviewShowFrame(!previewShowFrame)}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white ${
            previewShowFrame ? 'bg-slate-800 text-white' : ''
          }`}
          title="Toggle device frame"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowQr(true)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
          title="Expo QR"
        >
          <QrCode className="w-4 h-4" />
        </button>
        <button
          onClick={openInNewTab}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#1e1e1e]">
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

        <div style={getContainerStyle()} className={`relative ${previewDevice.name !== 'Responsive' ? 'shadow-2xl' : ''}`}>
          {previewDevice.hasFrame && previewShowFrame && (
            <div className="absolute inset-0 pointer-events-none z-20 border-[12px] border-[#2a2a2e] rounded-[2.5rem] shadow-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#2a2a2e] rounded-b-xl" />
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className={`w-full h-full bg-white ${
              previewDevice.hasFrame && previewShowFrame ? 'rounded-[1.8rem]' : 'rounded-lg'
            } ${previewDevice.name === 'Responsive' ? '' : 'border border-slate-700/50'}`}
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            onLoad={handleLoad}
            onError={handleError}
          />

          <ScreenshotSelector
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            containerRef={containerRef}
          />
        </div>

        <Inspector
          isActive={isInspectorMode}
          iframeRef={iframeRef}
          onElementSelect={(element) => {
            setSelectedElement(element);
            setShowInspectorPanel(true);
          }}
        />

        <InspectorPanel
          selectedElement={selectedElement}
          isVisible={showInspectorPanel}
          onClose={() => setShowInspectorPanel(false)}
        />
      </div>

      <ExpoQrModal open={showQr} onClose={() => setShowQr(false)} />
    </div>
  );
}

export default Preview;
