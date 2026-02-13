import { NextRequest } from 'next/server';
import { Octokit } from '@octokit/rest';

export const runtime = 'nodejs';

interface DeployRequestBody {
  token?: string;
  repo?: string;
  files?: Record<string, string>;
}

function normalizePath(path: string) {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

export async function POST(request: NextRequest) {
  try {
    const { token, repo, files = {} } = (await request.json()) as DeployRequestBody;

    if (!token) {
      return Response.json({ error: 'Not connected to GitHub' }, { status: 401 });
    }

    if (!repo) {
      return Response.json({ error: 'Repository name is required' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });

    let owner: string;
    let repoName: string;

    if (repo.includes('/')) {
      const [ownerPart, repoPart] = repo.split('/');
      owner = ownerPart;
      repoName = repoPart;
    } else {
      const user = await octokit.rest.users.getAuthenticated();
      owner = user.data.login;
      repoName = repo;
    }

    let repoInfo;
    try {
      repoInfo = await octokit.rest.repos.get({ owner, repo: repoName });
    } catch (error: any) {
      if (error?.status !== 404) {
        throw error;
      }

      repoInfo = await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        private: false,
        auto_init: true,
        description: 'Deployed from AI Builder',
      });
    }

    const defaultBranch = repoInfo.data.default_branch || 'main';

    const ref = await octokit.rest.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    });

    const baseCommitSha = ref.data.object.sha;
    const baseCommit = await octokit.rest.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: baseCommitSha,
    });

    const tree = Object.entries(files)
      .map(([filePath, content]) => ({
        path: normalizePath(filePath),
        mode: '100644',
        type: 'blob' as const,
        content,
      }))
      .filter((item) => item.path.length > 0);

    if (tree.length === 0) {
      return Response.json({ error: 'No files found to push' }, { status: 400 });
    }

    const newTree = await octokit.rest.git.createTree({
      owner,
      repo: repoName,
      base_tree: baseCommit.data.tree.sha,
      tree,
    });

    const commit = await octokit.rest.git.createCommit({
      owner,
      repo: repoName,
      message: `Deploy from AI Builder - ${new Date().toISOString()}`,
      tree: newTree.data.sha,
      parents: [baseCommitSha],
    });

    await octokit.rest.git.updateRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
      sha: commit.data.sha,
    });

    return Response.json({
      success: true,
      repo: {
        name: repoInfo.data.name,
        full_name: repoInfo.data.full_name,
        html_url: repoInfo.data.html_url,
        default_branch: defaultBranch,
      },
    });
  } catch (error: any) {
    console.error('GitHub deploy error:', error);
    const message = error?.message || 'GitHub export failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
