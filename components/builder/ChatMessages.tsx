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
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { useChatStore, type ChatMessage } from '@/lib/stores/chat';
import { Markdown } from '@/components/chat/Markdown';
import { useWorkbenchStore } from '@/lib/stores/workbench';

// ── Types ──────────────────────────────────────────────────────────────

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

// ── Parser ─────────────────────────────────────────────────────────────

function parseAIContent(content: string): ParsedContent {
  const artifactOpenRegex = /<boltArtifact\b([^>]*)>/;
  const artifactCloseRegex = /<\/boltArtifact>/;
  const openMatch = artifactOpenRegex.exec(content);

  if (!openMatch) {
    return { textBefore: content, artifact: null, textAfter: '', isPartialArtifact: false };
  }

  const textBefore = content.substring(0, openMatch.index).trim();
  const afterOpen = content.substring(openMatch.index + openMatch[0].length);
  const attrsStr = openMatch[1];
  const titleMatch = /title=["']?([^"']+)["']?/.exec(attrsStr);
  const idMatch = /id=["']?([^"']+)["']?/.exec(attrsStr);
  const title = titleMatch ? titleMatch[1] : 'Generated Code';
  const id = idMatch ? idMatch[1] : 'artifact';
  const closeMatch = artifactCloseRegex.exec(afterOpen);
  const isPartialArtifact = !closeMatch;
  const artifactBody = closeMatch ? afterOpen.substring(0, closeMatch.index) : afterOpen;
  const textAfter = closeMatch ? afterOpen.substring(closeMatch.index + closeMatch[0].length).trim() : '';

  const actions: ParsedAction[] = [];
  const actionRegex = /<boltAction\b([^>]*)>([\s\S]*?)(?:<\/boltAction>|$)/g;
  let actionMatch;
  while ((actionMatch = actionRegex.exec(artifactBody)) !== null) {
    const actionAttrs = actionMatch[1];
    const actionContent = actionMatch[2].trim();
    const typeMatch = /type=["']?([^"']+)["']?/.exec(actionAttrs);
    const filePathMatch = /filePath=["']?([^"']+)["']?/.exec(actionAttrs);
    actions.push({
      type: typeMatch ? typeMatch[1] : 'unknown',
      filePath: filePathMatch ? filePathMatch[1] : undefined,
      content: actionContent,
    });
  }

  return { textBefore, artifact: { title, id, actions }, textAfter, isPartialArtifact };
}

// ── Compact Artifact Card ──────────────────────────────────────────────

function ArtifactCard({ artifact, isStreaming }: { artifact: ParsedArtifact; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { setShowWorkbench, selectFile } = useWorkbenchStore();

  const fileActions = artifact.actions
    .filter(a => a.type === 'file')
    .map(a => ({
      ...a,
      filePath: a.filePath?.replace(/^\/?(?:home\/project\/|project\/)?/, ''),
    }));

  const shellActions = artifact.actions
    .filter(a => a.type === 'shell' || a.type === 'start');

  const totalActions = fileActions.length + shellActions.length;

  return (
    <div className="mt-3 rounded-lg border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-7 h-7 rounded-md bg-purple-500/15 flex items-center justify-center shrink-0">
          {isStreaming ? (
            <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-slate-100 truncate">{artifact.title}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {fileActions.length} file{fileActions.length !== 1 ? 's' : ''}
            {shellActions.length > 0 && ` · ${shellActions.length} command${shellActions.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button
          onClick={() => setShowWorkbench(true)}
          className="shrink-0 text-[11px] font-medium text-blue-400 hover:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-400/10 transition-colors"
        >
          Open
        </button>
        {totalActions > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Expandable file list */}
      <AnimatePresence>
        {expanded && totalActions > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700/30 px-3 py-2 space-y-0.5 max-h-52 overflow-y-auto scrollbar-hide">
              {fileActions.map((action, i) => (
                <button
                  key={`f-${i}`}
                  onClick={() => {
                    if (action.filePath) {
                      selectFile(action.filePath.startsWith('/home/project/')
                        ? action.filePath
                        : `/home/project/${action.filePath}`
                      );
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-slate-700/40 transition-colors group"
                >
                  <FileCode className="w-3 h-3 text-blue-400/60 group-hover:text-blue-400 shrink-0" />
                  <span className="text-[12px] text-slate-400 group-hover:text-slate-200 font-mono truncate">{action.filePath}</span>
                </button>
              ))}
              {shellActions.map((action, i) => (
                <div key={`s-${i}`} className="flex items-center gap-2 px-2 py-1.5 border-t border-slate-700/30 first:border-0">
                  <Terminal className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <code className="text-[12px] text-green-300 font-mono truncate bg-transparent flex-1">{action.content.trim()}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Restored artifact placeholder ──────────────────────────────────────

function RestoredArtifactCard() {
  const { setShowWorkbench } = useWorkbenchStore();
  return (
    <div className="mt-3 rounded-lg border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <button
        onClick={() => setShowWorkbench(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-700/20 transition-colors"
      >
        <div className="w-7 h-7 rounded-md bg-green-500/15 flex items-center justify-center shrink-0">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[13px] font-medium text-slate-100">Project Files</div>
          <div className="text-[11px] text-slate-500">Click to open in Workbench</div>
        </div>
        <Eye className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  );
}

// ── Content helpers ────────────────────────────────────────────────────

function detectContentType(content: string): 'raw_artifact' | 'parsed_artifact' | 'plain' {
  if (/<boltArtifact\b/.test(content)) return 'raw_artifact';
  if (content.includes('__boltArtifact__')) return 'parsed_artifact';
  return 'plain';
}

// ── Message Component ──────────────────────────────────────────────────

interface MessageProps {
  message: ChatMessage;
  isLast?: boolean;
  isStreaming?: boolean;
}

const Message = memo(function Message({ message, isLast, isStreaming }: MessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isMessageStreaming = message.metadata?.streaming;
  const { artifacts } = useWorkbenchStore();

  // Determine effective content (prefer rawContent from metadata for restored chats)
  const effectiveContent = useMemo(() => {
    if (isUser || isSystem) return message.content;
    if (message.metadata?.rawContent && message.content.includes('__boltArtifact__')) {
      return message.metadata.rawContent;
    }
    return message.content;
  }, [message.content, message.metadata?.rawContent, isUser, isSystem]);

  const contentType = useMemo(() => {
    if (isUser || isSystem) return 'plain' as const;
    return detectContentType(effectiveContent);
  }, [effectiveContent, isUser, isSystem]);

  const parsed = useMemo(() => {
    if (contentType !== 'raw_artifact') return null;
    return parseAIContent(effectiveContent);
  }, [effectiveContent, contentType]);

  const hasWorkbenchArtifacts = useMemo(() => Object.keys(artifacts).length > 0, [artifacts]);

  // ── AI content renderer ──
  const renderAIContent = () => {
    // Case 1: Raw boltArtifact — show text + compact artifact card
    if (contentType === 'raw_artifact' && parsed) {
      return (
        <>
          {parsed.textBefore && (
            <div className="prose prose-sm max-w-none prose-slate prose-invert leading-relaxed">
              <Markdown html>{parsed.textBefore}</Markdown>
            </div>
          )}
          {parsed.artifact && (
            <ArtifactCard artifact={parsed.artifact} isStreaming={isLast && isStreaming && parsed.isPartialArtifact} />
          )}
          {parsed.textAfter && (
            <div className="prose prose-sm max-w-none prose-slate prose-invert leading-relaxed mt-2">
              <Markdown html>{parsed.textAfter}</Markdown>
            </div>
          )}
          {!parsed.artifact && !parsed.textBefore && (
            <div className="prose prose-sm max-w-none prose-slate prose-invert leading-relaxed">
              <Markdown html>
                {(isLast && isStreaming) ? `${effectiveContent}<span class="cursor-blink"></span>` : effectiveContent}
              </Markdown>
            </div>
          )}
        </>
      );
    }

    // Case 2: Parsed __boltArtifact__ placeholders
    if (contentType === 'parsed_artifact') {
      if (hasWorkbenchArtifacts) {
        return (
          <div className="prose prose-sm max-w-none prose-slate prose-invert leading-relaxed">
            <Markdown html>
              {(isLast && isStreaming) ? `${message.content}<span class="cursor-blink"></span>` : message.content}
            </Markdown>
          </div>
        );
      } else {
        const parts = message.content.split(/<div[^>]*class="__boltArtifact__"[^>]*>[\s\S]*?<\/div>/g);
        const matches = message.content.match(/<div[^>]*class="__boltArtifact__"[^>]*>[\s\S]*?<\/div>/g) || [];
        return (
          <>
            {parts.map((part, i) => (
              <div key={i}>
                {part.trim() && (
                  <div className="prose prose-sm max-w-none prose-slate prose-invert leading-relaxed">
                    <Markdown html>{part.trim()}</Markdown>
                  </div>
                )}
                {i < matches.length && <RestoredArtifactCard />}
              </div>
            ))}
          </>
        );
      }
    }

    // Case 3: Plain markdown
    return (
      <div className="prose prose-sm max-w-none prose-slate prose-invert leading-relaxed">
        <Markdown html>
          {(isLast && isStreaming) ? `${message.content}<span class="cursor-blink"></span>` : message.content}
        </Markdown>
      </div>
    );
  };

  // ── User message ──
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex gap-2.5 justify-end"
      >
        <div className="max-w-[80%]">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] leading-relaxed shadow-sm">
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="text-[10px] text-slate-600 mt-1 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </motion.div>
    );
  }

  // ── System message ──
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30">
          <AlertCircle className="w-3 h-3 text-amber-400/70" />
          <span className="text-[11px] text-slate-400">{message.content}</span>
        </div>
      </motion.div>
    );
  }

  // ── Assistant message ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2.5"
    >
      <div className="shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0 max-w-[90%]">
        {/* Streaming indicator */}
        {isMessageStreaming && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
            <span className="text-[11px] text-slate-500">Generating...</span>
          </div>
        )}

        {/* Main content */}
        {renderAIContent()}

        {/* Footer - model + time */}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
          {message.metadata?.model && (
            <>
              <span className="uppercase tracking-wider font-medium">{message.metadata.model}</span>
              {message.metadata.tokens && <span>· {message.metadata.tokens} tokens</span>}
              <span>·</span>
            </>
          )}
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </motion.div>
  );
});

// ── ChatMessages Component ─────────────────────────────────────────────

export function ChatMessages() {
  const { messages, isStreaming, setInput, forkChat, rewindChat, restoreLatestSnapshot } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages and streaming updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollHeight, clientHeight, scrollTop } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isNearBottom || isStreaming) {
      // Use smooth scroll only for small jumps to avoid jarring movement
      const distance = scrollHeight - scrollTop - clientHeight;
      container.scrollTo({
        top: scrollHeight,
        behavior: distance < 300 ? 'smooth' : 'auto'
      });
    }
  }, [messages, isStreaming, messages[messages.length - 1]?.content]);

  // ── Empty state ──
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1.5">What do you want to build?</h2>
          <p className="text-sm text-slate-500 mb-5">
            Describe your idea or paste a URL to clone.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {['Landing page', 'Dashboard', 'Blog', 'Portfolio'].map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 hover:border-slate-600 transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Message list ──
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide scroll-smooth"
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
              <div className="ml-9 mt-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => rewindChat(message.id)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  Rewind
                </button>
                <button
                  onClick={() => forkChat(message.id)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  Fork
                </button>
                <button
                  onClick={() => restoreLatestSnapshot()}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  Restore
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
