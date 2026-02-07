export interface WorkspaceMessage {
  role: string;
  content: string;
  timestamp?: string | Date;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    publicId?: string;
    name?: string;
    mimeType?: string;
  }>;
}

export interface WorkspaceRecord {
  _id: string;
  name: string;
  userId: string;
  messages: WorkspaceMessage[];
  fileData?: Record<string, unknown>;
  history?: Array<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
}

let workspaceCooldownUntil = 0;

function setWorkspaceCooldown(retryAfterSeconds?: number) {
  const fallbackMs = 15000;
  const retryMs =
    typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : fallbackMs;
  workspaceCooldownUntil = Date.now() + retryMs;
}

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const now = Date.now();
  if (now < workspaceCooldownUntil) {
    const seconds = Math.ceil((workspaceCooldownUntil - now) / 1000);
    throw new Error(`Database unavailable. Retry in ${seconds}s.`);
  }

  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    setWorkspaceCooldown();
    throw new Error('Network error. Please check your connection.');
  }

  if (response.status === 503) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
    setWorkspaceCooldown(Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data as T;
}

export async function listWorkspaces(): Promise<WorkspaceRecord[]> {
  const data = await apiFetch<{ workspaces: WorkspaceRecord[] }>('/api/workspace');
  return data.workspaces || [];
}

export async function createWorkspace(name: string): Promise<WorkspaceRecord> {
  const data = await apiFetch<{ workspace: WorkspaceRecord }>('/api/workspace', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.workspace;
}

export async function getWorkspace(id: string): Promise<WorkspaceRecord> {
  const data = await apiFetch<{ workspace: WorkspaceRecord }>(`/api/workspace/${id}`);
  return data.workspace;
}

export async function updateWorkspace(
  id: string,
  payload: Partial<Pick<WorkspaceRecord, 'messages' | 'fileData' | 'history' | 'name'>>,
): Promise<WorkspaceRecord> {
  const data = await apiFetch<{ workspace: WorkspaceRecord }>(`/api/workspace/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.workspace;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await apiFetch(`/api/workspace/${id}`, {
    method: 'DELETE',
  });
}
