// Apply AI Code API - Applies generated code to a sandbox
import { NextRequest, NextResponse } from 'next/server';
import { parseCodeBlocks, mergeFileChanges, detectPackages } from '@/lib/file-parser';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ApplyCodeRequest {
  sandboxId: string;
  code: string;
  files?: Record<string, string>;
}

interface ApplyCodeResponse {
  success: boolean;
  filesApplied: string[];
  packagesInstalled: string[];
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApplyCodeResponse>> {
  try {
    const body: ApplyCodeRequest = await req.json();
    const { sandboxId, code, files } = body;

    if (!sandboxId) {
      return NextResponse.json({
        success: false,
        filesApplied: [],
        packagesInstalled: [],
        error: 'Sandbox ID is required'
      }, { status: 400 });
    }

    // Parse code blocks if raw code provided
    let fileChanges = files ? Object.entries(files).map(([path, content]) => ({
      path,
      operation: 'create' as const,
      content
    })) : [];

    if (code && !files) {
      fileChanges = parseCodeBlocks(code);
    }

    fileChanges = mergeFileChanges(fileChanges);

    if (fileChanges.length === 0) {
      return NextResponse.json({
        success: false,
        filesApplied: [],
        packagesInstalled: [],
        error: 'No code changes to apply'
      }, { status: 400 });
    }

    // Detect packages needed
    const allCode = fileChanges.map(f => f.content || '').join('\n');
    const packages = detectPackages(allCode);

    // Apply files to sandbox based on provider
    const provider = process.env.SANDBOX_PROVIDER?.toLowerCase() === 'e2b' ? 'e2b' : 'vercel';
    
    if (provider === 'vercel') {
      await applyToVercelSandbox(sandboxId, fileChanges, packages);
    } else {
      await applyToE2BSandbox(sandboxId, fileChanges, packages);
    }

    return NextResponse.json({
      success: true,
      filesApplied: fileChanges.map(f => f.path),
      packagesInstalled: packages
    });

  } catch (error) {
    console.error('Apply code error:', error);
    return NextResponse.json({
      success: false,
      filesApplied: [],
      packagesInstalled: [],
      error: error instanceof Error ? error.message : 'Failed to apply code'
    }, { status: 500 });
  }
}

async function applyToVercelSandbox(
  sandboxId: string,
  files: Array<{ path: string; operation: string; content?: string }>,
  packages: string[]
): Promise<void> {
  // This would connect to an existing Vercel sandbox
  // Implementation depends on Vercel Sandbox persistence
  console.log(`Applying ${files.length} files to Vercel sandbox ${sandboxId}`);
  console.log(`Packages to install: ${packages.join(', ')}`);
  
  // TODO: Implement Vercel sandbox file updates
  // The Vercel Sandbox API typically creates new sandboxes rather than updating existing ones
}

async function applyToE2BSandbox(
  sandboxId: string,
  files: Array<{ path: string; operation: string; content?: string }>,
  packages: string[]
): Promise<void> {
  try {
    const { Sandbox } = await import('@e2b/code-interpreter');
    
    // Reconnect to existing sandbox
    const sandbox = await Sandbox.connect(sandboxId);

    // Write files
    for (const file of files) {
      if (file.content) {
        await sandbox.files.write(file.path, file.content);
      }
    }

    // Install packages if any
    if (packages.length > 0) {
      await sandbox.commands.run(`npm install ${packages.join(' ')} --legacy-peer-deps`, {
        cwd: '/home/user'
      });
    }

    // Restart dev server
    await sandbox.commands.run('pkill -f vite || true', { cwd: '/home/user' });
    await sandbox.commands.run('npm run dev', { 
      cwd: '/home/user',
      background: true 
    });

  } catch (error) {
    console.error('E2B apply error:', error);
    throw error;
  }
}
