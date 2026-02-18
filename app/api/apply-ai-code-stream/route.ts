// Apply AI Code Stream API - Applies generated code to sandbox with real-time feedback
import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { parseCodeBlocks, detectPackages } from '@/lib/file-parser';

declare global {
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
}

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      try {
        const body = await req.json();
        const { response: code, isEdit = false, packages: providedPackages = [], sandboxId } = body;
        
        if (!code) {
          send({ type: 'error', message: 'No code provided' });
          controller.close();
          return;
        }
        
        send({ type: 'start', message: 'Starting code application...' });
        
        // Get sandbox provider
        let provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
        
        if (sandboxId && !provider) {
          provider = sandboxManager.getProvider(sandboxId);
        }
        
        if (!provider) {
          send({ type: 'error', message: 'No active sandbox. Please create a sandbox first.' });
          controller.close();
          return;
        }
        
        // Parse code blocks
        send({ type: 'step', message: 'Analyzing code...' });
        const fileChanges = parseCodeBlocks(code);
        
        if (fileChanges.length === 0) {
          send({ type: 'warning', message: 'No file changes detected in the response' });
          send({ type: 'complete', results: [], message: 'No changes applied' });
          controller.close();
          return;
        }
        
        // Detect packages
        const allCode = fileChanges.map(f => f.content || '').join('\n');
        const detectedPackages = detectPackages(allCode);
        const allPackages = [...new Set([...providedPackages, ...detectedPackages])];
        
        // Install packages if needed
        if (allPackages.length > 0) {
          send({ type: 'step', message: `Installing ${allPackages.length} packages...`, packages: allPackages });
          
          try {
            const installResult = await provider.installPackages(allPackages);
            
            if (installResult.success) {
              send({ type: 'success', message: 'Packages installed', installedPackages: allPackages });
            } else {
              send({ type: 'warning', message: `Some packages may have issues: ${installResult.stderr}` });
            }
          } catch (err) {
            send({ type: 'warning', message: `Package installation warning: ${err instanceof Error ? err.message : 'Unknown error'}` });
          }
        }
        
        // Apply file changes
        send({ type: 'step', message: `Applying ${fileChanges.length} file changes...` });
        const results: Array<{ path: string; success: boolean; error?: string }> = [];
        
        for (const change of fileChanges) {
          const path = change.path;
          const content = change.content || '';
          
          send({ type: 'file-progress', path, action: isEdit ? 'updating' : 'creating' });
          
          try {
            await provider.writeFile(path, content);
            results.push({ path, success: true });
            send({ type: 'file-complete', path, success: true });
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error';
            results.push({ path, success: false, error });
            send({ type: 'file-complete', path, success: false, error });
          }
        }
        
        // Send completion
        const successCount = results.filter(r => r.success).length;
        send({
          type: 'complete',
          results,
          message: `Applied ${successCount}/${results.length} files successfully`,
          filesGenerated: results.map(r => r.path)
        });
        
        controller.close();
        
      } catch (error) {
        console.error('[apply-ai-code-stream] Error:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        controller.close();
      }
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
