// Chat Store - State management for the AI Chat
import { create } from 'zustand';
import { getAllChats, getChat, saveChat, deleteChat, type ChatMetadata, type ChatSession } from '@/lib/persistence/db';
import { saveSnapshot, getSnapshot, restoreSnapshot } from '@/lib/persistence/snapshots';
import { workbenchStore } from '@/lib/stores/workbench';
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
  updateLastMessage: (content?: string, metadata?: Partial<ChatMessage['metadata']>) => void;
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
  forkChat: (messageId?: string) => Promise<void>;
  rewindChat: (messageId: string) => Promise<void>;
  restoreLatestSnapshot: () => Promise<void>;
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
  
  updateLastMessage: (content, metadata) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          ...(content !== undefined ? { content } : {}),
          ...(metadata ? { metadata: { ...messages[messages.length - 1].metadata, ...metadata } } : {})
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

        const snapshot = getSnapshot(chat.id);
        if (snapshot) {
          await restoreSnapshot(snapshot);
        }
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
    const summarySource =
      [...messages].reverse().find((m) => m.role === 'assistant' && m.content.trim())?.content ||
      messages[0].content;
    const summary = summarySource.replace(/\s+/g, ' ').slice(0, 140) + (summarySource.length > 140 ? '...' : '');
    
    const chatSession: ChatSession = {
      id: chatId,
      title,
      lastMessage,
      summary,
      timestamp: new Date().toISOString(),
      messages
    };
    
    try {
      await saveChat(chatSession);
      const chats = await getAllChats(); // Refresh list
      set({ chats });

      // Save snapshot of current files for restore
      const lastMessageId = messages[messages.length - 1]?.id;
      if (lastMessageId) {
        saveSnapshot(chatId, lastMessageId, workbenchStore.files.get());
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  },

  forkChat: async (messageId?: string) => {
    const { messages, chatId: currentChatId } = get();
    if (messages.length === 0) return;

    const cutIndex = messageId ? messages.findIndex((m) => m.id === messageId) : messages.length - 1;
    const forkedMessages = cutIndex >= 0 ? messages.slice(0, cutIndex + 1) : messages;

    const newId = nanoid();
    const title = forkedMessages[0]?.content?.slice(0, 50) || 'Forked Chat';
    const lastMessage = forkedMessages[forkedMessages.length - 1]?.content?.slice(0, 100) || '';

    const chatSession: ChatSession = {
      id: newId,
      title: title + (title.length > 50 ? '...' : ''),
      lastMessage,
      timestamp: new Date().toISOString(),
      messages: forkedMessages,
    };

    try {
      await saveChat(chatSession);
      const chats = await getAllChats();
      set({ chats, chatId: newId, messages: forkedMessages, chatStarted: true });

      const snapshot = getSnapshot(currentChatId);
      if (snapshot) {
        saveSnapshot(newId, snapshot.messageId, snapshot.files);
      }
    } catch (error) {
      console.error('Failed to fork chat:', error);
    }
  },

  rewindChat: async (messageId: string) => {
    const { messages, chatId } = get();
    const cutIndex = messages.findIndex((m) => m.id === messageId);
    if (cutIndex < 0) return;

    const newMessages = messages.slice(0, cutIndex + 1);
    set({ messages: newMessages, chatStarted: newMessages.length > 0 });

    const title = newMessages[0]?.content?.slice(0, 50) || 'Chat';
    const lastMessage = newMessages[newMessages.length - 1]?.content?.slice(0, 100) || '';

    try {
      await saveChat({
        id: chatId,
        title: title + (title.length > 50 ? '...' : ''),
        lastMessage,
        timestamp: new Date().toISOString(),
        messages: newMessages,
      });
      const chats = await getAllChats();
      set({ chats });
    } catch (error) {
      console.error('Failed to rewind chat:', error);
    }
  },

  restoreLatestSnapshot: async () => {
    const { chatId } = get();
    const snapshot = getSnapshot(chatId);
    if (!snapshot) return;
    await restoreSnapshot(snapshot);
  },
}));

export default useChatStore;
