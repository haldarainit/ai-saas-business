'use client';

import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  User, 
  Bot, 
  AlertCircle, 
  Copy, 
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useChatStore, type ChatMessage } from '@/lib/stores/chat';
import { useState } from 'react';

interface MessageProps {
  message: ChatMessage;
}

const Message = memo(function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isStreaming = message.metadata?.streaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract code blocks from content
  const hasCode = message.content.includes('```');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-to-r from-orange-500 to-pink-600' 
          : isSystem 
          ? 'bg-slate-700'
          : 'bg-gradient-to-r from-blue-500 to-purple-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isSystem ? (
          <AlertCircle className="w-4 h-4 text-slate-400" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white'
              : isSystem
              ? 'bg-slate-800/50 text-slate-400 border border-slate-700'
              : 'bg-slate-800 text-slate-200'
          }`}
        >
          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}

          {/* Message content with markdown */}
          <div className={`prose prose-sm max-w-none ${
            isUser ? 'prose-invert' : 'prose-slate prose-invert'
          }`}>
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    
                    return isInline ? (
                      <code
                        className="px-1.5 py-0.5 bg-slate-700/50 rounded text-orange-300 text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <div className="relative group my-3">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={handleCopy}
                            className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                          >
                            {copied ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                        <pre className="!bg-[#1e1e1e] !p-4 rounded-lg overflow-x-auto border border-slate-700">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Metadata */}
          {message.metadata?.model && !isUser && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-500">
              <Sparkles className="w-3 h-3" />
              <span>{message.metadata.model}</span>
              {message.metadata.tokens && (
                <span>• {message.metadata.tokens} tokens</span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
});

export function ChatMessages() {
  const { messages, isStreaming } = useChatStore();
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
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-orange-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
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
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors"
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
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {/* Streaming indicator */}
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-slate-400 pl-11"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating response...</span>
        </motion.div>
      )}
    </div>
  );
}

export default ChatMessages;
