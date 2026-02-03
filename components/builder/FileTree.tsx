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
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/stores/workbench';

interface FileTreeNodeProps {
  name: string;
  path: string;
  type: 'file' | 'folder';
  depth: number;
  children?: TreeNode[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-600" />;
    case 'css':
    case 'scss':
    case 'sass':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-slate-400" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className="w-4 h-4 text-purple-400" />;
    default:
      return <File className="w-4 h-4 text-slate-400" />;
  }
};

function FileTreeNode({ name, path, type, depth, children }: FileTreeNodeProps) {
  const { 
    selectedFile, 
    selectFile: setSelectedFile, 
    expandedFolders, 
    toggleFolder,
    unsavedFiles,
    deleteFile,
    generatedFile
  } = useWorkbenchStore();
  
  const isExpanded = expandedFolders.has(path);
  const isSelected = selectedFile === path;
  const isUnsaved = unsavedFiles.has(path);
  const isGenerating = generatedFile === path;
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'folder') {
      toggleFolder(path);
    } else {
      setSelectedFile(path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  return (
    <div className="select-none">
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          flex items-center gap-1.5 px-2 py-1 cursor-pointer
          transition-colors group relative border-l-2
          ${isSelected 
            ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-blue-200' 
            : 'border-transparent hover:bg-[#2a2a2e] text-slate-400 hover:text-slate-200'}
        `}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        {/* Expand/Collapse Icon for Folders */}
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {type === 'folder' && (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )
          )}
        </span>
        
        {/* File/Folder Icon */}
        <span className="shrink-0 flex items-center justify-center">
          {type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400" />
            )
          ) : (
            getFileIcon(name)
          )}
        </span>
        
        {/* Name */}
        <span className="truncate text-sm flex-1">{name}</span>
        
        {/* Status indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {isGenerating && (
            <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
          )}
          
          {isUnsaved && (
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          )}
        </div>
        
        {/* Action buttons on hover */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          {type === 'file' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this file?')) {
                  deleteFile(path);
                }
              }}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title="Delete file"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {type === 'folder' && isExpanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
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
  const { files, addFile } = useWorkbenchStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Build tree structure from flat files
  const tree = useMemo(() => {
    const root: TreeNode[] = [];
    const pathMap: Record<string, TreeNode> = {};

    // Sort files by path
    const sortedPaths = Object.keys(files).sort((a, b) => {
      const aDepth = a.split('/').length;
      const bDepth = b.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      return a.localeCompare(b);
    });

    sortedPaths.forEach((path) => {
      const file = files[path];
      if (!file) return;

      const parts = path.split('/').filter(Boolean);
      const name = parts[parts.length - 1];
      
      // Apply search filter
      if (searchQuery && !path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      const node: TreeNode = {
        name,
        path,
        type: file.type,
        children: file.type === 'folder' ? [] : undefined
      };

      pathMap[path] = node;

      if (parts.length === 1) {
        root.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        let parent = pathMap[parentPath];
        
        // If parent doesn't exist in map (might be implicitly created), check root or create it
        if (!parent) {
          // This logic handles implicit folder creation if needed, 
          // but strictly we expect folders to be in the 'files' map as type: 'folder'
          return; 
        }

        if (parent && parent.children) {
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
        <button
          onClick={() => {
            const name = prompt('Enter file name (e.g., src/components/Button.tsx):');
            if (name) {
              const type = name.endsWith('/') ? 'folder' : 'file';
              const cleanName = name.replace(/\/$/, '');
              addFile(cleanName, '', type);
            }
          }}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          title="New file"
        >
          <Plus className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Search */}
      {/* <div className="px-2 py-2 border-b border-slate-700/50">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1.5 bg-[#2a2a2e] border border-slate-700/50 rounded-md text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
        />
      </div> */}

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
