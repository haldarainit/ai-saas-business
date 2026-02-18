// Jotai Atoms for AI App Builder State Management
import { atom } from 'jotai';

// Chat and generation state
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface SandboxState {
  id: string | null;
  url: string | null;
  status: 'idle' | 'creating' | 'running' | 'error';
}

// Atoms
export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const generatedFilesAtom = atom<GeneratedFile[]>([]);
export const selectedFileAtom = atom<string>('');
export const isGeneratingAtom = atom(false);
export const selectedModelAtom = atom('google/gemini-2.5-flash-preview');
export const sandboxStateAtom = atom<SandboxState>({
  id: null,
  url: null,
  status: 'idle',
});

// Target website for cloning
export const targetUrlAtom = atom<string>('');
export const websiteContentAtom = atom<string>('');
export const screenshotAtom = atom<string | null>(null);

// UI state
export const activeTabAtom = atom<'code' | 'preview'>('preview');
export const showModelSelectorAtom = atom(false);

// Derived atoms
export const hasMessagesAtom = atom((get) => get(chatMessagesAtom).length > 0);
export const hasGeneratedCodeAtom = atom((get) => get(generatedFilesAtom).length > 0);

// Actions
export const addMessageAtom = atom(
  null,
  (get, set, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const messages = get(chatMessagesAtom);
    set(chatMessagesAtom, [
      ...messages,
      {
        ...message,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
      },
    ]);
  }
);

export const clearChatAtom = atom(
  null,
  (_get, set) => {
    set(chatMessagesAtom, []);
    set(generatedFilesAtom, []);
    set(selectedFileAtom, '');
  }
);
