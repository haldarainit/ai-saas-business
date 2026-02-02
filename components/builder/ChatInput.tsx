'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  X,
  Image as ImageIcon,
  Loader2,
  StopCircle,
  Link2
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
  placeholder = "Enter URL to clone or describe what to build...",
  disabled = false
}: ChatInputProps) {
  const { input, setInput, isLoading, isStreaming } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [showEnhancePrompt, setShowEnhancePrompt] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [setInput]);

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
    
    // Generate previews for images
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
  };

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim()) return;
    setShowEnhancePrompt(true);
    
    // In a real implementation, this would call an API to enhance the prompt
    // For now, we'll just add some context
    setTimeout(() => {
      const enhanced = `Create a modern, responsive ${input} with the following features:
- Beautiful UI with smooth animations
- Dark mode support
- Mobile-first design
- Clean, maintainable code structure
- Best practices for accessibility`;
      setInput(enhanced);
      setShowEnhancePrompt(false);
    }, 1000);
  };

  const isUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(text.trim());
  };

  return (
    <div className="border-t border-slate-700/50 p-4 bg-slate-900/50">
      {/* File Previews */}
      <AnimatePresence>
        {imagePreview.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 flex gap-2 overflow-x-auto pb-2"
          >
            {imagePreview.map((src, index) => (
              <div key={index} className="relative shrink-0">
                <img
                  src={src}
                  alt={`Upload ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border border-slate-700"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="relative">
        <div className="flex items-end gap-2">
          {/* Main Input */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
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

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Enhance Prompt */}
                <button
                  onClick={handleEnhancePrompt}
                  disabled={!input.trim() || showEnhancePrompt}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Enhance prompt with AI"
                >
                  {showEnhancePrompt ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </button>

                {/* File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
                  title="Attach image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Voice Input */}
                {recognition && (
                  <button
                    onClick={toggleListening}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'hover:bg-slate-700 text-slate-400 hover:text-slate-300'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Send/Stop Button */}
          {isLoading || isStreaming ? (
            <button
              onClick={onStop}
              className="shrink-0 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-colors"
              title="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedFiles.length === 0) || disabled}
              className="shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>
            {isListening && (
              <span className="text-red-400 animate-pulse mr-2">● Recording...</span>
            )}
            Press Enter to send, Shift+Enter for new line
          </span>
          <span>
            {input.length > 0 && `${input.length} characters`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
