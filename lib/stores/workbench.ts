import { atom, map, computed, type MapStore, type ReadableAtom, type WritableAtom } from 'nanostores';
import { useStore } from '@nanostores/react';
import type { EditorDocument, ScrollPosition } from '@/components/editor/codemirror/CodeMirrorEditor';
import { ActionRunner } from '@/lib/runtime/action-runner';
import { StreamingMessageParser, type ActionCallbackData, type ArtifactCallbackData } from '@/lib/runtime/message-parser';
import { webcontainer } from '@/lib/webcontainer';
import type { BoltAction, DeployAlert } from '@/types/actions';
import type { BoltArtifactData } from '@/types/artifact';
import { FilesStore, type FileMap } from './files';
import { PreviewsStore } from './previews';
import { TerminalStore } from './terminal';
import { EditorStore } from './editor';
import { unreachable } from '@/utils/unreachable';
import { path } from '@/utils/path';

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner;
}

export type Artifacts = MapStore<Record<string, ArtifactState>>;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface Device {
  name: string;
  type: DeviceType;
  width: number;
  height: number;
  hasFrame?: boolean;
}

export const DEVICES: Device[] = [
  { name: 'Responsive', type: 'desktop', width: 0, height: 0, hasFrame: false },
  { name: 'iPhone 14 Pro', type: 'mobile', width: 393, height: 852, hasFrame: true },
  { name: 'iPhone SE', type: 'mobile', width: 375, height: 667, hasFrame: true },
  { name: 'Pixel 7', type: 'mobile', width: 412, height: 915, hasFrame: true },
  { name: 'iPad Mini', type: 'tablet', width: 768, height: 1024, hasFrame: true },
  { name: 'iPad Pro 11"', type: 'tablet', width: 834, height: 1194, hasFrame: true },
  { name: 'Desktop', type: 'desktop', width: 1440, height: 900, hasFrame: false },
];

export type WorkbenchViewType = 'code' | 'preview';

export class WorkbenchStore {
  #previewsStore = new PreviewsStore(webcontainer);
  #filesStore = new FilesStore(webcontainer);
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore(webcontainer);

  #messageParser = new StreamingMessageParser({
    callbacks: {
      onArtifactOpen: (data) => {
        console.log('[MessageParser] Artifact opened:', data);
        this.addToArtifact(data.artifactId!, data);
        this.showWorkbench.set(true);
      },
      onActionOpen: (data) => {
        console.log('[MessageParser] Action opened:', data);
        this.addAction(data);
      },
      onActionStream: (data) => {
        // Immediately update files store when streaming file content
        if (data.action.type === 'file') {
          const filePath = data.action.filePath.startsWith('/') 
            ? data.action.filePath 
            : `/home/project/${data.action.filePath}`;
          
          console.log('[MessageParser] Streaming file:', filePath);
          
          // Update the files store immediately for display
          this.#filesStore.files.setKey(filePath, {
            type: 'file',
            content: data.action.content || '',
            isBinary: false,
          });
          
          // Set as the currently generating file
          this.generatedFile.set(filePath);
          
          // Auto-expand parent folders
          this.#autoExpandFolders(filePath);
          
          // Ensure parent folders exist in the store (critical for FileTree)
          this.#ensureFoldersExist(filePath);
          
          // Select and open the file in editor
          this.setSelectedFile(filePath);
        }
        
        // Also run the action for streaming updates
        this.runAction(data, true);
      },
      onActionClose: (data) => {
        console.log('[MessageParser] Action closed:', data);
        
        // Final update for file actions
        if (data.action.type === 'file') {
          const filePath = data.action.filePath.startsWith('/') 
            ? data.action.filePath 
            : `/home/project/${data.action.filePath}`;
          
          // Ensure parent folders exist in the store
          this.#ensureFoldersExist(filePath);
          
          // Update the files store with final content
          this.#filesStore.files.setKey(filePath, {
            type: 'file',
            content: data.action.content || '',
            isBinary: false,
          });
          
          // Clear the generating file indicator
          this.generatedFile.set(null);
        }
        
        // Run the action (writes to WebContainer)
        this.runAction(data);
      },
    },
  });

  /**
   * Boolean that indicates if the workbench is visible or not.
   */
  showWorkbench: WritableAtom<boolean> = atom(false);

  /**
   * Boolean that indicates if the chat is visible or not.
   */
  showChat: WritableAtom<boolean> = atom(true);

  /**
   * Boolean that indicates if the WebContainer is ready.
   */
  webcontainerReady: WritableAtom<boolean> = atom(false);

  /**
   * Error message if WebContainer fails to initialize.
   */
  webcontainerError: WritableAtom<string | undefined> = atom(undefined);

  /**
   * The current view of the workbench.
   */
  currentView: WritableAtom<WorkbenchViewType> = atom('code');

  /**
   * The list of artifacts that have been created in the current chat.
   */
  artifacts: Artifacts = map({});

  /**
   * A list of all files with unsaved changes.
   */
  unsavedFiles: WritableAtom<Set<string>> = atom(new Set<string>());

  /**
   * Set of expanded folder paths in the file tree.
   */
  expandedFolders: WritableAtom<Set<string>> = atom(new Set<string>());

  /**
   * Currently being generated file path.
   */
  generatedFile: WritableAtom<string | null> = atom<string | null>(null);

  /**
   * Whether the AI is currently streaming a response.
   */
  isStreaming: WritableAtom<boolean> = atom(false);

  /**
   * Action alert to display errors or information.
   */
  actionAlert: WritableAtom<{
    type: string;
    title: string;
    description: string;
    content: string;
    source?: 'terminal' | 'preview';
  } | undefined> = atom(undefined);

  /**
   * Supabase alert.
   */
  supabaseAlert: WritableAtom<{
    type: string;
    title: string;
    description: string;
    content: string;
    source?: 'supabase';
  } | undefined> = atom(undefined);

  /**
   * Deploy alert.
   */
  deployAlert: WritableAtom<DeployAlert | undefined> = atom(undefined);

  /**
   * Preview State
   */
  previewUrl: WritableAtom<string> = atom('');
  previewDevice: WritableAtom<Device> = atom(DEVICES[0]);
  previewShowFrame: WritableAtom<boolean> = atom(false);
  previewIsLandscape: WritableAtom<boolean> = atom(false);
  previewScale: WritableAtom<number> = atom(1);

  constructor() {}

  /**
   * Auto-expand all parent folders for a given file path
   */
  #autoExpandFolders(filePath: string) {
    const parts = filePath.split('/').filter(Boolean);
    const newExpandedFolders = new Set(this.expandedFolders.get());
    
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += '/' + parts[i];
      newExpandedFolders.add(currentPath);
    }
    
    this.expandedFolders.set(newExpandedFolders);
  }

  /**
   * Ensure all parent folders exist in the files store
   */
  #ensureFoldersExist(filePath: string) {
    const parts = filePath.split('/').filter(Boolean);
    let currentPath = '';
    
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += '/' + parts[i];
      
      // Add folder to store if it doesn't exist
      if (!this.#filesStore.files.get()[currentPath]) {
        this.#filesStore.files.setKey(currentPath, { type: 'folder' });
      }
    }
  }

  get previewsStore() {
    return this.#previewsStore;
  }

  get filesStore() {
    return this.#filesStore;
  }

  get terminalStore() {
    return this.#terminalStore;
  }

  get editorStore() {
    return this.#editorStore;
  }

  get previews() {
    return computed(this.#previewsStore.previews, (previews) => 
      previews.map(p => ({ ...p, url: p.baseUrl }))
    );
  }

  get files() {
    return this.#filesStore.files;
  }

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  get boltTerminal() {
    return this.#terminalStore.boltTerminal;
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  async initWebContainer() {
    try {
      const wc = await webcontainer;
      this.webcontainerReady.set(true);
      return wc;
    } catch (error: any) {
      this.webcontainerError.set(error.message);
      throw error;
    }
  }

  parseMessage(messageId: string, content: string) {
    return this.#messageParser.parse(messageId, content);
  }

  async addToArtifact(id: string, data: ArtifactCallbackData) {
    const artifacts = this.artifacts.get();
    const artifact = artifacts[id];

    if (!artifact) {
      const runner = new ActionRunner(
        webcontainer,
        () => this.boltTerminal,
        (alert) => this.actionAlert.set(alert),
        (alert) => this.supabaseAlert.set(alert),
        (alert) => this.deployAlert.set(alert),
      );

      this.artifacts.setKey(id, {
        id,
        title: data.title,
        type: data.type,
        closed: false,
        runner,
      });
    }
  }

  async addAction(data: ActionCallbackData) {
    const artifacts = this.artifacts.get();
    const artifact = artifacts[data.artifactId];

    if (!artifact) {
      unreachable('Artifact not found');
    }

    artifact.runner.addAction(data);
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const artifacts = this.artifacts.get();
    const artifact = artifacts[data.artifactId];

    if (!artifact) {
      unreachable('Artifact not found');
    }

    await artifact.runner.runAction(data, isStreaming);
  }

  setDocuments(files: FileMap) {
    this.#editorStore.setDocuments(files);

    if (this.#filesStore.filesCount > 0 && this.currentDocument.get() === undefined) {
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  async saveFile(filePath: string) {
    const documents = this.#editorStore.documents.get();
    const document = documents[filePath];

    if (document === undefined) {
      return;
    }

    await this.#filesStore.saveFile(filePath, document.value);

    const newUnsavedFiles = new Set(this.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);

    this.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    await this.saveFile(currentDocument.filePath);
  }

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.currentDocument.get()?.filePath;

    if (!filePath) {
      return;
    }

    const originalContent = this.#filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#editorStore.updateFile(filePath, newContent);

    const currentDocument = this.currentDocument.get();

    if (currentDocument) {
      const previousUnsavedFiles = this.unsavedFiles.get();

      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.unsavedFiles.set(newUnsavedFiles);
    }
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.currentDocument.get();

    if (!editorDocument) {
      return;
    }

    const { filePath } = editorDocument;

    this.#editorStore.updateScrollPosition(filePath, position);
  }

  setSelectedFile(filePath: string | undefined) {
    if (filePath) {
      const documents = this.#editorStore.documents.get();
      const file = this.#filesStore.getFile(filePath);
      
      // If file exists in filesStore but not in documents, create a document entry
      if (file && !documents[filePath]) {
        this.#editorStore.documents.setKey(filePath, {
          filePath,
          value: file.content,
          isBinary: file.isBinary,
          scroll: { left: 0, top: 0 },
        });
      }
    }
    
    this.#editorStore.setSelectedFile(filePath);
  }

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  setShowChat(show: boolean) {
    this.showChat.set(show);
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  getFileModifcations() {
    return this.#filesStore.getFileModifications();
  }

  getModifiedFiles() {
    return this.#filesStore.getModifiedFiles();
  }

  resetAllFileModifications() {
    this.#filesStore.resetFileModifications();
  }

  toggleFolder(path: string) {
    const expandedFolders = new Set(this.expandedFolders.get());
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    this.expandedFolders.set(expandedFolders);
  }

  collapseAllFolders() {
    this.expandedFolders.set(new Set());
  }

  async addFile(path: string, content: string | Uint8Array = '', type: 'file' | 'folder' = 'file') {
    try {
      const wc = await webcontainer;
      
      if (type === 'folder') {
        await wc.fs.mkdir(path, { recursive: true });
        this.#filesStore.files.setKey(path, { type: 'folder' });
      } else {
        // Ensure parent directory exists
        const parentDir = path.split('/').slice(0, -1).join('/');
        if (parentDir) {
          await wc.fs.mkdir(parentDir, { recursive: true });
        }
        await wc.fs.writeFile(path, content);
        
        // Update store
        const isBinary = content instanceof Uint8Array;
        const storeContent = isBinary ? '' : (content as string);
        this.#filesStore.files.setKey(path, { type: 'file', content: storeContent, isBinary });
      }
      
      // Auto-expand parent folders
      const parts = path.split('/').filter(Boolean);
      let currentPath = '';
      const newExpandedFolders = new Set(this.expandedFolders.get());
      
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += '/' + parts[i];
        newExpandedFolders.add(currentPath);
      }
      
      this.expandedFolders.set(newExpandedFolders);
    } catch (error) {
      console.error('Failed to add file:', error);
    }
  }

  async deleteFile(path: string) {
    try {
      const wc = await webcontainer;
      await wc.fs.rm(path, { force: true, recursive: true });
      this.#filesStore.files.setKey(path, undefined);
      
      // If this was the selected file, clear the selection
      if (this.#editorStore.selectedFile.get() === path) {
        this.#editorStore.setSelectedFile(undefined);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  stopGeneration() {
    this.isStreaming.set(false);
    this.generatedFile.set(null);
    
    // Stop all action runners
    const artifacts = this.artifacts.get();
    for (const artifact of Object.values(artifacts)) {
      artifact.runner.cancelAll();
    }
  }

  reset() {
    this.artifacts.set({});
    this.showWorkbench.set(false);
    this.showChat.set(true);
    this.currentView.set('code');
    this.webcontainerReady.set(false);
    this.webcontainerError.set(undefined);
    this.actionAlert.set(undefined);
    this.supabaseAlert.set(undefined);
    this.deployAlert.set(undefined);
    this.unsavedFiles.set(new Set());
    this.expandedFolders.set(new Set());
    this.generatedFile.set(null);
    this.isStreaming.set(false);
    this.#messageParser.reset();
    
    // Reset preview state
    this.previewUrl.set('');
    this.previewDevice.set(DEVICES[0]);
    this.previewShowFrame.set(false);
    this.previewIsLandscape.set(false);
    this.previewScale.set(1);
  }
}

export const workbenchStore = new WorkbenchStore();

export function useWorkbenchStore() {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const showChat = useStore(workbenchStore.showChat);
  const webcontainerReady = useStore(workbenchStore.webcontainerReady);
  const webcontainerError = useStore(workbenchStore.webcontainerError);
  const previews = useStore(workbenchStore.previews);
  const files = useStore(workbenchStore.files);
  const currentView = useStore(workbenchStore.currentView);
  const showTerminal = useStore(workbenchStore.terminalStore.showTerminal);
  const expandedFolders = useStore(workbenchStore.expandedFolders);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const generatedFile = useStore(workbenchStore.generatedFile);
  const isStreaming = useStore(workbenchStore.isStreaming);
  const previewUrl = useStore(workbenchStore.previewUrl);
  const previewDevice = useStore(workbenchStore.previewDevice);
  const previewShowFrame = useStore(workbenchStore.previewShowFrame);
  const previewIsLandscape = useStore(workbenchStore.previewIsLandscape);
  const previewScale = useStore(workbenchStore.previewScale);

  return {
    showWorkbench,
    setShowWorkbench: (show: boolean) => workbenchStore.setShowWorkbench(show),
    showChat,
    setShowChat: (show: boolean) => workbenchStore.setShowChat(show),
    webcontainerReady,
    webcontainerError,
    isStreaming,
    setIsStreaming: (streaming: boolean) => workbenchStore.isStreaming.set(streaming),
    stopGeneration: () => workbenchStore.stopGeneration(),
    initWebContainer: () => workbenchStore.initWebContainer(),
    parseMessage: (messageId: string, content: string) => workbenchStore.parseMessage(messageId, content),
    previews,
    files,
    reset: () => workbenchStore.reset(),
    currentView,
    setCurrentView: (view: WorkbenchViewType) => workbenchStore.currentView.set(view),
    showTerminal,
    setShowTerminal: (show: boolean) => workbenchStore.terminalStore.toggleTerminal(show),
    setSelectedFile: (path: string | undefined) => workbenchStore.setSelectedFile(path),
    artifacts: useStore(workbenchStore.artifacts),
    selectedFile: useStore(workbenchStore.selectedFile),
    currentDocument: useStore(workbenchStore.currentDocument),
    terminalStore: workbenchStore.terminalStore,
    editorStore: workbenchStore.editorStore,
    filesStore: workbenchStore.filesStore,
    // FileTree required methods and state
    expandedFolders,
    unsavedFiles,
    generatedFile,
    toggleFolder: (path: string) => workbenchStore.toggleFolder(path),
    collapseAllFolders: () => workbenchStore.collapseAllFolders(),
    addFile: (path: string, content?: string | Uint8Array, type?: 'file' | 'folder') => workbenchStore.addFile(path, content, type),
    deleteFile: (path: string) => workbenchStore.deleteFile(path),
    selectFile: (path: string | undefined) => workbenchStore.setSelectedFile(path),
    // EditorPanel required methods
    updateFile: (path: string, content: string) => {
      // Update the file in filesStore
      const file = workbenchStore.filesStore.getFile(path);
      if (file) {
        workbenchStore.filesStore.files.setKey(path, { ...file, content });
        // Also update in editorStore documents
        workbenchStore.editorStore.updateFile(path, content);
        // Mark as unsaved
        const newUnsavedFiles = new Set(workbenchStore.unsavedFiles.get());
        newUnsavedFiles.add(path);
        workbenchStore.unsavedFiles.set(newUnsavedFiles);
      }
    },
    saveFile: async (path: string) => {
      await workbenchStore.saveFile(path);
    },
    fileHistory: null, // File history not implemented yet
    // Preview Exports
    previewUrl,
    setPreviewUrl: (url: string) => workbenchStore.previewUrl.set(url),
    previewDevice,
    setPreviewDevice: (device: Device) => workbenchStore.previewDevice.set(device),
    previewShowFrame,
    setPreviewShowFrame: (show: boolean) => workbenchStore.previewShowFrame.set(show),
    previewIsLandscape,
    setPreviewIsLandscape: (landscape: boolean) => workbenchStore.previewIsLandscape.set(landscape),
    previewScale,
    setPreviewScale: (scale: number) => workbenchStore.previewScale.set(scale),
  };
}
