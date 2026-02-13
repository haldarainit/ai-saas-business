// Install Packages API
import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

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
        const { packages } = body;
        
        if (!packages || !Array.isArray(packages) || packages.length === 0) {
          send({ type: 'error', message: 'No packages provided' });
          controller.close();
          return;
        }
        
        // Filter out invalid packages
        const validPackages = packages.filter((pkg: unknown): pkg is string => 
          typeof pkg === 'string' && pkg.trim().length > 0
        );
        
        if (validPackages.length === 0) {
          send({ type: 'error', message: 'No valid packages to install' });
          controller.close();
          return;
        }
        
        // Get sandbox provider
        const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
        
        if (!provider) {
          send({ type: 'error', message: 'No active sandbox' });
          controller.close();
          return;
        }
        
        send({ type: 'status', message: `Installing ${validPackages.length} packages...` });
        send({ type: 'command', command: `npm install ${validPackages.join(' ')}` });
        
        const result = await provider.installPackages(validPackages);
        
        if (result.success) {
          send({ type: 'output', message: result.stdout || 'Packages installed successfully' });
          send({ type: 'success', message: `Installed: ${validPackages.join(', ')}` });
        } else {
          send({ type: 'warning', message: result.stderr || 'Some packages may have issues' });
          send({ type: 'status', message: 'Installation completed with warnings' });
        }
        
        controller.close();
        
      } catch (error) {
        console.error('[install-packages] Error:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : 'Installation failed' });
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
