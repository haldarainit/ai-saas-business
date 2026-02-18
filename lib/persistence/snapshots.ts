import type { FileMap } from '@/lib/stores/files';
import { workbenchStore } from '@/lib/stores/workbench';
import { WORK_DIR } from '@/utils/constants';

const SNAPSHOT_PREFIX = 'builder.snapshot';

export interface ChatSnapshot {
  chatId: string;
  messageId: string;
  files: FileMap;
  timestamp: number;
}

export function saveSnapshot(chatId: string, messageId: string, files: FileMap) {
  if (typeof window === 'undefined') return;
  const snapshot: ChatSnapshot = {
    chatId,
    messageId,
    files,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(`${SNAPSHOT_PREFIX}:${chatId}`, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Failed to save snapshot:', error);
  }
}

export function getSnapshot(chatId: string): ChatSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}:${chatId}`);
    return raw ? (JSON.parse(raw) as ChatSnapshot) : null;
  } catch (error) {
    console.error('Failed to load snapshot:', error);
    return null;
  }
}

export async function restoreSnapshot(snapshot: ChatSnapshot) {
  const entries = Object.entries(snapshot.files || {});

  // Create folders first
  for (const [path, file] of entries) {
    if (file?.type === 'folder') {
      await workbenchStore.addFile(path, '', 'folder');
    }
  }

  for (const [path, file] of entries) {
    if (file?.type !== 'file') continue;
    const content = file.isBinary ? file.content : file.content ?? '';
    await workbenchStore.addFile(path, content, 'file');
  }
}

export function clearSnapshot(chatId: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${SNAPSHOT_PREFIX}:${chatId}`);
}

