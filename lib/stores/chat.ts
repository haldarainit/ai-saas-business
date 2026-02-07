// Chat Store - State management for the AI Chat
import { create } from 'zustand';
import type { ChatMetadata } from '@/lib/persistence/db';
import { restoreSnapshot } from '@/lib/persistence/snapshots';
import { workbenchStore } from '@/lib/stores/workbench';
import {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  type WorkspaceMessage,
} from '@/lib/persistence/workspaces';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    publicId?: string;
    name?: string;
    mimeType?: string;
  }>;
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
  inspectorSelections: string[];
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
  addInspectorSelection: (selection: string) => void;
  removeInspectorSelection: (selection: string) => void;
  clearInspectorSelections: () => void;
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
let autoRunInProgress = false;
let fileWatcherInitialized = false;
let fileSaveTimeout: ReturnType<typeof setTimeout> | null = null;

function formatWorkspaceError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (!message) return fallback;
  if (message.toLowerCase().includes('database unavailable')) {
    return 'Database unavailable. Working locally and will retry shortly.';
  }
  if (message.toLowerCase().includes('retry in')) {
    return message;
  }
  return fallback;
}

function toWorkspaceMessages(messages: ChatMessage[]): WorkspaceMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp?.toISOString(),
    metadata: message.metadata as Record<string, unknown> | undefined,
    attachments: message.attachments,
  }));
}

function fromWorkspaceMessages(messages: WorkspaceMessage[]): ChatMessage[] {
  return messages.map((message) => {
    const role = message.role === 'ai' ? 'assistant' : message.role;
    return {
      id: `msg-${Date.now()}-${++messageCounter}`,
      role: role as ChatMessage['role'],
      content: message.content,
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      metadata: (message.metadata as ChatMessage['metadata']) || undefined,
      attachments: message.attachments,
    };
  });
}

async function ensureDevServerRunning() {
  if (autoRunInProgress) return;
  autoRunInProgress = true;

  try {
    await workbenchStore.ensureDevServerRunning();
  } catch (error) {
    console.error('Auto-run dev server failed:', error);
  } finally {
    autoRunInProgress = false;
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  currentProvider: 'google',
  currentModel: 'gemini-2.5-flash',
  apiKeys: {},
  input: '',
  inspectorSelections: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  chatStarted: false,
  chatId: '',
  chats: [],

  // Actions
  initialize: async () => {
    try {
      const workspaces = await listWorkspaces();
      const chats = workspaces.map((workspace) => {
        const lastMessage = workspace.messages?.[workspace.messages.length - 1]?.content || '';
        const summarySource =
          [...(workspace.messages || [])]
            .reverse()
            .find((m) => m.role === 'assistant' && m.content?.trim())
            ?.content || (workspace.messages?.[0]?.content || '');
        const summary = summarySource.replace(/\s+/g, ' ').slice(0, 140) + (summarySource.length > 140 ? '...' : '');
        return {
          id: workspace._id,
          title: workspace.name || 'Untitled Chat',
          lastMessage: lastMessage.slice(0, 100),
          summary,
          timestamp: workspace.updatedAt || workspace.createdAt || new Date().toISOString(),
        } as ChatMetadata;
      });
      set({ chats, error: null });

      if (!fileWatcherInitialized) {
        fileWatcherInitialized = true;
        workbenchStore.files.listen(() => {
          if (get().messages.length === 0) return;
          if (fileSaveTimeout) {
            clearTimeout(fileSaveTimeout);
          }
          fileSaveTimeout = setTimeout(() => {
            get().saveCurrentChat();
          }, 1500);
        });
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      set({ error: formatWorkspaceError(error, 'Failed to load chats. Please sign in again.') });
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
      if (messages.length === 0) {
        return { messages };
      }

      let targetIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'assistant' || msg.metadata?.streaming) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex === -1) {
        targetIndex = messages.length - 1;
      }

      const target = messages[targetIndex];
      messages[targetIndex] = {
        ...target,
        ...(content !== undefined ? { content } : {}),
        ...(metadata ? { metadata: { ...target.metadata, ...metadata } } : {}),
      };

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
    chatId: ''
  }),
  
  setInput: (input) => set({ input }),
  addInspectorSelection: (selection) =>
    set((state) => ({
      inspectorSelections: state.inspectorSelections.includes(selection)
        ? state.inspectorSelections
        : [...state.inspectorSelections, selection],
    })),
  removeInspectorSelection: (selection) =>
    set((state) => ({
      inspectorSelections: state.inspectorSelections.filter((item) => item !== selection),
    })),
  clearInspectorSelections: () => set({ inspectorSelections: [] }),
  
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
    chatId: ''
  }),
  
  loadChat: async (id) => {
    try {
      const workspace = await getWorkspace(id);

      const messages = fromWorkspaceMessages(workspace.messages || []);
      set({
        chatId: workspace._id,
        messages,
        chatStarted: true,
        error: null,
      });

      // Clear and restore project files
      await workbenchStore.clearProject();
      if (workspace.fileData) {
        await restoreSnapshot({
          chatId: workspace._id,
          messageId: '',
          files: workspace.fileData as any,
          timestamp: Date.now(),
        });
      }

      // Always try to auto-run preview if not already running
      ensureDevServerRunning();
    } catch (error) {
      console.error('Failed to load chat:', error);
      set({ error: formatWorkspaceError(error, 'Failed to load this chat. Please try again.') });
    }
  },

  deleteChat: async (id) => {
    try {
      await deleteWorkspace(id);
      const workspaces = await listWorkspaces();
      const chats = workspaces.map((workspace) => ({
        id: workspace._id,
        title: workspace.name || 'Untitled Chat',
        lastMessage: workspace.messages?.[workspace.messages.length - 1]?.content?.slice(0, 100) || '',
        summary:
          [...(workspace.messages || [])]
            .reverse()
            .find((m) => m.role === 'assistant' && m.content?.trim())
            ?.content?.slice(0, 140) || '',
        timestamp: workspace.updatedAt || workspace.createdAt || new Date().toISOString(),
      })) as ChatMetadata[];
      set({ chats, error: null });
      
      // If deleting current chat, reset
      if (get().chatId === id) {
        get().reset();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      set({ error: formatWorkspaceError(error, 'Failed to delete chat. Please try again.') });
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

    try {
      let workspaceId = chatId;
      if (!workspaceId) {
        const workspace = await createWorkspace(title || 'Untitled Chat');
        workspaceId = workspace._id;
        set({ chatId: workspaceId });
      }

      await updateWorkspace(workspaceId, {
        name: title || 'Untitled Chat',
        messages: toWorkspaceMessages(messages),
        fileData: workbenchStore.files.get(),
        history: [],
      });

      const workspaces = await listWorkspaces();
      const chats = workspaces.map((workspace) => ({
        id: workspace._id,
        title: workspace.name || 'Untitled Chat',
        lastMessage: workspace.messages?.[workspace.messages.length - 1]?.content?.slice(0, 100) || '',
        summary,
        timestamp: workspace.updatedAt || workspace.createdAt || new Date().toISOString(),
      })) as ChatMetadata[];
      set({ chats, error: null });
    } catch (error) {
      console.error('Failed to save chat:', error);
      set({ error: formatWorkspaceError(error, 'Failed to save changes. Check your connection.') });
    }
  },

  forkChat: async (messageId?: string) => {
    const { messages, chatId: currentChatId } = get();
    if (messages.length === 0) return;

    const cutIndex = messageId ? messages.findIndex((m) => m.id === messageId) : messages.length - 1;
    const forkedMessages = cutIndex >= 0 ? messages.slice(0, cutIndex + 1) : messages;

    try {
      const title = forkedMessages[0]?.content?.slice(0, 50) || 'Forked Chat';
      const workspace = await createWorkspace(title);
      await updateWorkspace(workspace._id, {
        name: title,
        messages: toWorkspaceMessages(forkedMessages),
        fileData: workbenchStore.files.get(),
        history: [],
      });
      const workspaces = await listWorkspaces();
      const chats = workspaces.map((ws) => ({
        id: ws._id,
        title: ws.name || 'Untitled Chat',
        lastMessage: ws.messages?.[ws.messages.length - 1]?.content?.slice(0, 100) || '',
        summary:
          [...(ws.messages || [])]
            .reverse()
            .find((m) => m.role === 'assistant' && m.content?.trim())
            ?.content?.slice(0, 140) || '',
        timestamp: ws.updatedAt || ws.createdAt || new Date().toISOString(),
      })) as ChatMetadata[];
      set({ chats, chatId: workspace._id, messages: forkedMessages, chatStarted: true, error: null });
    } catch (error) {
      console.error('Failed to fork chat:', error);
      set({ error: formatWorkspaceError(error, 'Failed to fork chat. Please try again.') });
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
      if (chatId) {
        await updateWorkspace(chatId, {
          name: title,
          messages: toWorkspaceMessages(newMessages),
          fileData: workbenchStore.files.get(),
          history: [],
        });
      }
      const workspaces = await listWorkspaces();
      const chats = workspaces.map((workspace) => ({
        id: workspace._id,
        title: workspace.name || 'Untitled Chat',
        lastMessage: workspace.messages?.[workspace.messages.length - 1]?.content?.slice(0, 100) || '',
        summary:
          [...(workspace.messages || [])]
            .reverse()
            .find((m) => m.role === 'assistant' && m.content?.trim())
            ?.content?.slice(0, 140) || '',
        timestamp: workspace.updatedAt || workspace.createdAt || new Date().toISOString(),
      })) as ChatMetadata[];
      set({ chats, error: null });
    } catch (error) {
      console.error('Failed to rewind chat:', error);
      set({ error: formatWorkspaceError(error, 'Failed to rewind chat. Please try again.') });
    }
  },

  restoreLatestSnapshot: async () => {
    const { chatId } = get();
    if (!chatId) return;
    try {
      const workspace = await getWorkspace(chatId);
      if (workspace.fileData) {
        await workbenchStore.clearProject();
        await restoreSnapshot({
          chatId,
          messageId: '',
          files: workspace.fileData as any,
          timestamp: Date.now(),
        });
      }
      set({ error: null });
    } catch (error) {
      console.error('Failed to restore workspace snapshot:', error);
      set({ error: formatWorkspaceError(error, 'Failed to restore project files.') });
    }
  },
}));

export default useChatStore;
