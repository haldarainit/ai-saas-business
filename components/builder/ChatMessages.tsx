'use client';

import { useRef, useEffect, memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bot, 
  AlertCircle, 
  Loader2,
  Sparkles,
  FileCode,
  Terminal,
  Play,
  ChevronDown,
  ChevronRight,
  Package,
  Eye,
} from 'lucide-react';
import { useChatStore, type ChatMessage } from '@/lib/stores/chat';
import { Markdown } from '@/components/chat/Markdown';
import { useWorkbenchStore } from '@/lib/stores/workbench';

// --- Artifact/Action Parsing ---

interface ParsedAction {
  type: string;
  filePath?: string;
  content: string;
}

interface ParsedArtifact {
  title: string;
  id: string;
  actions: ParsedAction[];
}

interface ParsedContent {
  textBefore: string;
  artifact: ParsedArtifact | null;
  textAfter: string;
  isPartialArtifact: boolean;
}

/**
 * Parse AI response to extract boltArtifact/boltAction tags and separate them
 * from regular text content. This allows rendering action summaries instead of raw XML.
 */
function parseAIContent(content: string): ParsedContent {
  const artifactOpenRegex = /<boltArtifact\b([^>]*)>/;
  const artifactCloseRegex = /<\/boltArtifact>/;

  const openMatch = artifactOpenRegex.exec(content);
  
  if (!openMatch) {
    return { textBefore: content, artifact: null, textAfter: '', isPartialArtifact: false };
  }

  const textBefore = content.substring(0, openMatch.index).trim();
  const afterOpen = content.substring(openMatch.index + openMatch[0].length);

  // Extract artifact attributes
  const attrsStr = openMatch[1];
  const titleMatch = /title="([^"]*)"/.exec(attrsStr);
  const idMatch = /id="([^"]*)"/.exec(attrsStr);
  const title = titleMatch ? titleMatch[1] : 'Generated Code';
  const id = idMatch ? idMatch[1] : 'artifact';

  const closeMatch = artifactCloseRegex.exec(afterOpen);
  const isPartialArtifact = !closeMatch;
  
  const artifactBody = closeMatch ? afterOpen.substring(0, closeMatch.index) : afterOpen;
  const textAfter = closeMatch ? afterOpen.substring(closeMatch.index + closeMatch[0].length).trim() : '';

  // Parse actions from the artifact body
  const actions: ParsedAction[] = [];
  const actionRegex = /<boltAction\b([^>]*)>([\s\S]*?)(?:<\/boltAction>|$)/g;
  let actionMatch;

  while ((actionMatch = actionRegex.exec(artifactBody)) !== null) {
    const actionAttrs = actionMatch[1];
    const actionContent = actionMatch[2].trim();

    const typeMatch = /type="([^"]*)"/.exec(actionAttrs);
    const filePathMatch = /filePath="([^"]*)"/.exec(actionAttrs);
    const actionType = typeMatch ? typeMatch[1] : 'unknown';
    const filePath = filePathMatch ? filePathMatch[1] : undefined;

    actions.push({
      type: actionType,
      filePath,
      content: actionContent,
    });
  }

  return {
    textBefore,
    artifact: { title, id, actions },
    textAfter,
    isPartialArtifact,
  };
}

// --- Action Summary Card ---

function ActionCard({ action, index }: { action: ParsedAction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { selectFile } = useWorkbenchStore();
  
  // Clean up file path for display
  const displayPath = useMemo(() => {
    if (!action.filePath) return '';
    let p = action.filePath;
    if (p.startsWith('/home/project/')) p = p.substring('/home/project/'.length);
    if (p.startsWith('home/project/')) p = p.substring('home/project/'.length);
    if (p.startsWith('project/')) p = p.substring('project/'.length);
    return p;
  }, [action.filePath]);

  if (action.type === 'file') {
    return (
      <div className="border border-slate-700/60 rounded-lg overflow-hidden bg-slate-800/40">
        <button
          onClick={() => {
            setExpanded(!expanded);
            if (action.filePath) {
              // Normalize and select in editor
              let fp = action.filePath;
              if (!fp.startsWith('/home/project/')) {
                fp = `/home/project/${fp.replace(/^\/?(home\/project\/|project\/)?/, '')}`;
              }
              selectFile(fp);
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
        >
          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-sm text-slate-300 font-mono truncate flex-1">{displayPath}</span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-700/40 px-3 py-2 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap break-all">
                  {action.content.slice(0, 2000)}
                  {action.content.length > 2000 && '\n... (truncated)'}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (action.type === 'shell') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-700/60 rounded-lg bg-slate-800/40">
        <Terminal className="w-4 h-4 text-green-400 shrink-0" />
        <code className="text-sm text-green-300 font-mono truncate">{action.content.trim()}</code>
      </div>
    );
  }

  if (action.type === 'start') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-700/60 rounded-lg bg-slate-800/40">
        <Play className="w-4 h-4 text-orange-400 shrink-0" />
        <code className="text-sm text-orange-300 font-mono truncate">{action.content.trim() || 'npm run dev'}</code>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-slate-700/60 rounded-lg bg-slate-800/40">
      <Package className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-sm text-slate-400">{action.type}: {action.content.slice(0, 100)}</span>
    </div>
  );
}

// --- Artifact Summary ---

function ArtifactSummary({ artifact, isStreaming }: { artifact: ParsedArtifact; isStreaming?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const { setShowWorkbench } = useWorkbenchStore();
  
  const fileActions = artifact.actions.filter(a => a.type === 'file');
  const shellActions = artifact.actions.filter(a => a.type === 'shell' || a.type === 'start');
  
  const visibleFiles = showAll ? fileActions : fileActions.slice(0, 5);
  const hiddenCount = fileActions.length - visibleFiles.length;

  return (
    <div className="mt-3 space-y-2">
      {/* Artifact header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{artifact.title}</span>
          {isStreaming && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
        </div>
        <button
          onClick={() => setShowWorkbench(true)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Open Workbench
        </button>
      </div>

      {/* File actions */}
      {visibleFiles.length > 0 && (
        <div className="space-y-1">
          {visibleFiles.map((action, i) => (
            <ActionCard key={`${action.filePath || i}`} action={action} index={i} />
          ))}
          {hiddenCount > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-300 py-1.5 border border-dashed border-slate-700/50 rounded-lg hover:bg-slate-800/30 transition-colors"
            >
              + {hiddenCount} more file{hiddenCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Shell/Start actions */}
      {shellActions.length > 0 && (
        <div className="space-y-1 pt-1">
          {shellActions.map((action, i) => (
            <ActionCard key={`shell-${i}`} action={action} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Message Component ---

interface MessageProps {
  message: ChatMessage;
  isLast?: boolean;
  isStreaming?: boolean;
}

const Message = memo(function Message({ message, isLast, isStreaming }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isMessageStreaming = message.metadata?.streaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse AI content to extract artifact actions
  const parsed = useMemo(() => {
    if (isUser || isSystem) return null;
    return parseAIContent(message.content);
  }, [message.content, isUser, isSystem]);

  // For AI messages: render text + artifact summary
  const renderAIContent = () => {
    if (!parsed) return null;

    return (
      <>
        {/* Text content before artifact (explanation, intro) */}
        {parsed.textBefore && (
          <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert">
            <Markdown html>{parsed.textBefore}</Markdown>
          </div>
        )}

        {/* Artifact summary card */}
        {parsed.artifact && (
          <ArtifactSummary 
            artifact={parsed.artifact} 
            isStreaming={isLast && isStreaming && parsed.isPartialArtifact}
          />
        )}

        {/* Text content after artifact */}
        {parsed.textAfter && (
          <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert mt-3">
            <Markdown html>{parsed.textAfter}</Markdown>
          </div>
        )}

        {/* If no artifact found, render as normal markdown */}
        {!parsed.artifact && !parsed.textBefore && (
          <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert">
            <Markdown html>
              {(isLast && isStreaming) 
                ? `${message.content}<span class="cursor-blink"></span>` 
                : message.content}
            </Markdown>
          </div>
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
        isUser 
          ? 'bg-gradient-to-r from-orange-500 to-pink-600' 
          : isSystem 
          ? 'bg-slate-700'
          : 'bg-gradient-to-r from-blue-500 to-purple-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isSystem ? (
          <AlertCircle className="w-4 h-4 text-slate-300" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ring-1 w-full ${
            isUser
              ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white ring-white/10'
              : isSystem
              ? 'bg-slate-800/40 text-slate-300 border border-slate-700/60 ring-transparent'
              : 'bg-slate-800/80 text-slate-200 ring-slate-700/60'
          }`}
        >
          {/* Streaming indicator */}
          {isMessageStreaming && (
            <div className="flex items-center gap-2 text-xs text-slate-300/80 mb-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}

          {/* Content */}
          {isUser ? (
            <div className="prose prose-sm max-w-none leading-relaxed prose-invert">
              <p className="m-0 whitespace-pre-wrap tracking-[0.01em]">{message.content}</p>
            </div>
          ) : (
            renderAIContent()
          )}

          {/* Metadata */}
          {message.metadata?.model && !isUser && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
              <Sparkles className="w-3 h-3 text-slate-500" />
              <span className="uppercase tracking-wide">{message.metadata.model}</span>
              {message.metadata.tokens && (
                <span>• {message.metadata.tokens} tokens</span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[11px] text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
});

// --- ChatMessages Component ---

export function ChatMessages() {
  const { messages, isStreaming, setInput, forkChat, rewindChat, restoreLatestSnapshot } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-bold text-white mb-3 mt-12">
            Where ideas begin
          </h2>
          <p className="text-slate-400 mb-6">
            Describe what you want to build, or enter a URL to clone an existing website.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Build a landing page',
              'Create a dashboard',
              'Make a blog',
              'Design a portfolio'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-hide scroll-smooth"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <div key={message.id} className="relative group">
            <Message 
              message={message} 
              isLast={index === messages.length - 1}
              isStreaming={isStreaming}
            />
            {message.role === 'assistant' && (
              <div className="mt-1 ml-11 flex items-center gap-2 text-[11px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => rewindChat(message.id)}
                  className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300"
                >
                  Rewind
                </button>
                <button
                  onClick={() => forkChat(message.id)}
                  className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300"
                >
                  Fork
                </button>
                <button
                  onClick={() => restoreLatestSnapshot()}
                  className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300"
                >
                  Restore Snapshot
                </button>
              </div>
            )}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ChatMessages;
