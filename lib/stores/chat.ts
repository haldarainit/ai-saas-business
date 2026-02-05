// Chat Store - State management for the AI Chat
import { create } from 'zustand';
import { getAllChats, getChat, saveChat, deleteChat, type ChatMetadata, type ChatSession } from '@/lib/persistence/db';
import { nanoid } from 'nanoid';

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
    enabled: false,
    apiKeyRequired: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    enabled: false,
    apiKeyRequired: true,
    models: ['claude-3-5-sonnet', 'claude-3-opus']
  },
  {
    name: 'groq',
    displayName: 'Groq',
    enabled: false,
    apiKeyRequired: true,
    models: ['llama-3.1-70b', 'mixtral-8x7b']
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
  chatId: string;
  chats: ChatMetadata[]; // List of available chats
  
  // Actions
  initialize: () => Promise<void>;
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
  setChatId: (id: string) => void;
  reset: () => void;
  
  // History Actions
  loadChat: (id: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  saveCurrentChat: () => Promise<void>;
}

let messageCounter = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  currentProvider: 'google',
  currentModel: 'gemini-1.5-flash',
  apiKeys: {},
  input: '',
  isLoading: false,
  isStreaming: false,
  error: null,
  chatStarted: false,
  chatId: nanoid(),
  chats: [],

  // Actions
  initialize: async () => {
    try {
      const chats = await getAllChats();
      set({ chats });
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  },

  addMessage: (message) => {
    messageCounter++;
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${messageCounter}`,
      timestamp: new Date()
    };
    
    set((state) => {
      const newMessages = [...state.messages, newMessage];
      const newState = {
        messages: newMessages,
        chatStarted: true
      };
      
      // Auto-save on user message (ignoring streaming assistant messages for now)
      if (message.role === 'user') {
        get().saveCurrentChat(); 
      }
      
      return newState;
    });
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
    
    // Auto-save after update (debounced ideally, but direct for now)
    // We don't await this to avoid blocking UI
    // get().saveCurrentChat(); 
  },
  
  setMessages: (messages) => set({ messages }),
  
  clearMessages: () => set({ 
    messages: [], 
    chatStarted: false,
    chatId: nanoid()
  }),
  
  setInput: (input) => set({ input }),
  
  setIsLoading: (loading) => {
    set({ isLoading: loading });
    // If we finished loading/generation, save the chat
    if (!loading) {
       get().saveCurrentChat();
    }
  },
  
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
    chatId: nanoid()
  }),
  
  loadChat: async (id) => {
    try {
      const chat = await getChat(id);
      if (chat) {
        // Convert dates back from string if needed (IndexedDB stores structured clone, so Date object might be preserved, but let's be safe)
        const messages = chat.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        
        set({
          chatId: chat.id,
          messages,
          chatStarted: true,
          // Extract model/provider from last message if available?
        });
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  },

  deleteChat: async (id) => {
    try {
      await deleteChat(id);
      const chats = await getAllChats();
      set({ chats });
      
      // If deleting current chat, reset
      if (get().chatId === id) {
        get().reset();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  },

  saveCurrentChat: async () => {
    const { chatId, messages } = get();
    if (messages.length === 0) return;
    
    const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
    const lastMessage = messages[messages.length - 1].content.slice(0, 100);
    
    const chatSession: ChatSession = {
      id: chatId,
      title,
      lastMessage,
      timestamp: new Date().toISOString(),
      messages
    };
    
    try {
      await saveChat(chatSession);
      const chats = await getAllChats(); // Refresh list
      set({ chats });
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  }
}));

export default useChatStore;
