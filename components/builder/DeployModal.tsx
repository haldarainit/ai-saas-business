'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useChatStore } from '@/lib/stores/chat';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import { webcontainer } from '@/lib/webcontainer';
import { WORK_DIR } from '@/utils/constants';
import { path as pathUtils } from '@/utils/path';

type Provider = 'vercel' | 'netlify' | 'github';

interface DeployModalProps {
  open: boolean;
  onClose: () => void;
}

type FileMap = Record<string, string>;

function isProbablyBinary(buffer: Uint8Array) {
  const checkLen = Math.min(1024, buffer.length);
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

async function collectFilesFromDir(dir: string, baseDir: string): Promise<FileMap> {
  const wc = await webcontainer;
  const entries = await wc.fs.readdir(dir, { withFileTypes: true });
  const files: FileMap = {};

  for (const entry of entries) {
    const fullPath = pathUtils.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFilesFromDir(fullPath, baseDir);
      Object.assign(files, nested);
    } else {
      const buffer = await wc.fs.readFile(fullPath);
      if (isProbablyBinary(buffer)) {
        // Skip binary for now to avoid corrupted deployments
        continue;
      }
      const relPath = pathUtils.relative(baseDir, fullPath).replace(/\\/g, '/');
      files[relPath] = new TextDecoder().decode(buffer);
    }
  }

  return files;
}

async function runCommand(cmd: string, args: string[]) {
  const wc = await webcontainer;
  const proc = await wc.spawn(cmd, args, { cwd: WORK_DIR });
  let output = '';
  proc.output.pipeTo(
    new WritableStream({
      write(data) {
        output += data;
      },
    }),
  );
  const exitCode = await proc.exit;
  if (exitCode !== 0) {
    throw new Error(output || `${cmd} ${args.join(' ')} failed`);
  }
  return output;
}

async function ensureDependencies() {
  const wc = await webcontainer;
  try {
    await wc.fs.readdir(pathUtils.join(WORK_DIR, 'node_modules'));
    return;
  } catch {
    await runCommand('npm', ['install']);
  }
}

async function buildProject(): Promise<string | null> {
  await ensureDependencies();
  await runCommand('npm', ['run', 'build']);
  const wc = await webcontainer;
  const buildDirs = ['dist', 'build', 'out', 'output', 'public'];

  for (const dir of buildDirs) {
    const fullPath = pathUtils.join(WORK_DIR, dir);
    try {
      await wc.fs.readdir(fullPath);
      return fullPath;
    } catch {
      // continue
    }
  }
  return null;
}

export function DeployModal({ open, onClose }: DeployModalProps) {
  const { chatId } = useChatStore();
  const { files } = useWorkbenchStore();
  const [provider, setProvider] = useState<Provider>('vercel');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjectId, setVercelProjectId] = useState('');
  const [netlifyToken, setNetlifyToken] = useState('');
  const [netlifySiteId, setNetlifySiteId] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  useEffect(() => {
    if (!open) return;
    setVercelToken(localStorage.getItem('builder.vercel.token') || '');
    setVercelProjectId(localStorage.getItem('builder.vercel.projectId') || '');
    setNetlifyToken(localStorage.getItem('builder.netlify.token') || '');
    setNetlifySiteId(localStorage.getItem('builder.netlify.siteId') || '');
    setGithubToken(localStorage.getItem('builder.github.token') || '');
    setGithubRepo(localStorage.getItem('builder.github.repo') || '');
  }, [open]);

  const sourceFiles = useMemo(() => {
    const entries = Object.entries(files || {}).filter(([, file]) => file?.type === 'file');
    const result: FileMap = {};
    for (const [path, file] of entries) {
      if (!file || file.type !== 'file' || file.isBinary) continue;
      const relPath = path.replace(`${WORK_DIR}/`, '');
      if (relPath.startsWith('node_modules/')) continue;
      result[relPath] = file.content || '';
    }
    return result;
  }, [files]);

  const persistTokens = () => {
    localStorage.setItem('builder.vercel.token', vercelToken);
    localStorage.setItem('builder.vercel.projectId', vercelProjectId);
    localStorage.setItem('builder.netlify.token', netlifyToken);
    localStorage.setItem('builder.netlify.siteId', netlifySiteId);
    localStorage.setItem('builder.github.token', githubToken);
    localStorage.setItem('builder.github.repo', githubRepo);
  };

  const handleDeploy = useCallback(async () => {
    setError(null);
    setStatus('');
    setIsDeploying(true);
    persistTokens();

    try {
      let buildDir: string | null = null;
      let buildFiles: FileMap = {};

      if (provider !== 'github') {
        setStatus('Building project...');
        try {
          buildDir = await buildProject();
        } catch (buildError) {
          if (provider === 'netlify') {
            throw buildError;
          }
          setStatus('Build failed. Deploying source instead...');
        }
      }

      if (!buildDir && provider === 'netlify') {
        throw new Error('Build output not found. Make sure the project builds successfully.');
      }

      buildFiles = buildDir ? await collectFilesFromDir(buildDir, buildDir) : {};

      if (provider === 'netlify') {
        setStatus('Deploying to Netlify...');
        const response = await fetch('/api/deploy/netlify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: netlifyToken,
            siteId: netlifySiteId || undefined,
            files: buildFiles,
            chatId,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Netlify deploy failed');
        if (data?.site?.id) {
          setNetlifySiteId(data.site.id);
          localStorage.setItem('builder.netlify.siteId', data.site.id);
        }
        setStatus(`Deployed: ${data?.deploy?.url || 'Success'}`);
      }

      if (provider === 'vercel') {
        setStatus('Deploying to Vercel...');
        const response = await fetch('/api/deploy/vercel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: vercelToken,
            projectId: vercelProjectId || undefined,
            files: buildFiles,
            sourceFiles,
            chatId,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Vercel deploy failed');
        if (data?.project?.id) {
          setVercelProjectId(data.project.id);
          localStorage.setItem('builder.vercel.projectId', data.project.id);
        }
        setStatus(`Deployed: ${data?.project?.url || data?.deploy?.url || 'Success'}`);
      }

      if (provider === 'github') {
        setStatus('Pushing to GitHub...');
        const response = await fetch('/api/deploy/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: githubToken,
            repo: githubRepo,
            files: sourceFiles,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'GitHub export failed');
        if (data?.repo?.full_name) {
          setGithubRepo(data.repo.full_name);
          localStorage.setItem('builder.github.repo', data.repo.full_name);
        }
        setStatus(`Repository: ${data?.repo?.html_url || 'Success'}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  }, [
    provider,
    vercelToken,
    vercelProjectId,
    netlifyToken,
    netlifySiteId,
    githubToken,
    githubRepo,
    chatId,
    sourceFiles,
  ]);

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Deploy Project</DialogTitle>
          <DialogDescription>Deploy your project to Vercel, Netlify, or GitHub.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          {(['vercel', 'netlify', 'github'] as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-3 py-1.5 rounded-md border ${
                provider === p ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-700 text-slate-300'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3 text-sm">
          {provider === 'vercel' && (
            <>
              <input
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Vercel Token"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
              />
              <input
                value={vercelProjectId}
                onChange={(e) => setVercelProjectId(e.target.value)}
                placeholder="Project ID (optional)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
              />
            </>
          )}
          {provider === 'netlify' && (
            <>
              <input
                value={netlifyToken}
                onChange={(e) => setNetlifyToken(e.target.value)}
                placeholder="Netlify Token"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
              />
              <input
                value={netlifySiteId}
                onChange={(e) => setNetlifySiteId(e.target.value)}
                placeholder="Site ID (optional)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
              />
            </>
          )}
          {provider === 'github' && (
            <>
              <input
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="GitHub Token"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
              />
              <input
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="Repo name (e.g. my-project)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200"
              />
            </>
          )}
        </div>

        {status && <div className="mt-3 text-xs text-slate-400">{status}</div>}
        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-300"
          >
            Close
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
          >
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DeployModal;
