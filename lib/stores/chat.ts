// Chat Store - State management for the AI Chat
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    files?: string[];
    model?: string;
    provider?: string;
    tokens?: number;
    streaming?: boolean;
  };
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  icon?: string;
  enabled: boolean;
  apiKeyRequired: boolean;
  models: string[];
}

export const PROVIDERS: ProviderInfo[] = [
  {
    name: 'google',
    displayName: 'Google Gemini',
    enabled: true,
    apiKeyRequired: true,
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
  },
  {
    name: 'openai',
    displayName: 'OpenAI',
    enabled: true,
    apiKeyRequired: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    enabled: true,
    apiKeyRequired: true,
    models: ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus']
  },
  {
    name: 'groq',
    displayName: 'Groq',
    enabled: true,
    apiKeyRequired: true,
    models: ['llama-3.3-70b', 'llama-3.1-70b', 'mixtral-8x7b']
  }
];

interface ChatState {
  // Messages
  messages: ChatMessage[];
  
  // Provider state
  currentProvider: string;
  currentModel: string;
  apiKeys: Record<string, string>;
  
  // UI state
  input: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Chat state
  chatStarted: boolean;
  chatId: string | null;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setInput: (input: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentProvider: (provider: string) => void;
  setCurrentModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
  setChatStarted: (started: boolean) => void;
  setChatId: (id: string | null) => void;
  reset: () => void;
}

let messageCounter = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  currentProvider: 'google',
  currentModel: 'gemini-2.5-flash',
  apiKeys: {},
  input: '',
  isLoading: false,
  isStreaming: false,
  error: null,
  chatStarted: false,
  chatId: null,

  // Actions
  addMessage: (message) => {
    messageCounter++;
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${messageCounter}`,
      timestamp: new Date()
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
      chatStarted: true
    }));
  },
  
  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content
        };
      }
      return { messages };
    });
  },
  
  setMessages: (messages) => set({ messages }),
  
  clearMessages: () => set({ 
    messages: [], 
    chatStarted: false,
    chatId: null 
  }),
  
  setInput: (input) => set({ input }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  
  setError: (error) => set({ error }),
  
  setCurrentProvider: (provider) => {
    const providerInfo = PROVIDERS.find(p => p.name === provider);
    if (providerInfo && providerInfo.models.length > 0) {
      set({ 
        currentProvider: provider,
        currentModel: providerInfo.models[0]
      });
    }
  },
  
  setCurrentModel: (model) => set({ currentModel: model }),
  
  setApiKey: (provider, key) => {
    set((state) => ({
      apiKeys: { ...state.apiKeys, [provider]: key }
    }));
  },
  
  setChatStarted: (started) => set({ chatStarted: started }),
  
  setChatId: (id) => set({ chatId: id }),
  
  reset: () => set({
    messages: [],
    input: '',
    isLoading: false,
    isStreaming: false,
    error: null,
    chatStarted: false,
    chatId: null
  })
}));

export default useChatStore;
