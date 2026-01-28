// Get Sandbox Files API
import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
}

export async function GET() {
  try {
    // Try sandbox manager first
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 404 });
    }
    
    // Get list of files
    const fileList = await provider.listFiles();
    
    // Read file contents (limit to important files)
    const files: Record<string, string> = {};
    const importantExtensions = ['.jsx', '.tsx', '.js', '.ts', '.css', '.json', '.html'];
    
    for (const filePath of fileList) {
      // Skip node_modules and other large directories
      if (filePath.includes('node_modules') || 
          filePath.includes('.git') ||
          filePath.includes('dist') ||
          filePath.includes('build')) {
        continue;
      }
      
      // Only read files with important extensions
      const hasImportantExt = importantExtensions.some(ext => filePath.endsWith(ext));
      if (!hasImportantExt) continue;
      
      try {
        const content = await provider.readFile(filePath);
        files[filePath] = content;
      } catch (err) {
        console.warn(`[get-sandbox-files] Could not read ${filePath}:`, err);
      }
    }
    
    return NextResponse.json({
      success: true,
      files,
      fileList,
      count: Object.keys(files).length
    });
    
  } catch (error) {
    console.error('[get-sandbox-files] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get files'
    }, { status: 500 });
  }
}
