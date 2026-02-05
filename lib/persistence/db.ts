export const DB_NAME = 'bolt_chat_db';
export const STORE_NAME = 'chats';

export interface ChatMetadata {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string; // ISO string
}

export interface ChatSession extends ChatMetadata {
  messages: any[]; // Storing full message history
}

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllChats = async (): Promise<ChatMetadata[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Return only metadata, messages might be large so we might want to separate them later
      // For now, we return everything but map it to metadata
      const sessions = request.result as ChatSession[];
      const metadata = sessions.map(({ id, title, lastMessage, timestamp }) => ({
        id,
        title,
        lastMessage,
        timestamp,
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      resolve(metadata);
    };
  });
};

export const getChat = async (id: string): Promise<ChatSession | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const saveChat = async (chat: ChatSession): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(chat);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const deleteChat = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
