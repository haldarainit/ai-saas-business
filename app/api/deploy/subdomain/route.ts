import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import {
  createSubdomainSeed,
  generateSubdomainCandidates,
  getSubdomainValidationError,
  normalizeSubdomain,
} from '@/lib/subdomain';

async function findAvailableSubdomain(workspaceId: string, seed: string, maxCandidates = 40): Promise<string | null> {
  const candidates = generateSubdomainCandidates(seed, maxCandidates);
  const existing = await Workspace.find({
    subdomain: { $in: candidates },
    _id: { $ne: workspaceId },
  })
    .select('subdomain')
    .lean();

  const taken = new Set(existing.map((entry) => String((entry as { subdomain?: string }).subdomain || '')));
  return candidates.find((candidate) => !taken.has(candidate)) || null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const value = request.nextUrl.searchParams.get('value') || '';

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const { userId } = await getAuthenticatedUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const workspace = await Workspace.findById(workspaceId).select('name userId subdomain').lean();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if ((workspace as { userId: string }).userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const normalized = normalizeSubdomain(value);
    const existingSubdomain = String((workspace as { subdomain?: string }).subdomain || '');

    if (normalized) {
      const validationError = getSubdomainValidationError(normalized);
      if (validationError) {
        const fallbackSuggestion =
          (await findAvailableSubdomain(workspaceId, normalized, 30)) ||
          (await findAvailableSubdomain(
            workspaceId,
            createSubdomainSeed((workspace as { name: string }).name, `site-${workspaceId.slice(-6)}`),
            30,
          ));

        return NextResponse.json({
          available: false,
          normalized,
          reason: validationError,
          suggestion: fallbackSuggestion,
          rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || null,
        });
      }

      const conflictingWorkspace = await Workspace.findOne({ subdomain: normalized }).select('_id').lean();
      const isSameWorkspace =
        !conflictingWorkspace || String((conflictingWorkspace as { _id: unknown })._id) === workspaceId;

      if (isSameWorkspace) {
        return NextResponse.json({
          available: true,
          normalized,
          suggestion: normalized,
          current: normalized === existingSubdomain,
          rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || null,
        });
      }

      const suggestion = await findAvailableSubdomain(workspaceId, normalized, 30);
      return NextResponse.json({
        available: false,
        normalized,
        reason: 'Subdomain is already taken',
        suggestion,
        rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || null,
      });
    }

    const seed = createSubdomainSeed(
      (workspace as { name: string }).name,
      `site-${String((workspace as { _id: unknown })._id).slice(-6)}`,
    );
    const suggestion = await findAvailableSubdomain(workspaceId, seed, 50);

    return NextResponse.json({
      available: Boolean(suggestion),
      normalized: suggestion || '',
      suggestion,
      current: false,
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || null,
    });
  } catch (error) {
    console.error('Subdomain availability check error:', error);
    return NextResponse.json({ error: 'Failed to check subdomain availability' }, { status: 500 });
  }
}

