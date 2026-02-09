'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Wand2,
  Plus,
  Download,
  Rocket,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Menu,
  X,
  AlertTriangle,
  Zap,
  PanelLeft
} from 'lucide-react';

// Components
import ChatMessages from '@/components/builder/ChatMessages';
import ChatInput from '@/components/builder/ChatInput';
import ChatHistory from '@/components/builder/ChatHistory';
import ModelSelector from '@/components/builder/ModelSelector';
import Workbench from '@/components/builder/Workbench';
import DeployModal from '@/components/builder/DeployModal';
import BuilderOnboarding from '@/components/builder/BuilderOnboarding';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { toast } from 'sonner';

// Stores
import { useChatStore, PROVIDERS } from '@/lib/stores/chat';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import { webcontainer } from '@/lib/webcontainer';
import { path as pathUtils } from '@/utils/path';
import { WORK_DIR } from '@/utils/constants';

// WebContainer
import { isWebContainerSupported } from '@/lib/webcontainer';
import { useAuth } from '@/contexts/auth-context';

function BuilderContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParamsString = searchParams.toString();
  const chatIdParam = searchParams.get('chatId');
  const hasLoadedFromUrl = useRef(false);

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
    initialize,
    chatId,
    loadChat,
    error,
    setError,
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
    addFile,
    clearProject,
    actionAlert,
    clearActionAlert,
  } = useWorkbenchStore();

  // Local State
  const [status, setStatus] = useState<'idle' | 'booting' | 'ready' | 'generating' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [webcontainerSupported, setWebcontainerSupported] = useState(true);
  const [webcontainerDetails, setWebcontainerDetails] = useState({
    isSecureContext: true,
    isCrossOriginIsolated: true,
    hasSharedArrayBuffer: true,
  });
  const messageIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAutoFixSignature = useRef<string>('');
  const lastAutoFixTime = useRef<number>(0);
  const [showBuilderOnboarding, setShowBuilderOnboarding] = useState(false);
  
  // Chat panel resize state
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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

  // Builder onboarding (first time only - fetch from database)
  useEffect(() => {
    if (!user) return;
    
    // Check database for onboarding status
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/builder-onboarding');
        if (response.ok) {
          const data = await response.json();
          if (!data.builderOnboardingCompleted) {
            setShowBuilderOnboarding(true);
          }
        } else {
          // API error - log details for debugging
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch onboarding status:', response.status, errorData);
          // If unauthorized, skip - user not logged in
          // For other errors, default to not showing onboarding
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    
    checkOnboardingStatus();
  }, [user]);

  // Check WebContainer support and initialize
  useEffect(() => {
    initialize();
    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext === true : false;
    const isCrossOriginIsolated = typeof window !== 'undefined' ? (window as any).crossOriginIsolated === true : false;
    const hasSharedArrayBuffer = typeof window !== 'undefined' ? (window as any).SharedArrayBuffer !== undefined : false;
    setWebcontainerDetails({
      isSecureContext,
      isCrossOriginIsolated,
      hasSharedArrayBuffer,
    });
    const supported = isWebContainerSupported();
    setWebcontainerSupported(supported);

    if (!supported) {
      setStatus('error');
      setStatusMessage('WebContainer requires cross-origin isolation and SharedArrayBuffer support.');
      addMessage({
        role: 'system',
        content: 'Warning: WebContainer is not supported in this browser. The live preview feature requires cross-origin isolation and SharedArrayBuffer support.'
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

  // Show database errors as toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  // Load chat by id from URL if present
  useEffect(() => {
    if (!chatIdParam) return;
    if (chatIdParam === chatId) return;
    if (hasLoadedFromUrl.current && chatId === chatIdParam) return;

    hasLoadedFromUrl.current = true;
    loadChat(chatIdParam);
  }, [chatIdParam, chatId, loadChat]);

  // Keep chat id in URL for sharing/restoring
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    if (chatId) {
      if (params.get('chatId') !== chatId) {
        params.set('chatId', chatId);
        const query = params.toString();
        router.replace(query ? `/builder?${query}` : '/builder', { scroll: false });
      }
      return;
    }

    if (params.has('chatId')) {
      params.delete('chatId');
      const query = params.toString();
      router.replace(query ? `/builder?${query}` : '/builder', { scroll: false });
    }
  }, [chatId, router, searchParamsString]);

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
        content: `Warning: Failed to initialize WebContainer: ${errorMessage}\n\nYou can still chat, but live preview won't be available.`
      });
    }
  };

  // Check if input is a URL
  const isUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(text.trim());
  };


  const buildProjectContext = useCallback(() => {
    const fileEntries = Object.entries(files || {}).filter(([, file]) => file?.type === 'file');
    if (fileEntries.length === 0) return '';

    const filePaths = fileEntries.map(([path]) => path.replace('/home/project/', '')).sort();

    const keyFiles = [
      'package.json',
      'index.html',
      'vite.config.ts',
      'vite.config.js',
      'src/App.tsx',
      'src/main.tsx',
      'src/index.css',
      'src/App.jsx',
      'src/main.jsx',
    ];

    const keyFileContents = keyFiles
      .map((relativePath) => {
        const fullPath = `/home/project/${relativePath}`;
        const file = files[fullPath];
        if (!file || file.type !== 'file' || file.isBinary) return null;
        const content = (file.content || '').slice(0, 4000);
        if (!content.trim()) return null;
        return `File: ${relativePath}\n${content}`;
      })
      .filter(Boolean)
      .join('\n\n');

    const fileList = filePaths.slice(0, 200).join('\n');

    return `Existing Project Context:\n- Files (${Math.min(filePaths.length, 200)} of ${filePaths.length}):\n${fileList}\n\n${keyFileContents ? `Key Files:\n${keyFileContents}` : ''}`.trim();
  }, [files]);

  // Handle message send
  const handleSend = useCallback(async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    const messageId = `msg-${++messageIdRef.current}`;

    // Upload attachments to Cloudinary (user-specific storage)
    const attachments: Array<{
      type: 'image' | 'video' | 'audio' | 'document';
      url: string;
      publicId?: string;
      name?: string;
      mimeType?: string;
    }> = [];

    if (files && files.length > 0) {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-file', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data?.file) {
              return null;
            }

            return {
              type: data.file.type,
              url: data.file.url,
              publicId: data.file.publicId,
              name: data.file.filename,
              mimeType: data.file.mimeType,
            } as (typeof attachments)[number];
          } catch (error) {
            console.error('Attachment upload failed:', error);
            return null;
          }
        }),
      );

      uploadResults.forEach((item) => {
        if (item) attachments.push(item);
      });
    }

    // Add user message with attached files metadata if needed
    addMessage({
      role: 'user',
      content: message + (files?.length ? `\n[Attached ${files.length} files]` : ''),
      attachments,
    });
    setIsLoading(true);
    setIsStreaming(true);
    setWorkbenchStreaming(true);  // Sync workbench streaming state
    setShowWorkbench(true);
    setStatus('generating');
    setStatusMessage('Generating code...');

    try {
      let prompt = message;
      const projectContext = buildProjectContext();

      // Read attached files
      // Read attached files
      if (files && files.length > 0) {
        const fileContents = await Promise.all(files.map(async (file) => {
          // Handle images as assets
          if (file.type.startsWith('image/')) {
            try {
              const buffer = await file.arrayBuffer();
              const uint8Array = new Uint8Array(buffer);
              const assetPath = `public/assets/${file.name}`;
              
              // Upload to WebContainer
              await addFile(assetPath, uint8Array, 'file');
              
              return `[Uploaded Asset: ${file.name} available at ${assetPath}]`;
            } catch (e) {
              console.error('Asset upload error:', e);
              return `[Error uploading asset: ${file.name}]`;
            }
          }
           
          // Handle text/code files
          try {
            const text = await file.text();
            return `File: ${file.name}\n\`\`\`\n${text}\n\`\`\``;
          } catch (e) {
            return `File: ${file.name} (Error reading content)`;
          }
        }));
        prompt += `\n\nAttached Files:\n${fileContents.join('\n\n')}`;
      }

      // If it's a URL, scrape it first

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
            prompt = `Clone this website and recreate it. Generate all the code wrapped in <boltArtifact> tags.\n\nWebsite URL: ${message}\nWebsite Title: ${scrapeData.title || 'Unknown'}\n\nWebsite Content:\n${scrapedContent.substring(0, 15000)}\n\nCreate a complete React application with Tailwind CSS that replicates this website. Use the boltArtifact format:\n\n<boltArtifact id="cloned-website" title="Cloned Website">\n  <boltAction type="file" filePath="package.json">\n  {\n    \"name\": \"cloned-website\",\n    \"private\": true,\n    \"version\": \"0.0.0\",\n    \"type\": \"module\",\n    \"scripts\": {\n      \"dev\": \"vite\",\n      \"build\": \"vite build\",\n      \"preview\": \"vite preview\"\n    },\n    \"dependencies\": {\n      \"react\": \"^18.2.0\",\n      \"react-dom\": \"^18.2.0\"\n    },\n    \"devDependencies\": {\n      \"@types/react\": \"^18.2.0\",\n      \"@types/react-dom\": \"^18.2.0\",\n      \"@vitejs/plugin-react\": \"^4.2.0\",\n      \"autoprefixer\": \"^10.4.16\",\n      \"postcss\": \"^8.4.32\",\n      \"tailwindcss\": \"^3.4.0\",\n      \"vite\": \"^5.0.0\"\n    }\n  }\n  </boltAction>\n  <!-- Add more files as needed -->\n</boltArtifact>`;
          }
        } catch (scrapeError) {
          console.error('Scrape error:', scrapeError);
          // Continue with original prompt
        }
      } else {
        // Wrap the prompt to get boltArtifact formatted output
        const existingProjectInstructions = projectContext
          ? `You are modifying an existing project. Do NOT rewrite everything.\n- Only change files necessary to implement the request.\n- Do NOT delete or recreate unrelated files.\n- Provide full content for any file you update.\n- Only run "npm install" if dependencies changed.\n- Only run "npm run dev" if explicitly requested.\n- Ensure layouts are fully responsive across mobile, tablet, and desktop.\n`
          : '';

        prompt = `${message}\n\n${projectContext ? `${projectContext}\n\n` : ''}${existingProjectInstructions}\nPlease generate the code using the boltArtifact format. Wrap your code in:\n<boltArtifact id="generated-app" title="Generated Application">\n  <boltAction type="file" filePath="filename.ext">\n  file content here\n  </boltAction>\n  <boltAction type="shell">\n  npm install\n  </boltAction>\n  <boltAction type="start">\n  npm run dev\n  </boltAction>\n</boltArtifact>\n\n${projectContext ? 'Only include files that need to be created or updated.' : 'Create a complete, working application with all necessary files.'}`;
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
      let assistantContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        // Parse the message to extract and execute actions
        const parsedDelta = parseMessage(messageId, fullContent);
        assistantContent += parsedDelta;
        
        // Update the assistant message with accumulated content
        updateLastMessage(assistantContent);
      }

      setStatus('ready');
      setStatusMessage('Generation complete');

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      const isAbort =
        (error instanceof DOMException && error.name === 'AbortError') ||
        /aborted|abort/i.test(errorMessage);

      if (isAbort) {
        const lastAssistant = [...useChatStore.getState().messages].reverse().find((m) => m.role === 'assistant');
        if (lastAssistant && !lastAssistant.content?.trim()) {
          updateLastMessage('Generation stopped.');
        }
        setStatus('ready');
        setStatusMessage('Generation stopped');
        return;
      }

      // Fix: Update the empty "Generating..." message with the error
      updateLastMessage(`Warning: Generation failed: ${errorMessage}`);

      toast.error(errorMessage);

      addMessage({
        role: 'system',
        content: `Warning: Error: ${errorMessage}`
      });

      setStatus('error');
      setStatusMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setWorkbenchStreaming(false);  // Sync workbench streaming state
      abortControllerRef.current = null;
      
      // Ensure the last message is marked as not streaming
      useChatStore.getState().updateLastMessage(undefined, { streaming: false });
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
    const JSZip = (await import('jszip')).default;
    const FileSaver = (await import('file-saver')).default;
    const zip = new JSZip();

    const wc = await webcontainer;
    const workdir = wc.workdir || WORK_DIR;

    const entries = Object.entries(files || {}).filter(([, file]) => file?.type === 'file');

    for (const [filePath, file] of entries) {
      if (!file || file.type !== 'file') continue;

      // Resolve relative path for zip
      let relativePath = pathUtils.relative(workdir, filePath);
      if (!relativePath || relativePath.startsWith('..')) {
        relativePath = filePath.replace(`${WORK_DIR}/`, '');
      }

      // Skip node_modules and empty paths
      if (!relativePath || relativePath.includes('node_modules/')) continue;

      const normalizedPath = relativePath.replace(/^\//, '');

      try {
        const content = await wc.fs.readFile(normalizedPath);
        if (file.isBinary) {
          zip.file(normalizedPath, content, { binary: true });
        } else {
          zip.file(normalizedPath, new TextDecoder().decode(content));
        }
      } catch {
        // Fallback to stored content if direct read fails
        if (!file.isBinary) {
          zip.file(normalizedPath, file.content ?? '');
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(content, `project-${new Date().toISOString().slice(0, 10)}.zip`);
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
          <p className="text-slate-400 mb-4">
            The AI Builder needs cross-origin isolation and SharedArrayBuffer support.
          </p>
          <ul className="text-left text-sm text-slate-400 space-y-2 mb-6">
            <li>- Use HTTPS (secure context) or localhost.</li>
            <li>- Ensure COOP/COEP headers are present for the builder route.</li>
            <li>- In Brave private mode, disable Shields for this site or open a normal window.</li>
          </ul>
          <div className="text-left text-xs text-slate-500 mb-6 space-y-1">
            <div>Secure context: {webcontainerDetails.isSecureContext ? 'yes' : 'no'}</div>
            <div>Cross-origin isolated: {webcontainerDetails.isCrossOriginIsolated ? 'yes' : 'no'}</div>
            <div>SharedArrayBuffer: {webcontainerDetails.hasSharedArrayBuffer ? 'yes' : 'no'}</div>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back Home
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors ml-3"
          >
            Retry
          </button>
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
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle History"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
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



          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Download project"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Deploy */}
          <button
            onClick={() => setShowDeploy(true)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Deploy project"
          >
            <Rocket className="w-5 h-5" />
          </button>

          {/* Export Chat */}
          <button
            onClick={() => {
              const chatData = JSON.stringify(messages, null, 2);
              const blob = new Blob([chatData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Export chat"
          >
            <FileDown className="w-5 h-5" />
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
        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-900 border-r border-slate-700/50 overflow-hidden hidden md:block"
            >
              <div className="w-[260px] h-full">
                <ChatHistory onNewChat={async () => {
                  // Stop any in-flight generation first
                  handleStop();

                  // Clear chatId from URL to avoid re-loading previous chat
                  router.replace('/builder', { scroll: false });
                  hasLoadedFromUrl.current = false;

                  // Save current chat only if it has messages
                  const currentMessages = useChatStore.getState().messages;
                  if (currentMessages.length > 0) {
                    await useChatStore.getState().saveCurrentChat();
                  }
                   
                  // Reset everything for new chat
                  useChatStore.getState().reset();
                  resetWorkbench();
                   
                  // Clear WebContainer project files and previews
                  await clearProject();

                  // Ensure UI states are clean
                  setStatus('ready');
                  setStatusMessage('Ready');
                   
                  // Close mobile menu if open
                  setShowMobileMenu(false);
                }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Panel - Desktop */}
        {showChat && (
          <>
            <div 
              className="hidden md:flex flex-col bg-slate-900/50 border-r border-slate-700/50 shrink-0 overflow-hidden min-h-0"
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

      <DeployModal open={showDeploy} onClose={() => setShowDeploy(false)} />
      <Toaster position="top-right" />

      {showBuilderOnboarding && (
        <BuilderOnboarding
          onComplete={async (prefillPrompt, promptText) => {
            if (!user) return;
            
            // Save to database
            try {
              await fetch('/api/builder-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: true }),
              });
            } catch (error) {
              console.error('Failed to save onboarding status:', error);
            }
            
            setShowBuilderOnboarding(false);
            
            if (prefillPrompt && promptText) {
              // Auto-trigger the build by calling handleSend directly
              handleSend(promptText);
            }
          }}
        />
      )}
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
      <ProtectedRoute>
        <BuilderContent />
      </ProtectedRoute>
    </Suspense>
  );
}
