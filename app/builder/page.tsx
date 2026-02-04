'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Wand2,
  Settings,
  Plus,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Menu,
  X,
  AlertTriangle,
  Zap
} from 'lucide-react';

// Components
import ChatMessages from '@/components/builder/ChatMessages';
import ChatInput from '@/components/builder/ChatInput';
import ModelSelector from '@/components/builder/ModelSelector';
import Workbench from '@/components/builder/Workbench';

// Stores
import { useChatStore, PROVIDERS } from '@/lib/stores/chat';
import { useWorkbenchStore } from '@/lib/stores/workbench';

// WebContainer
import { isWebContainerSupported } from '@/lib/webcontainer';

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Chat Store
  const {
    messages,
    addMessage,
    updateLastMessage,
    setInput,
    isLoading,
    setIsLoading,
    isStreaming,
    setIsStreaming,
    currentModel,
    currentProvider,
  } = useChatStore();

  // Workbench Store
  const {
    showChat,
    setShowChat,
    showWorkbench,
    setShowWorkbench,
    webcontainerReady,
    webcontainerError,
    initWebContainer,
    parseMessage,
    previews,
    files,
    reset: resetWorkbench,
    setIsStreaming: setWorkbenchStreaming,
    stopGeneration,
  } = useWorkbenchStore();

  // Local State
  const [status, setStatus] = useState<'idle' | 'booting' | 'ready' | 'generating' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [webcontainerSupported, setWebcontainerSupported] = useState(true);
  const messageIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Chat panel resize state
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle chat panel resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const newWidth = e.clientX;
      setChatWidth(Math.max(280, Math.min(600, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Check WebContainer support and initialize
  useEffect(() => {
    const supported = isWebContainerSupported();
    setWebcontainerSupported(supported);

    if (!supported) {
      setStatus('error');
      setStatusMessage('WebContainer requires SharedArrayBuffer. Please ensure your browser supports it.');
      addMessage({
        role: 'system',
        content: '⚠️ WebContainer is not supported in this browser. The live preview feature requires SharedArrayBuffer support. Please try using Chrome or Edge with the correct headers.'
      });
      return;
    }

    // Initialize WebContainer
    initializeWebContainer();
  }, []);

  // Check for URL param
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setInput(urlParam);
    }
  }, [searchParams, setInput]);

  const initializeWebContainer = async () => {
    setStatus('booting');
    setStatusMessage('Initializing WebContainer...');

    try {
      const wc = await initWebContainer();

      if (wc) {
        setStatus('ready');
        setStatusMessage('WebContainer ready');
        
        // Initial message removed for cleaner UI
      } else {
        throw new Error(webcontainerError || 'Failed to initialize WebContainer');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus('error');
      setStatusMessage(`Error: ${errorMessage}`);

      addMessage({
        role: 'system',
        content: `⚠️ Failed to initialize WebContainer: ${errorMessage}\n\nYou can still chat, but live preview won't be available.`
      });
    }
  };

  // Check if input is a URL
  const isUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(text.trim());
  };

  // Handle message send
  const handleSend = useCallback(async (message: string, files?: File[]) => {
    if (!message.trim()) return;

    const messageId = `msg-${++messageIdRef.current}`;

    // Add user message
    addMessage({ role: 'user', content: message });
    setIsLoading(true);
    setIsStreaming(true);
    setWorkbenchStreaming(true);  // Sync workbench streaming state
    setShowWorkbench(true);
    setStatus('generating');
    setStatusMessage('Generating code...');

    try {
      let prompt = message;

      // If it's a URL, scrape it first
      if (isUrl(message)) {
        setStatusMessage('Analyzing website...');

        try {
          const scrapeResponse = await fetch('/api/scrape-url-enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: message })
          });

          const scrapeData = await scrapeResponse.json();

          if (scrapeData.success) {
            const scrapedContent = scrapeData.markdown || scrapeData.content || '';
            prompt = `Clone this website and recreate it. Generate all the code wrapped in <boltArtifact> tags.

Website URL: ${message}
Website Title: ${scrapeData.title || 'Unknown'}

Website Content:
${scrapedContent.substring(0, 15000)}

Create a complete React application with Tailwind CSS that replicates this website. Use the boltArtifact format:

<boltArtifact id="cloned-website" title="Cloned Website">
  <boltAction type="file" filePath="package.json">
  {
    "name": "cloned-website",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    },
    "devDependencies": {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@vitejs/plugin-react": "^4.2.0",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.32",
      "tailwindcss": "^3.4.0",
      "vite": "^5.0.0"
    }
  }
  </boltAction>
  <!-- Add more files as needed -->
</boltArtifact>`;
          }
        } catch (scrapeError) {
          console.error('Scrape error:', scrapeError);
          // Continue with original prompt
        }
      } else {
        // Wrap the prompt to get boltArtifact formatted output
        prompt = `${message}

Please generate the code using the boltArtifact format. Wrap your code in:
<boltArtifact id="generated-app" title="Generated Application">
  <boltAction type="file" filePath="filename.ext">
  file content here
  </boltAction>
  <boltAction type="shell">
  npm install
  </boltAction>
  <boltAction type="start">
  npm run dev
  </boltAction>
</boltArtifact>

Create a complete, working application with all necessary files.`;
      }

      // Add assistant message placeholder
      addMessage({
        role: 'assistant',
        content: '',
        metadata: { streaming: true, model: currentModel, provider: currentProvider }
      });

      setStatusMessage('AI is generating code...');

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/builder-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          prompt,
          model: currentModel,
          context: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        // Parse the message to extract and execute actions
        const parsedContent = parseMessage(messageId, fullContent);
        
        // Update the assistant message
        updateLastMessage(parsedContent);
      }

      setStatus('ready');
      setStatusMessage('Generation complete');

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';

      addMessage({
        role: 'system',
        content: `⚠️ Error: ${errorMessage}`
      });

      setStatus('error');
      setStatusMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setWorkbenchStreaming(false);  // Sync workbench streaming state
      abortControllerRef.current = null;
    }
  }, [currentModel, currentProvider, messages, addMessage, updateLastMessage, setIsLoading, setIsStreaming, setShowWorkbench, parseMessage, setWorkbenchStreaming]);

  // Handle stop generation
  const handleStop = useCallback(() => {
    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop workbench actions
    stopGeneration();

    setIsLoading(false);
    setIsStreaming(false);
    setWorkbenchStreaming(false);  // Sync workbench streaming state
    setStatus('ready');
    setStatusMessage('Generation stopped');
  }, [setIsLoading, setIsStreaming, setWorkbenchStreaming, stopGeneration]);

  // Handle download
  const handleDownload = useCallback(async () => {
    // Implementation for downloading project as ZIP
    const JSZip = (await import('jszip')).default;
    const FileSaver = (await import('file-saver')).default;
    
    const zip = new JSZip();
    
    Object.entries(files).forEach(([path, file]) => {
      if (file?.type === 'file') {
        const relativePath = path.replace('/home/project/', '');
        zip.file(relativePath, file.content);
      }
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(content, 'project.zip');
  }, [files]);

  // Handle refresh preview
  const handleRefreshPreview = useCallback(() => {
    // Force refresh by updating preview URL
    console.log('Refreshing preview...');
  }, []);

  // Get status indicator
  const getStatusIndicator = () => {
    switch (status) {
      case 'booting':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Initializing...</span>
          </div>
        );
      case 'generating':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm">{statusMessage}</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Ready</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm truncate max-w-[200px]">{statusMessage}</span>
          </div>
        );
      default:
        return null;
    }
  };

  // WebContainer not supported warning
  if (!webcontainerSupported) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-md text-center p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Browser Not Supported</h1>
          <p className="text-slate-400 mb-6">
            The AI Builder requires WebContainer which needs SharedArrayBuffer support. 
            This is typically available in Chrome or Edge with the correct security headers.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 bg-slate-950 border-b border-slate-800 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-white hidden sm:inline">Website Builder</span>
          </div>
        </div>

        {/* Center - Status */}
        <div className="hidden md:flex items-center">
          {getStatusIndicator()}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="hidden sm:block">
            <ModelSelector compact />
          </div>

          {/* New Chat */}
          <button
            onClick={() => {
              useChatStore.getState().reset();
              resetWorkbench();
              initializeWebContainer();
            }}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Download project"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors md:hidden"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-800 border-b border-slate-700/50 px-4 py-3"
          >
            <div className="flex flex-col gap-3">
              <ModelSelector />
              <div className="flex items-center gap-2 text-sm">
                {getStatusIndicator()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 overflow-hidden flex">
        {/* Chat Panel - Desktop */}
        {showChat && (
          <>
            <div 
              className="hidden md:flex flex-col bg-slate-900/50 border-r border-slate-700/50 shrink-0 overflow-hidden"
              style={{ width: `${chatWidth}px` }}
            >
              <ChatMessages />
              <ChatInput
                onSend={handleSend}
                onStop={handleStop}
                disabled={status === 'booting'}
              />
            </div>

            {/* Resize Handle */}
            <div 
              className={`hidden md:block w-1.5 shrink-0 cursor-col-resize transition-colors ${
                isResizing ? 'bg-orange-500' : 'bg-slate-800 hover:bg-orange-500'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
          </>
        )}

        {/* Workbench Panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <Workbench
            sandboxUrl={previews[0]?.url}
            isStreaming={isStreaming}
            onDownload={handleDownload}
            onRefresh={handleRefreshPreview}
          />
        </div>

        {/* Mobile Chat (Full Screen Overlay) */}
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40">
          <div className="bg-slate-900 border-t border-slate-700/50 max-h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <ChatMessages />
            </div>
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              disabled={status === 'booting'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading AI Builder...</p>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
