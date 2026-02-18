'use client';

import { ThemeToggle } from '@/components/theme-toggle';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AuthModal } from '@/components/auth-modal';
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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Stores
import { useChatStore, PROVIDERS } from '@/lib/stores/chat';
import { useWorkbenchStore, workbenchStore } from '@/lib/stores/workbench';
import { webcontainer } from '@/lib/webcontainer';
import { path as pathUtils } from '@/utils/path';
import { WORK_DIR } from '@/utils/constants';

// WebContainer

function BuilderContent() {
  const { user, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [coepChecked, setCoepChecked] = useState(false);
  const [coepReady, setCoepReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // WebContainer requires a crossOriginIsolated document. Client-side navigation
    // won't update COOP/COEP headers, so force a one-time reload on /builder.
    if (!window.crossOriginIsolated) {
      const reloadKey = 'builder-coep-reload';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        return;
      }

      toast.error('Terminal requires a full page reload to enable WebContainer.');
    } else {
      sessionStorage.removeItem('builder-coep-reload');
    }

    setCoepReady(window.crossOriginIsolated === true);
    setCoepChecked(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    } else {
      setAuthModalOpen(false);
    }
  }, [user, authLoading]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParamsString = searchParams.toString();
  const chatIdParam = searchParams.get('chatId');
  const hasLoadedFromUrl = useRef(false);
  const isCreatingNewChatRef = useRef(false); // Guard flag for new chat creation

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
  const messageIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAutoFixSignature = useRef<string>('');
  const lastAutoFixTime = useRef<number>(0);
  
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

  // Initialize WebContainer
  useEffect(() => {
    // Only initialize if we have a user and COEP check completed
    if (user && !authLoading && coepChecked) {
      console.log('User authenticated, initializing chat store');
      initialize();

      // Initialize WebContainer
      if (coepReady) {
        initializeWebContainer();
      } else {
        setStatus('error');
        setStatusMessage('WebContainer requires a full reload (COOP/COEP).');
        addMessage({
          role: 'system',
          content:
            'Warning: WebContainer is unavailable because the page is not crossOriginIsolated. Please reload this page to enable the terminal and preview.',
        });
      }
    }
  }, [user, authLoading, coepChecked, coepReady]);

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
      if (error === 'Please sign in to continue.') {
         // Optionally handle sign in redirect here if needed, 
         // though AuthModal should handle it.
      }
      setError(null);
    }
  }, [error, setError]);

  // Load chat by id from URL if present
  useEffect(() => {
    if (!chatIdParam || authLoading || !user) return;
    if (chatIdParam === chatId) return;
    if (isCreatingNewChatRef.current) return; // Skip during new chat creation
    
    console.log('Loading chat from URL:', chatIdParam);
    loadChat(chatIdParam);
  }, [chatIdParam, chatId, loadChat, authLoading, user]);

  // Keep chat id in URL for sharing/restoring
  useEffect(() => {
    if (!user) return; // Don't update URL if not logged in
    const params = new URLSearchParams(searchParamsString);
    const urlChatId = params.get('chatId');

    // URL is the source of truth when present. Only write to the URL when it's missing.
    if (chatId) {
      if (!urlChatId) {
        params.set('chatId', chatId);
        const query = params.toString();
        router.replace(query ? `/builder?${query}` : '/builder', { scroll: false });
      }
      return;
    }

    if (urlChatId) {
      params.delete('chatId');
      const query = params.toString();
      router.replace(query ? `/builder?${query}` : '/builder', { scroll: false });
    }
  }, [chatId, router, searchParamsString]);

  const handleSelectChat = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParamsString);
      if (params.get('chatId') === id) return;
      params.set('chatId', id);
      const query = params.toString();
      router.push(query ? `/builder?${query}` : '/builder');
    },
    [router, searchParamsString],
  );

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

      // Save the raw AI response (with boltArtifact tags) in metadata
      // so restored chats can reconstruct the artifact file list display
      updateLastMessage(undefined, { rawContent: fullContent });

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

      // Clean up generating status if stuck
      setStatus((prev) => prev === 'generating' ? 'ready' : prev);
      if (status === 'generating') setStatusMessage('Generation complete');
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

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle History"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white hidden sm:inline">Website Builder</span>
          </div>
        </div>

        {/* Center - Status */}
        <div className="hidden md:flex items-center">
          {getStatusIndicator()}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {/* Model Selector */}
          <div className="hidden sm:block">
            <ModelSelector compact />
          </div>



          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Download project"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Deploy */}
          <button
            onClick={() => setShowDeploy(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Export chat"
          >
            <FileDown className="w-5 h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors md:hidden"
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
            className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/50 px-4 py-3"
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
              className="bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 overflow-hidden hidden md:block"
            >
              <div className="w-[260px] h-full">
                <ChatHistory onSelectChat={handleSelectChat} onNewChat={async () => {
                   // Set guard flag to prevent loadChat effect from interfering
                   isCreatingNewChatRef.current = true;
                   
                   // stop any running generation
                   stopGeneration();
                   
                   // Reset terminal content immediately
                   workbenchStore.terminalStore.boltTerminal.terminal?.reset();

                   // Reset stores (this clears chatId to empty string)
                   useChatStore.getState().reset();
                   resetWorkbench(); // Resets UI state
                   await clearProject(); // Clears files and file store

                   // Clear URL immediately (use replace to avoid back button issues)
                   router.replace('/builder');
                   
                   // Re-init webcontainer
                   initializeWebContainer();
                   setShowMobileMenu(false);

                   // Clear guard flag after navigation settles
                   setTimeout(() => {
                     isCreatingNewChatRef.current = false;
                   }, 500);
                }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Panel - Desktop */}
        {showChat && (
          <>
            <div 
              className="hidden md:flex flex-col bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700/50 shrink-0 overflow-hidden min-h-0"
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
                isResizing ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800 hover:bg-orange-500'
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
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50 max-h-[60vh] flex flex-col">
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

      <AuthModal isOpen={authModalOpen} onClose={() => router.push('/')} />
      <DeployModal open={showDeploy} onClose={() => setShowDeploy(false)} />
      <Toaster position="top-right" />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading AI Builder...</p>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
