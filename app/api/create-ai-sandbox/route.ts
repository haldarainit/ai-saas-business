// Create AI Sandbox API - Creates a sandbox for code execution
import { NextRequest, NextResponse } from 'next/server';
import { getSandboxConfig, sandboxTemplates, type SandboxTemplate } from '@/lib/sandbox/factory';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface CreateSandboxRequest {
  template?: SandboxTemplate;
  files?: Record<string, string>;
}

interface CreateSandboxResponse {
  success: boolean;
  sandboxId?: string;
  url?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<CreateSandboxResponse>> {
  try {
    const body: CreateSandboxRequest = await req.json();
    const { template = 'react-vite', files } = body;

    const sandboxConfig = getSandboxConfig();
    
    if (sandboxConfig.provider === 'vercel') {
      return await createVercelSandbox(template, files);
    } else {
      return await createE2BSandbox(template, files);
    }
  } catch (error) {
    console.error('Create sandbox error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sandbox'
    }, { status: 500 });
  }
}

async function createVercelSandbox(
  template: SandboxTemplate,
  customFiles?: Record<string, string>
): Promise<NextResponse<CreateSandboxResponse>> {
  try {
    // Dynamic import to avoid issues if not configured
    const { Sandbox } = await import('@vercel/sandbox');
    
    const templateConfig = sandboxTemplates[template];
    const files = { ...templateConfig.files, ...customFiles };

    // Create sandbox with files
    const sandbox = await Sandbox.create({
      files,
    });

    // Wait for sandbox to be ready
    await sandbox.shells.run('npm install && npm run dev', {
      background: true
    });

    return NextResponse.json({
      success: true,
      sandboxId: sandbox.id,
      url: `https://${sandbox.id}.sandbox.vercel.app`
    });

  } catch (error) {
    console.error('Vercel sandbox error:', error);
    return NextResponse.json({
      success: false,
      error: `Vercel sandbox error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

async function createE2BSandbox(
  template: SandboxTemplate,
  customFiles?: Record<string, string>
): Promise<NextResponse<CreateSandboxResponse>> {
  try {
    // Dynamic import to avoid issues if not configured
    const { Sandbox } = await import('@e2b/code-interpreter');
    
    const templateConfig = sandboxTemplates[template];
    const files = { ...templateConfig.files, ...customFiles };

    // Create sandbox
    const sandbox = await Sandbox.create();

    // Write files to sandbox
    for (const [path, content] of Object.entries(files)) {
      await sandbox.files.write(path, content);
    }

    // Install dependencies and start dev server
    await sandbox.commands.run('npm install', { cwd: '/home/user' });
    await sandbox.commands.run('npm run dev', { 
      cwd: '/home/user',
      background: true 
    });

    const url = await sandbox.getHost(5173);

    return NextResponse.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url: `https://${url}`
    });

  } catch (error) {
    console.error('E2B sandbox error:', error);
    return NextResponse.json({
      success: false,
      error: `E2B sandbox error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
