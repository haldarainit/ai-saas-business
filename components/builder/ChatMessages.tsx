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
  CheckCircle,
} from 'lucide-react';
import { useChatStore, type ChatMessage } from '@/lib/stores/chat';
import { Markdown } from '@/components/chat/Markdown';
import { useWorkbenchStore } from '@/lib/stores/workbench';

// --- Artifact/Action Parsing for RESTORED chats ---
// When a chat is restored from the database, the workbench artifacts store is empty.
// The message content has __boltArtifact__ div placeholders from the streaming parser,
// which the Markdown component tries to render via the <Artifact> component.
// But <Artifact> returns null because the artifact data doesn't exist in the store.
//
// For restored chats, we need a FALLBACK: parse the ORIGINAL raw content that was
// also saved (it contains boltArtifact tags), and render a static summary.
// 
// However, since we only save the parsed content (with __boltArtifact__ placeholders),
// we render the descriptions via Markdown and show a simple "Project files" summary
// for the artifact placeholder sections.

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
 * from regular text content. This is used as a FALLBACK for cases where the
 * content still has raw boltArtifact tags (e.g. if the raw response was stored).
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
  const titleMatch = /title=["']?([^"']+)["']?/.exec(attrsStr);
  const idMatch = /id=["']?([^"']+)["']?/.exec(attrsStr);
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

    const typeMatch = /type=["']?([^"']+)["']?/.exec(actionAttrs);
    const filePathMatch = /filePath=["']?([^"']+)["']?/.exec(actionAttrs);
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

// --- Action Summary Card (for both live and restored chats) ---

function ActionCard({ action, index }: { action: ParsedAction; index: number }) {
  const { selectFile } = useWorkbenchStore();
  
  if (action.type === 'file') {
    const cleanPath = action.filePath?.replace(/^\/?(?:home\/project\/|project\/)?/, '') || '';
    return (
      <div className="border border-slate-800 rounded mb-1 overflow-hidden bg-slate-900/50">
        <button
          onClick={() => {
            if (action.filePath) {
              const fp = action.filePath.startsWith('/home/project/') 
                ? action.filePath 
                : `/home/project/${action.filePath}`;
              selectFile(fp);
            }
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-800 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400/80 shrink-0" />
          <span className="text-sm text-slate-300 font-mono truncate flex-1">{cleanPath}</span>
        </button>
      </div>
    );
  }

  if (action.type === 'shell') {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-800 rounded mb-1 bg-slate-900/50">
        <Terminal className="w-3.5 h-3.5 text-green-400/80 shrink-0" />
        <code className="text-sm text-green-300 font-mono truncate">{action.content.trim()}</code>
      </div>
    );
  }

  if (action.type === 'start') {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-800 rounded mb-1 bg-slate-900/50">
        <Play className="w-3.5 h-3.5 text-orange-400/80 shrink-0" />
        <code className="text-sm text-orange-300 font-mono truncate">{action.content.trim() || 'npm run dev'}</code>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-800 rounded mb-1 bg-slate-900/50">
      <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-sm text-slate-400">{action.type}: {action.content.slice(0, 100)}</span>
    </div>
  );
}

// --- Artifact Summary (shown for both live streaming and restored chats) ---

function ArtifactSummary({ artifact, isStreaming }: { artifact: ParsedArtifact; isStreaming?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const { setShowWorkbench } = useWorkbenchStore();
  
  // Clean file paths and filter actions
  const fileActions = artifact.actions
    .filter(a => a.type === 'file')
    .map(action => ({
      ...action,
      filePath: action.filePath?.replace(/^\/?(?:home\/project\/|project\/)?/, '')
    }));
  
  // Deduplicate shell/start commands and filter out auto-handled ones
  const shellActions = artifact.actions
    .filter(a => a.type === 'shell' || a.type === 'start')
    .reduce((acc, action) => {
      const content = action.content.trim().toLowerCase();
      
      // Skip auto-handled commands
      if (content.includes('npm install') || 
          content.includes('npm i') || 
          content.includes('npm run dev') ||
          content.includes('npm start')) {
        return acc;
      }
      
      const exists = acc.some(a => a.content.trim() === action.content.trim());
      if (!exists) {
        acc.push(action);
      }
      return acc;
    }, [] as ParsedAction[]);
  
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

// --- Restored Artifact Placeholder ---
// When a chat is restored, the __boltArtifact__ placeholders exist in the content
// but the workbench artifacts store is empty. This component provides a static fallback.

function RestoredArtifactPlaceholder() {
  const { setShowWorkbench } = useWorkbenchStore();
  
  return (
    <div className="mt-3 border border-slate-700/60 rounded-lg overflow-hidden bg-slate-800/40">
      <button
        onClick={() => setShowWorkbench(true)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400/80" />
          <span className="text-sm font-medium text-slate-200">Project Files</span>
        </div>
        <span className="text-xs text-slate-400">Click to open Workbench</span>
      </button>
    </div>
  );
}

// --- Determine how to render an AI message ---
// 
// There are 3 possible content formats for assistant messages:
// 1. Content with raw <boltArtifact> tags (if raw response was stored)
// 2. Content with __boltArtifact__ div placeholders (normal case after streaming parser)
// 3. Plain text/markdown with no artifact references
//
// For case 1: Use parseAIContent() to show textBefore + ArtifactSummary + textAfter
// For case 2: Use Markdown component which handles __boltArtifact__ via <Artifact> component
//             BUT if the Artifact returns null (restored chat), show RestoredArtifactPlaceholder
// For case 3: Just render as Markdown

function detectContentType(content: string): 'raw_artifact' | 'parsed_artifact' | 'plain' {
  if (/<boltArtifact\b/.test(content)) return 'raw_artifact';
  if (content.includes('__boltArtifact__')) return 'parsed_artifact';
  return 'plain';
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
  const { artifacts } = useWorkbenchStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine content type and parse if needed
  // For restored chats, prefer rawContent from metadata which has the full artifact info
  const effectiveContent = useMemo(() => {
    if (isUser || isSystem) return message.content;
    // If we have rawContent in metadata and the main content has placeholder divs,
    // prefer the rawContent for display (it has full artifact data)
    if (message.metadata?.rawContent && message.content.includes('__boltArtifact__')) {
      return message.metadata.rawContent;
    }
    return message.content;
  }, [message.content, message.metadata?.rawContent, isUser, isSystem]);

  const contentType = useMemo(() => {
    if (isUser || isSystem) return 'plain' as const;
    return detectContentType(effectiveContent);
  }, [effectiveContent, isUser, isSystem]);

  // Parse raw artifact content
  const parsed = useMemo(() => {
    if (contentType !== 'raw_artifact') return null;
    return parseAIContent(effectiveContent);
  }, [effectiveContent, contentType]);

  // Check if workbench has the artifacts for __boltArtifact__ rendering
  const hasWorkbenchArtifacts = useMemo(() => {
    return Object.keys(artifacts).length > 0;
  }, [artifacts]);

  // For AI messages: render based on content type
  const renderAIContent = () => {
    if (contentType === 'raw_artifact' && parsed) {
      // Case 1: Raw boltArtifact tags - render with our custom summary
      // This handles BOTH the original raw case AND restored chats (via rawContent fallback)
      return (
        <>
          {parsed.textBefore && (
            <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert">
              <Markdown html>{parsed.textBefore}</Markdown>
            </div>
          )}

          {parsed.artifact && (
            <ArtifactSummary 
              artifact={parsed.artifact} 
              isStreaming={isLast && isStreaming && parsed.isPartialArtifact}
            />
          )}

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
                  ? `${effectiveContent}<span class="cursor-blink"></span>` 
                  : effectiveContent}
              </Markdown>
            </div>
          )}
        </>
      );
    }

    if (contentType === 'parsed_artifact') {
      // Case 2: Content has __boltArtifact__ divs from the streaming parser
      if (hasWorkbenchArtifacts) {
        // Workbench has artifact data - use the proper Markdown -> Artifact rendering
        return (
          <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert">
            <Markdown html>
              {(isLast && isStreaming) 
                ? `${message.content}<span class="cursor-blink"></span>` 
                : message.content}
            </Markdown>
          </div>
        );
      } else {
        // Restored chat - workbench has no artifacts. 
        // Split the content around __boltArtifact__ divs and render with placeholder
        const parts = message.content.split(/<div[^>]*class="__boltArtifact__"[^>]*>[\s\S]*?<\/div>/g);
        const artifactMatches = message.content.match(/<div[^>]*class="__boltArtifact__"[^>]*>[\s\S]*?<\/div>/g) || [];
        
        return (
          <>
            {parts.map((part, i) => (
              <div key={i}>
                {part.trim() && (
                  <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert">
                    <Markdown html>{part.trim()}</Markdown>
                  </div>
                )}
                {i < artifactMatches.length && <RestoredArtifactPlaceholder />}
              </div>
            ))}
          </>
        );
      }
    }

    // Case 3: Plain text/markdown
    return (
      <div className="prose prose-sm max-w-none leading-relaxed prose-slate prose-invert">
        <Markdown html>
          {(isLast && isStreaming) 
            ? `${message.content}<span class="cursor-blink"></span>` 
            : message.content}
        </Markdown>
      </div>
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
