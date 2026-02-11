'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  Image,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Loader2,
  Search,
  ListMinus, 
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

interface FileTreeNodeProps {
  name: string;
  path: string;
  type: 'file' | 'folder';
  depth: number;
  children?: TreeNode[];
}

function FileTreeNode({ name, path: filePath, type, depth, children }: FileTreeNodeProps) {
  const { 
    selectedFile, 
    selectFile, 
    deleteFile, 
    generatedFile, 
    expandedFolders, 
    toggleFolder,
    unsavedFiles 
  } = useWorkbenchStore();
  
  const isSelected = selectedFile === filePath;
  const isExpanded = expandedFolders.has(filePath);
  const isUnsaved = unsavedFiles.has(filePath);
  const isGenerating = generatedFile === filePath;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'folder') {
      toggleFolder(filePath);
    } else {
      selectFile(filePath);
    }
  };

  const getIcon = () => {
    if (type === 'folder') {
      return isExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />;
    }
    
    // File icons based on extension
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-green-400" />;
      case 'css':
      case 'scss':
        return <FileCode className="w-4 h-4 text-blue-300" />;
      case 'md':
        return <FileText className="w-4 h-4 text-slate-300" />;
      case 'png':
      case 'jpg': 
      case 'jpeg':
      case 'svg':
      case 'webp':
        return <Image className="w-4 h-4 text-purple-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div>
      <div 
        className={`
          flex items-center gap-1.5 py-1 px-2 cursor-pointer select-none transition-colors
          ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
        `}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        onClick={handleSelect}
      >
        <div className="shrink-0 flex items-center justify-center w-4 h-4">
          {type === 'folder' && (
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.1 }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </motion.div>
          )}
        </div>
        
        {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
        ) : (
            getIcon()
        )}
        
        <span className="truncate text-sm flex-1">{name}</span>
        
        {/* Unsaved indicator */}
        {isUnsaved && !isSelected && (
           <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
        )}
        
        {/* Hover Actions (e.g. Delete) */}
        <div className="opacity-0 hover:opacity-100 group-hover:opacity-100 flex items-center">
            {/* We could add delete button here if needed via group-hover on parent */}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children.map(child => (
              <FileTreeNode
                key={child.path}
                name={child.name}
                path={child.path}
                type={child.type}
                depth={depth + 1}
                children={child.children}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileTree() {
  const { files, addFile, collapseAllFolders } = useWorkbenchStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Build tree structure from flat files
  const tree = useMemo(() => {
    const root: TreeNode[] = [];
    const pathMap: Record<string, TreeNode> = {};

    // Prefix to strip so the tree shows project contents at root level
    const STRIP_PREFIX = '/home/project';

    // Sort files by path
    const sortedPaths = Object.keys(files).sort((a, b) => {
      const aDepth = a.split('/').length;
      const bDepth = b.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      return a.localeCompare(b);
    });

    sortedPaths.forEach((fullPath) => {
      const file = files[fullPath];
      if (!file) return;

      // Skip the /home and /home/project folder entries themselves
      if (fullPath === '/home' || fullPath === '/home/project') {
        return;
      }

      // Strip the /home/project prefix for display purposes
      let displayPath = fullPath;
      if (displayPath.startsWith(STRIP_PREFIX + '/')) {
        displayPath = displayPath.substring(STRIP_PREFIX.length);
      } else if (displayPath.startsWith(STRIP_PREFIX)) {
        displayPath = displayPath.substring(STRIP_PREFIX.length);
      }

      // displayPath now looks like "/src/App.tsx" or "/package.json"
      const parts = displayPath.split('/').filter(Boolean);
      if (parts.length === 0) return;

      const name = parts[parts.length - 1];
      
      // Apply search filter
      if (searchQuery && !displayPath.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      const node: TreeNode = {
        name,
        path: fullPath, // Keep the full path for file operations (open, delete, etc.)
        type: file.type,
        children: file.type === 'folder' ? [] : undefined
      };

      // Use displayPath as the key for parent lookups
      pathMap[displayPath] = node;

      if (parts.length === 1) {
        root.push(node);
      } else {
        const parentDisplayPath = '/' + parts.slice(0, -1).join('/');
        const parent = pathMap[parentDisplayPath];
        
        if (!parent) {
          // Parent folder not in the map yet — skip this node
          return; 
        }

        if (parent.children) {
          parent.children.push(node);
        }
      }
    });

    // Sort: directories first, then alphabetically
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined
      }));
    };

    return sortNodes(root);
  }, [files, searchQuery]);

  const fileCount = Object.values(files).filter(f => f?.type === 'file').length;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">EXPLORER</span>
          <span className="text-xs text-slate-500">({fileCount})</span>
        </div>
        <div className="flex items-center gap-1">
            <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1 hover:bg-slate-700 rounded transition-colors ${showSearch ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                title="Search files"
            >
                <Search className="w-4 h-4" />
            </button>
            <button
                onClick={() => collapseAllFolders()}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400"
                title="Collapse all"
            >
                <ListMinus className="w-4 h-4" />
            </button>
            <button
            onClick={() => {
                const name = prompt('Enter file name (e.g., src/components/Button.tsx):');
                if (name) {
                const type = name.endsWith('/') ? 'folder' : 'file';
                const cleanName = name.replace(/\/$/, '');
                addFile(cleanName, '', type);
                }
            }}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400"
            title="New file"
            >
            <Plus className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div className="px-2 py-2 border-b border-slate-700/50">
            <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2 py-1.5 bg-[#2a2a2e] border border-slate-700/50 rounded-md text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            autoFocus
            />
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {tree.length > 0 ? (
          tree.map((node) => (
            <FileTreeNode
              key={node.path}
              name={node.name}
              path={node.path}
              type={node.type}
              depth={0}
              children={node.children}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <Folder className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs whitespace-nowrap">No open folder</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileTree;
