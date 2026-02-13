'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown,
  Code,
  Eye,
  RefreshCw,
  Wand2,
  Globe,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Settings,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// App configuration
const appConfig = {
  ai: {
    defaultModel: 'gemini-2.5-flash',
    availableModels: [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet',
      'claude-3-5-haiku',
      'llama-3.3-70b'
    ],
    modelNames: {
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku': 'Claude 3.5 Haiku',
      'llama-3.3-70b': 'Llama 3.3 70B'
    } as Record<string, string>
  }
};

interface SandboxData {
  sandboxId: string;
  url: string;
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system' | 'error';
  timestamp: Date;
  metadata?: {
    files?: string[];
    streaming?: boolean;
  };
}

interface GeneratedFile {
  path: string;
  content: string;
  type: string;
}

function GenerationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Core state
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Welcome to AI App Builder! I can help you create React applications. Enter a website URL to clone it, or describe what you want to build.',
      type: 'system',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  
  // Model selection
  const [selectedModel, setSelectedModel] = useState(() => {
    const modelParam = searchParams.get('model');
    return appConfig.ai.availableModels.includes(modelParam || '') 
      ? modelParam! 
      : appConfig.ai.defaultModel;
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [showSettings, setShowSettings] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [previewRetries, setPreviewRetries] = useState(0);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Initialize sandbox on mount
  useEffect(() => {
    const urlParam = searchParams.get('url');
    
    if (urlParam) {
      setInputValue(urlParam);
      // Auto-start generation if URL provided
      setTimeout(() => handleSubmit(urlParam), 500);
    }
    
    // Create sandbox on mount
    createSandbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Create sandbox
  const createSandbox = async () => {
    setLoading(true);
    addMessage('Creating sandbox environment...', 'system');
    
    try {
      const response = await fetch('/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSandboxData({
          sandboxId: data.sandboxId,
          url: data.url
        });
        addMessage(`Sandbox ready! ID: ${data.sandboxId}`, 'system');
      } else {
        addMessage(`Failed to create sandbox: ${data.error}`, 'error');
      }
    } catch (error) {
      addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Counter for unique message IDs
  const messageIdRef = useRef(0);
  
  // Add chat message
  const addMessage = (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => {
    messageIdRef.current += 1;
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${messageIdRef.current}`,
      content,
      type,
      timestamp: new Date(),
      metadata
    };
    setChatMessages(prev => [...prev, message]);
  };
  
  // Detect if input is a URL
  const isUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(text.trim());
  };
  
  // Handle form submission
  const handleSubmit = async (customInput?: string) => {
    const input = (customInput || inputValue).trim();
    if (!input || generating) return;
    
    setInputValue('');
    addMessage(input, 'user');
    setGenerating(true);
    setStreamedContent('');
    
    console.log('[Generation] Starting generation for:', input);
    
    try {
      let prompt = input;
      
      // If it's a URL, scrape it first
      if (isUrl(input)) {
        addMessage('Analyzing website...', 'system');
        console.log('[Generation] Detected URL, scraping:', input);
        
        try {
          const scrapeResponse = await fetch('/api/scrape-url-enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input })
          });
          
          const scrapeData = await scrapeResponse.json();
          console.log('[Generation] Scrape result:', scrapeData.success ? 'success' : 'failed');
          
          if (scrapeData.success) {
            const scrapedContent = scrapeData.markdown || scrapeData.content || '';
            prompt = `Clone this website and recreate it as a React application with Tailwind CSS. 

Website URL: ${input}
Website Title: ${scrapeData.title || 'Unknown'}

Website Content:
${scrapedContent.substring(0, 15000)}

Create a complete, production-ready React application that replicates this website's design, layout, and functionality.`;
          } else {
            addMessage('Could not scrape website, generating based on URL...', 'system');
          }
        } catch (scrapeError) {
          console.error('[Generation] Scrape error:', scrapeError);
          addMessage('Scraping failed, generating based on description...', 'system');
        }
      }
      
      // Generate code with AI
      addMessage('Generating code...', 'system');
      console.log('[Generation] Calling AI with model:', selectedModel);
      
      const response = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          context: generatedFiles.map(f => ({ path: f.path, content: f.content }))
        })
      });
      
      console.log('[Generation] API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Generation] API error:', errorText);
        throw new Error(`Failed to generate code: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let chunkCount = 0;
      
      console.log('[Generation] Starting stream read...');
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Generation] Stream complete. Total chunks:', chunkCount);
          break;
        }
        
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        
        // The text stream just returns raw text, not formatted data
        fullContent += chunk;
        setStreamedContent(fullContent);
        
        // Log every 10th chunk to avoid spam
        if (chunkCount % 10 === 0) {
          console.log(`[Generation] Chunk ${chunkCount}, content length: ${fullContent.length}`);
        }
      }
      
      console.log('[Generation] Stream finished. Total content length:', fullContent.length);
      
      // Parse and apply the generated code
      if (fullContent && fullContent.length > 0) {
        console.log('[Generation] Applying generated code...');
        addMessage(`Code generated! (${fullContent.length} characters)`, 'system');
        await applyGeneratedCode(fullContent);
      } else {
        console.warn('[Generation] No content received from stream');
        addMessage('No code was generated. Please try again.', 'error');
      }
      
    } catch (error) {
      console.error('[Generation] Error:', error);
      addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setGenerating(false);
      console.log('[Generation] Generation complete');
    }
  };
  
  // Apply generated code to sandbox
  const applyGeneratedCode = async (code: string) => {
    console.log('[Apply] Starting code application, code length:', code.length);
    
    if (!sandboxData) {
      console.warn('[Apply] No sandbox available');
      addMessage('No sandbox available. Creating one...', 'system');
      await createSandbox();
      return;
    }
    
    addMessage('Applying code to sandbox...', 'system');
    console.log('[Apply] Sending to sandbox:', sandboxData.sandboxId);
    
    try {
      const response = await fetch('/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: code,
          sandboxId: sandboxData.sandboxId
        })
      });
      
      console.log('[Apply] API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Apply] API error:', errorText);
        addMessage(`Failed to apply code: ${errorText}`, 'error');
        return;
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const appliedFiles: string[] = [];
      let chunkCount = 0;
      
      console.log('[Apply] Reading stream...');
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Apply] Stream complete. Chunks:', chunkCount);
          break;
        }
        
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('[Apply] Event:', data.type);
              
              if (data.type === 'file-complete' && data.success) {
                appliedFiles.push(data.path);
                console.log('[Apply] File applied:', data.path);
              } else if (data.type === 'complete') {
                const fileCount = data.filesGenerated?.length || appliedFiles.length;
                console.log('[Apply] Complete! Files:', fileCount);
                addMessage(`Successfully applied ${fileCount} files!`, 'system');
                
                // Refresh iframe
                setTimeout(() => {
                  if (iframeRef.current && sandboxData.url) {
                    console.log('[Apply] Refreshing iframe');
                    iframeRef.current.src = `${sandboxData.url}?t=${Date.now()}`;
                  }
                }, 2000);
              } else if (data.type === 'error') {
                console.error('[Apply] Error event:', data.message);
                addMessage(`Error: ${data.message}`, 'error');
              }
            } catch (parseError) {
              // Skip parse errors but log them
              if (line.trim()) {
                console.log('[Apply] Parse skip:', line.substring(0, 50));
              }
            }
          }
        }
      }
      
      // If no streaming events, still show success message for applied content
      if (appliedFiles.length === 0 && chunkCount > 0) {
        console.log('[Apply] No file events but stream completed');
        addMessage('Code processed! Check the preview.', 'system');
      }
      
      // Fetch updated files
      console.log('[Apply] Fetching sandbox files...');
      await fetchSandboxFiles();
      
    } catch (error) {
      console.error('[Apply] Error:', error);
      addMessage(`Failed to apply code: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };
  
  // Fetch sandbox files
  const fetchSandboxFiles = async () => {
    try {
      const response = await fetch('/api/get-sandbox-files');
      const data = await response.json();
      
      if (data.success && data.files) {
        const files: GeneratedFile[] = Object.entries(data.files).map(([path, content]) => ({
          path,
          content: content as string,
          type: getFileType(path)
        }));
        setGeneratedFiles(files);
      }
    } catch (error) {
      console.error('[fetchSandboxFiles] Error:', error);
    }
  };
  
  // Get file type from path
  const getFileType = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jsx': case 'tsx': return 'javascript';
      case 'js': case 'ts': return 'javascript';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'html': return 'html';
      default: return 'text';
    }
  };
  
  // Toggle folder expansion
  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };
  
  // Refresh sandbox
  const refreshSandbox = () => {
    if (iframeRef.current && sandboxData?.url) {
      iframeRef.current.src = `${sandboxData.url}?t=${Date.now()}`;
    }
  };
  
  // Build file tree
  const buildFileTree = () => {
    const tree: Record<string, string[]> = {};
    
    generatedFiles.forEach(file => {
      const parts = file.path.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      const fileName = parts[parts.length - 1];
      
      if (!tree[dir]) tree[dir] = [];
      tree[dir].push(fileName);
    });
    
    return tree;
  };
  
  const fileTree = buildFileTree();
  const selectedFileContent = generatedFiles.find(f => f.path === selectedFile)?.content || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">AI App Builder</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {appConfig.ai.availableModels.map(model => (
                <option key={model} value={model}>
                  {appConfig.ai.modelNames[model] || model}
                </option>
              ))}
            </select>
            
            {/* Sandbox Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${sandboxData ? 'bg-green-500' : 'bg-yellow-500'} ${loading ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-slate-400">
                {loading ? 'Creating...' : sandboxData ? 'Ready' : 'No sandbox'}
              </span>
            </div>
            
            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left Sidebar - Chat & Files */}
        <div className="w-[400px] border-r border-slate-700/50 flex flex-col bg-slate-900/50">
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <AnimatePresence>
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-900/50 text-red-200 border border-red-700'
                        : message.type === 'system'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Generating indicator */}
            {generating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-slate-400"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating...</span>
              </motion.div>
            )}
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-slate-700/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter URL to clone or describe what to build..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={generating || loading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || generating || loading}
                className="px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl hover:from-orange-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
          
          {/* File Explorer */}
          {generatedFiles.length > 0 && (
            <div className="border-t border-slate-700/50 max-h-[200px] overflow-y-auto">
              <div className="p-3 flex items-center gap-2 bg-slate-800/50 sticky top-0">
                <Folder className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-300">Files ({generatedFiles.length})</span>
              </div>
              <div className="p-2">
                {Object.entries(fileTree).map(([dir, files]) => (
                  <div key={dir} className="mb-1">
                    {dir && (
                      <button
                        onClick={() => toggleFolder(dir)}
                        className="flex items-center gap-1 px-2 py-1 w-full text-left hover:bg-slate-800 rounded text-slate-400 text-sm"
                      >
                        {expandedFolders.has(dir) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <Folder className="w-3 h-3 text-yellow-500" />
                        <span>{dir}</span>
                      </button>
                    )}
                    {(!dir || expandedFolders.has(dir)) && (
                      <div className={dir ? 'ml-4' : ''}>
                        {files.map((fileName) => {
                          const fullPath = dir ? `${dir}/${fileName}` : fileName;
                          return (
                            <button
                              key={fullPath}
                              onClick={() => {
                                setSelectedFile(fullPath);
                                setActiveTab('code');
                              }}
                              className={`flex items-center gap-1 px-2 py-1 w-full text-left rounded text-sm ${
                                selectedFile === fullPath
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'hover:bg-slate-800 text-slate-400'
                              }`}
                            >
                              <File className="w-3 h-3" />
                              <span>{fileName}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeTab === 'code'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4" />
                Code
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {sandboxData?.url && (
                <>
                  <button
                    onClick={refreshSandbox}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Refresh preview"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <a
                    href={sandboxData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 relative">
            {activeTab === 'preview' ? (
              <div className="absolute inset-0 bg-slate-950">
                {sandboxData?.url ? (
                  <>
                    <iframe
                      ref={iframeRef}
                      src={sandboxData.url}
                      className={`w-full h-full border-0 ${previewError ? 'hidden' : ''}`}
                      title="Sandbox Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      onLoad={() => {
                        console.log('[Preview] Iframe loaded');
                        setPreviewError(false);
                        setPreviewRetries(0);
                      }}
                      onError={() => {
                        console.log('[Preview] Iframe error');
                        setPreviewError(true);
                        // Auto-retry up to 3 times
                        if (previewRetries < 3) {
                          setTimeout(() => {
                            setPreviewRetries(r => r + 1);
                            refreshSandbox();
                          }, 3000);
                        }
                      }}
                    />
                    {previewError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                          <p className="text-slate-400 mb-2">Sandbox is starting up...</p>
                          <p className="text-slate-500 text-sm mb-4">Retry {previewRetries}/3</p>
                          <button
                            onClick={() => {
                              setPreviewRetries(0);
                              setPreviewError(false);
                              refreshSandbox();
                            }}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      {loading ? (
                        <>
                          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                          <p className="text-slate-400">Creating sandbox...</p>
                        </>
                      ) : (
                        <>
                          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400">No preview available</p>
                          <p className="text-slate-500 text-sm mt-2">Enter a URL or describe what to build</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 overflow-auto bg-slate-950 p-4">
                {selectedFile && selectedFileContent ? (
                  <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300 font-mono">{selectedFile}</span>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedFileContent)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Copy code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto">
                      <code>{selectedFileContent}</code>
                    </pre>
                  </div>
                ) : streamedContent ? (
                  <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-slate-300">Generated Output</span>
                      </div>
                    </div>
                    <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                      {streamedContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No code generated yet</p>
                      <p className="text-slate-500 text-sm mt-2">Select a file from the explorer</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <GenerationPageContent />
    </Suspense>
  );
}
