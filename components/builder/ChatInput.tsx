'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  StopCircle,
  Link2,
  Sparkles,
  X,
  Loader2,
  Paperclip
} from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ 
  onSend, 
  onStop,
  placeholder = "Describe what you want to build...",
  disabled = false
}: ChatInputProps) {
  const { input, setInput, isLoading, isStreaming } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [showEnhancePrompt, setShowEnhancePrompt] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    if (isLoading || isStreaming) return;

    onSend(input.trim(), uploadedFiles.length > 0 ? uploadedFiles : undefined);
    setInput('');
    setUploadedFiles([]);
    setImagePreview([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, uploadedFiles, isLoading, isStreaming, onSend, setInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim()) return;
    setShowEnhancePrompt(true);
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      
      if (!response.ok) throw new Error('Failed to enhance prompt');
      
      const data = await response.json();
      if (data.enhancedPrompt) {
        setInput(data.enhancedPrompt);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      // Optional: Add toast notification here
    } finally {
      setShowEnhancePrompt(false);
    }
  };

  const isUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(text.trim());
  };

  return (
    <div className="border-t border-slate-800 p-4 bg-slate-950">
      <div className="relative max-w-4xl mx-auto">
        
        {/* Toolbar - Top of Send Message (Input Area) */}
        <div className="flex items-center gap-4 mb-2 px-1">
             <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading || isStreaming}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
                <span>Add File</span>
             </button>
             
             <button
                onClick={handleEnhancePrompt}
                disabled={!input.trim() || showEnhancePrompt || disabled || isLoading || isStreaming}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Enhance prompt with AI"
              >
                {showEnhancePrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Enhance Prompt</span>
             </button>
        </div>

        {/* File Previews */}
        <AnimatePresence>
            {imagePreview.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              >
                {imagePreview.map((src, index) => (
                  <div key={index} className="relative shrink-0 group">
                    <img
                      src={src}
                      alt={`Upload ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-lg border border-slate-800"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Main Input */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus-within:border-blue-500/50 transition-all">
              {/* URL indicator */}
              {isUrl(input) && (
                <Link2 className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isLoading || isStreaming}
                rows={1}
                className="flex-1 bg-transparent text-white placeholder:text-slate-500 resize-none outline-none min-h-[24px] max-h-[200px]"
              />
            </div>
          </div>

          {/* Send/Stop Button */}
          {isLoading || isStreaming ? (
            <button
              onClick={onStop}
              className="shrink-0 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-red-500/20"
              title="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedFiles.length === 0) || disabled}
              className="shrink-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-600/20"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Input for files */}
        <input
           ref={fileInputRef}
           type="file"
           multiple
           onChange={handleFileUpload}
           className="hidden"
        />

        {/* Hints */}
        <div className="flex items-center justify-center mt-2 text-[10px] text-slate-600">
          <span>
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
