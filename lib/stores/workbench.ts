// Workbench Store - Manages the entire workbench state with WebContainer integration
// Modeled after bolt.diy's workbench store

import { create } from 'zustand';
import { WebContainer } from '@webcontainer/api';
import { getWebContainer, isWebContainerReady, WORK_DIR } from '@/lib/webcontainer';
import { ActionRunner } from '@/lib/runtime/action-runner';
import { StreamingMessageParser, ActionCallbackData, ArtifactCallbackData } from '@/lib/runtime/message-parser';

export interface FileContent {
  type: 'file';
  content: string;
  isBinary?: boolean;
}

export interface FolderContent {
  type: 'folder';
}

export type FileSystemItem = FileContent | FolderContent;
export type FileMap = Record<string, FileSystemItem | undefined>;

export interface PreviewInfo {
  port: number;
  url: string;
  ready: boolean;
}

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner?: ActionRunner;
}

export type WorkbenchViewType = 'code' | 'preview' | 'diff';

export interface TerminalOutput {
  id: string;
  content: string;
  type: 'stdout' | 'stderr' | 'command';
}

interface WorkbenchState {
  // WebContainer state
  webcontainerReady: boolean;
  webcontainerError: string | null;
  
  // Files
  files: FileMap;
  selectedFile: string | null;
  openFiles: string[];
  unsavedFiles: Set<string>;
  expandedFolders: Set<string>;
  
  // Views
  showWorkbench: boolean;
  currentView: WorkbenchViewType;
  showTerminal: boolean;
  showChat: boolean;
  
  // Preview
  previews: PreviewInfo[];
  activePreviewIndex: number;
  
  // Artifacts
  artifacts: Record<string, ArtifactState>;
  
  // Terminal
  terminalOutput: TerminalOutput[];
  
  // Message Parser
  messageParser: StreamingMessageParser | null;
  currentArtifact: ArtifactState | null;
  
  // Actions
  initWebContainer: () => Promise<WebContainer | null>;
  setFiles: (files: FileMap) => void;
  addFile: (path: string, content: string, type?: 'file' | 'folder') => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  selectFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  saveFile: (path: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  toggleFolder: (path: string) => void;
  
  // Views
  setShowWorkbench: (show: boolean) => void;
  setCurrentView: (view: WorkbenchViewType) => void;
  setShowTerminal: (show: boolean) => void;
  setShowChat: (show: boolean) => void;
  
  // Preview
  addPreview: (preview: Omit<PreviewInfo, 'ready'> & { ready?: boolean }) => void;
  removePreview: (port: number) => void;
  setActivePreview: (index: number) => void;
  
  // Artifacts & Actions
  addArtifact: (data: ArtifactCallbackData) => void;
  closeArtifact: (id: string) => void;
  runAction: (data: ActionCallbackData, isStreaming?: boolean) => Promise<void>;
  
  // Terminal
  addTerminalOutput: (output: TerminalOutput) => void;
  clearTerminal: () => void;
  runCommand: (command: string) => Promise<void>;
  
  // Message parsing
  parseMessage: (messageId: string, content: string) => string;
  
  // Reset
  reset: () => void;
}

// Store for WebContainer instance
let webcontainerInstance: WebContainer | null = null;
let actionRunner: ActionRunner | null = null;

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  // Initial state
  webcontainerReady: false,
  webcontainerError: null,
  
  files: {},
  selectedFile: null,
  openFiles: [],
  unsavedFiles: new Set(),
  expandedFolders: new Set(),
  
  showWorkbench: false,
  currentView: 'code',
  showTerminal: false,
  showChat: true,
  
  previews: [],
  activePreviewIndex: 0,
  
  artifacts: {},
  
  terminalOutput: [],
  
  messageParser: null,
  currentArtifact: null,
  
  // Initialize WebContainer
  initWebContainer: async () => {
    try {
      set({ webcontainerError: null });
      
      const wc = await getWebContainer();
      webcontainerInstance = wc;
      
      // Create action runner
      actionRunner = new ActionRunner(Promise.resolve(wc));
      
      // Create message parser with callbacks
      const parser = new StreamingMessageParser({
        onArtifactOpen: (data) => {
          console.log('[Parser] Artifact opened:', data);
          const artifact: ArtifactState = {
            id: data.id,
            title: data.title,
            type: data.type,
            closed: false,
            runner: actionRunner || undefined,
          };
          set((state) => ({
            artifacts: { ...state.artifacts, [data.id]: artifact },
            currentArtifact: artifact,
            showWorkbench: true,
          }));
        },
        onArtifactClose: (data) => {
          console.log('[Parser] Artifact closed:', data);
          set((state) => ({
            artifacts: {
              ...state.artifacts,
              [data.id]: { ...state.artifacts[data.id], closed: true },
            },
            currentArtifact: null,
          }));
        },
        onActionOpen: (data) => {
          console.log('[Parser] Action opened:', data);
          if (actionRunner) {
            actionRunner.addAction(data);
          }
        },
        onActionStream: (data) => {
          // Stream file content updates
          if (data.action.type === 'file') {
            const filePath = data.action.filePath.startsWith('/') 
              ? data.action.filePath 
              : `${WORK_DIR}/${data.action.filePath}`;
            
            set((state) => ({
              files: {
                ...state.files,
                [filePath]: { type: 'file', content: data.action.content },
              },
              selectedFile: filePath,
            }));
            
            // Open the file in editor
            get().openFile(filePath);
          }
        },
        onActionClose: async (data) => {
          console.log('[Parser] Action closed:', data);
          
          // Execute the action
          if (actionRunner) {
            await actionRunner.runAction(data, false);
          }
          
          // Update file in store
          if (data.action.type === 'file') {
            const filePath = data.action.filePath.startsWith('/') 
              ? data.action.filePath 
              : `${WORK_DIR}/${data.action.filePath}`;
            
            set((state) => ({
              files: {
                ...state.files,
                [filePath]: { type: 'file', content: data.action.content },
              },
            }));
          }
        },
      });
      
      set({ 
        webcontainerReady: true,
        messageParser: parser,
      });
      
      // Listen for preview server
      wc.on('server-ready', (port, url) => {
        console.log('[WebContainer] Server ready on port:', port, url);
        get().addPreview({ port, url, ready: true });
      });
      
      // Listen for errors
      wc.on('error', (error) => {
        console.error('[WebContainer] Error:', error);
        set({ webcontainerError: error.message });
      });
      
      console.log('[Workbench] WebContainer initialized successfully');
      return wc;
      
    } catch (error: any) {
      console.error('[Workbench] Failed to initialize WebContainer:', error);
      set({ 
        webcontainerReady: false, 
        webcontainerError: error.message || 'Failed to initialize WebContainer',
      });
      return null;
    }
  },
  
  // File operations
  setFiles: (files) => set({ files }),
  
  addFile: (path, content, type = 'file') => {
    set((state) => ({
      files: {
        ...state.files,
        [path]: type === 'file' 
          ? { type: 'file', content } 
          : { type: 'folder' },
      },
    }));
  },
  
  updateFile: (path, content) => {
    set((state) => {
      const newUnsavedFiles = new Set(state.unsavedFiles);
      newUnsavedFiles.add(path);
      
      return {
        files: {
          ...state.files,
          [path]: { type: 'file', content },
        },
        unsavedFiles: newUnsavedFiles,
      };
    });
  },
  
  deleteFile: (path) => {
    set((state) => {
      const newFiles = { ...state.files };
      delete newFiles[path];
      
      const newOpenFiles = state.openFiles.filter(f => f !== path);
      const newSelectedFile = state.selectedFile === path 
        ? newOpenFiles[0] || null 
        : state.selectedFile;
      
      return {
        files: newFiles,
        openFiles: newOpenFiles,
        selectedFile: newSelectedFile,
      };
    });
    
    // Also delete from WebContainer
    if (webcontainerInstance) {
      const relativePath = path.replace(`${WORK_DIR}/`, '');
      webcontainerInstance.fs.rm(relativePath, { force: true }).catch(console.error);
    }
  },
  
  selectFile: (path) => set({ selectedFile: path }),
  
  openFile: (path) => {
    set((state) => {
      if (state.openFiles.includes(path)) {
        return { selectedFile: path };
      }
      return {
        openFiles: [...state.openFiles, path],
        selectedFile: path,
      };
    });
  },
  
  closeFile: (path) => {
    set((state) => {
      const newOpenFiles = state.openFiles.filter(f => f !== path);
      const newSelectedFile = state.selectedFile === path
        ? newOpenFiles[newOpenFiles.length - 1] || null
        : state.selectedFile;
      
      return {
        openFiles: newOpenFiles,
        selectedFile: newSelectedFile,
      };
    });
  },
  
  saveFile: async (path) => {
    if (!webcontainerInstance) return;
    
    const state = get();
    const file = state.files[path];
    
    if (file?.type !== 'file') return;
    
    try {
      const relativePath = path.replace(`${WORK_DIR}/`, '');
      await webcontainerInstance.fs.writeFile(relativePath, file.content);
      
      set((state) => {
        const newUnsavedFiles = new Set(state.unsavedFiles);
        newUnsavedFiles.delete(path);
        return { unsavedFiles: newUnsavedFiles };
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  },
  
  saveAllFiles: async () => {
    const state = get();
    for (const path of state.unsavedFiles) {
      await get().saveFile(path);
    }
  },
  
  toggleFolder: (path) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    });
  },
  
  // View controls
  setShowWorkbench: (show) => set({ showWorkbench: show }),
  setCurrentView: (view) => set({ currentView: view }),
  setShowTerminal: (show) => set({ showTerminal: show }),
  setShowChat: (show) => set({ showChat: show }),
  
  // Preview
  addPreview: (preview) => {
    set((state) => {
      const existing = state.previews.find(p => p.port === preview.port);
      if (existing) {
        return {
          previews: state.previews.map(p => 
            p.port === preview.port 
              ? { ...p, ...preview, ready: preview.ready ?? true }
              : p
          ),
        };
      }
      return {
        previews: [...state.previews, { ...preview, ready: preview.ready ?? true }],
      };
    });
  },
  
  removePreview: (port) => {
    set((state) => ({
      previews: state.previews.filter(p => p.port !== port),
    }));
  },
  
  setActivePreview: (index) => set({ activePreviewIndex: index }),
  
  // Artifacts & Actions
  addArtifact: (data) => {
    const artifact: ArtifactState = {
      id: data.id,
      title: data.title,
      type: data.type,
      closed: false,
      runner: actionRunner || undefined,
    };
    
    set((state) => ({
      artifacts: { ...state.artifacts, [data.id]: artifact },
    }));
  },
  
  closeArtifact: (id) => {
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        [id]: { ...state.artifacts[id], closed: true },
      },
    }));
  },
  
  runAction: async (data, isStreaming = false) => {
    if (actionRunner) {
      await actionRunner.runAction(data, isStreaming);
    }
  },
  
  // Terminal
  addTerminalOutput: (output) => {
    set((state) => ({
      terminalOutput: [...state.terminalOutput, output],
    }));
  },
  
  clearTerminal: () => set({ terminalOutput: [] }),
  
  runCommand: async (command) => {
    if (!webcontainerInstance) {
      get().addTerminalOutput({
        id: Date.now().toString(),
        content: 'WebContainer not initialized',
        type: 'stderr',
      });
      return;
    }
    
    get().addTerminalOutput({
      id: Date.now().toString(),
      content: `$ ${command}`,
      type: 'command',
    });
    
    try {
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      
      const process = await webcontainerInstance.spawn(cmd, args);
      
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            get().addTerminalOutput({
              id: Date.now().toString(),
              content: data,
              type: 'stdout',
            });
          },
        })
      );
      
      await process.exit;
    } catch (error: any) {
      get().addTerminalOutput({
        id: Date.now().toString(),
        content: error.message,
        type: 'stderr',
      });
    }
  },
  
  // Message parsing
  parseMessage: (messageId, content) => {
    const parser = get().messageParser;
    if (!parser) {
      return content;
    }
    return parser.parse(messageId, content);
  },
  
  // Reset
  reset: () => {
    set({
      files: {},
      selectedFile: null,
      openFiles: [],
      unsavedFiles: new Set(),
      showWorkbench: false,
      currentView: 'code',
      showTerminal: false,
      previews: [],
      activePreviewIndex: 0,
      artifacts: {},
      terminalOutput: [],
      currentArtifact: null,
    });
  },
}));
