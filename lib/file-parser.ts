// File Parser Utilities for Code Generation
// Handles parsing and processing of code files

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
  type: 'component' | 'style' | 'config' | 'utility' | 'page' | 'other';
}

export interface FileChange {
  path: string;
  operation: 'create' | 'update' | 'delete';
  content?: string;
}

// Detect file language from extension
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    css: 'css',
    scss: 'scss',
    json: 'json',
    html: 'html',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
  };
  return languageMap[ext] || 'text';
}

// Detect file type from path and content
export function getFileType(path: string, content?: string): ParsedFile['type'] {
  const lowerPath = path.toLowerCase();
  
  if (lowerPath.includes('/components/') || lowerPath.endsWith('.component.tsx')) {
    return 'component';
  }
  if (lowerPath.endsWith('.css') || lowerPath.endsWith('.scss')) {
    return 'style';
  }
  if (lowerPath.includes('config') || lowerPath.endsWith('.config.ts') || lowerPath.endsWith('.config.js')) {
    return 'config';
  }
  if (lowerPath.includes('/utils/') || lowerPath.includes('/lib/') || lowerPath.includes('/hooks/')) {
    return 'utility';
  }
  if (lowerPath.includes('/app/') || lowerPath.includes('/pages/') || lowerPath.endsWith('page.tsx')) {
    return 'page';
  }
  
  return 'other';
}

// Parse code blocks from AI response
export function parseCodeBlocks(response: string): FileChange[] {
  const changes: FileChange[] = [];
  
  // Match code blocks with optional file path
  // Format: ```language:path/to/file.ext or ```language path/to/file.ext
  const codeBlockRegex = /```(\w+)?(?:[:\s]+([^\n`]+))?\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const [, language, pathHint, content] = match;
    
    // Try to extract file path
    let filePath = pathHint?.trim();
    
    // If no path provided, try to infer from content
    if (!filePath && content) {
      const inferredPath = inferFilePathFromContent(content, language);
      if (inferredPath) {
        filePath = inferredPath;
      }
    }
    
    if (filePath && content) {
      changes.push({
        path: normalizeFilePath(filePath),
        operation: 'create',
        content: content.trim(),
      });
    }
  }
  
  return changes;
}

// Infer file path from code content
function inferFilePathFromContent(content: string, language?: string): string | null {
  // Look for common patterns
  const patterns = [
    // React component: export default function ComponentName
    /export\s+(?:default\s+)?function\s+(\w+)/,
    // React component: const ComponentName = 
    /(?:export\s+)?const\s+(\w+)\s*(?::\s*React\.FC)?/,
    // Class component
    /class\s+(\w+)\s+extends\s+(?:React\.)?Component/,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const name = match[1];
      const ext = language === 'css' || language === 'scss' ? `.${language}` : '.tsx';
      
      // Determine directory based on file type
      if (name.endsWith('Page') || name === 'App') {
        return `src/${name}${ext}`;
      }
      return `src/components/${name}${ext}`;
    }
  }
  
  // CSS files
  if (language === 'css' && content.includes('@tailwind')) {
    return 'src/index.css';
  }
  
  return null;
}

// Normalize file path for consistency
function normalizeFilePath(path: string): string {
  // Remove leading slash
  let normalized = path.replace(/^\/+/, '');
  
  // Ensure proper directory structure
  if (!normalized.startsWith('src/') && 
      !normalized.startsWith('public/') && 
      !normalized.includes('.config.') &&
      !normalized.startsWith('package')) {
    normalized = `src/${normalized}`;
  }
  
  return normalized;
}

// Merge file changes (handle updates to same file)
export function mergeFileChanges(changes: FileChange[]): FileChange[] {
  const fileMap = new Map<string, FileChange>();
  
  for (const change of changes) {
    const existing = fileMap.get(change.path);
    
    if (existing && change.operation !== 'delete') {
      // Later changes override earlier ones
      fileMap.set(change.path, change);
    } else {
      fileMap.set(change.path, change);
    }
  }
  
  return Array.from(fileMap.values());
}

// Extract imports from code
export function extractImports(code: string): string[] {
  const importRegex = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Detect required packages from imports
export function detectPackages(code: string): string[] {
  const imports = extractImports(code);
  const packages = new Set<string>();
  
  for (const imp of imports) {
    // Skip relative imports
    if (imp.startsWith('.') || imp.startsWith('@/')) continue;
    
    // Handle scoped packages (@scope/package)
    if (imp.startsWith('@')) {
      const parts = imp.split('/');
      if (parts.length >= 2) {
        packages.add(`${parts[0]}/${parts[1]}`);
      }
    } else {
      // Regular package
      const parts = imp.split('/');
      packages.add(parts[0]);
    }
  }
  
  // Filter out Node.js built-ins
  const builtins = new Set([
    'fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util', 
    'events', 'stream', 'buffer', 'querystring', 'child_process'
  ]);
  
  return Array.from(packages).filter(pkg => !builtins.has(pkg));
}
