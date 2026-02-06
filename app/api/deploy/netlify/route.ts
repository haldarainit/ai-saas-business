import { NextRequest } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface DeployRequestBody {
  token?: string;
  siteId?: string;
  files?: Record<string, string>;
  chatId?: string;
}

interface NetlifySiteInfo {
  id: string;
  name: string;
  url?: string;
  chatId?: string;
}

const sanitizeName = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 58) || 'builder';

async function createSite(token: string, chatId?: string): Promise<NetlifySiteInfo> {
  const siteName = sanitizeName(`builder-${chatId || 'chat'}-${Date.now()}`);
  const response = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: siteName, custom_domain: null }),
  });

  if (!response.ok) {
    throw new Error('Failed to create site');
  }

  const site = (await response.json()) as any;
  return { id: site.id, name: site.name, url: site.url, chatId };
}

async function getSite(token: string, siteId: string, chatId?: string): Promise<NetlifySiteInfo | null> {
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;
  const site = (await response.json()) as any;
  return { id: site.id, name: site.name, url: site.url, chatId };
}

export async function POST(request: NextRequest) {
  try {
    const { token, siteId, files = {}, chatId } = (await request.json()) as DeployRequestBody;

    if (!token) {
      return Response.json({ error: 'Not connected to Netlify' }, { status: 401 });
    }

    let targetSiteId = siteId;
    let siteInfo: NetlifySiteInfo | undefined;

    if (targetSiteId) {
      siteInfo = await getSite(token, targetSiteId, chatId);
      if (!siteInfo) {
        targetSiteId = undefined;
      }
    }

    if (!targetSiteId) {
      siteInfo = await createSite(token, chatId);
      targetSiteId = siteInfo.id;
    }

    const fileDigests: Record<string, string> = {};
    for (const [filePath, content] of Object.entries(files)) {
      const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      fileDigests[normalizedPath] = hash;
    }

    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: fileDigests,
        async: true,
        skip_processing: false,
        draft: false,
        function_schedules: [],
        required: Object.keys(fileDigests),
        framework: null,
      }),
    });

    if (!deployResponse.ok) {
      return Response.json({ error: 'Failed to create deployment' }, { status: 400 });
    }

    const deploy = (await deployResponse.json()) as any;
    let retryCount = 0;
    const maxRetries = 60;
    let uploaded = false;

    while (retryCount < maxRetries) {
      const statusResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys/${deploy.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const status = (await statusResponse.json()) as any;

      if (!uploaded && (status.state === 'prepared' || status.state === 'uploaded')) {
        for (const [filePath, content] of Object.entries(files)) {
          const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

          let uploadSuccess = false;
          let uploadRetries = 0;

          while (!uploadSuccess && uploadRetries < 3) {
            try {
              const uploadResponse = await fetch(
                `https://api.netlify.com/api/v1/deploys/${deploy.id}/files${normalizedPath}`,
                {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                  },
                  body: content,
                },
              );

              uploadSuccess = uploadResponse.ok;
              if (!uploadSuccess) {
                uploadRetries++;
                await new Promise((resolve) => setTimeout(resolve, 1500));
              }
            } catch {
              uploadRetries++;
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          if (!uploadSuccess) {
            return Response.json({ error: `Failed to upload file ${filePath}` }, { status: 500 });
          }
        }
        uploaded = true;
      }

      if (status.state === 'ready') {
        return Response.json({
          success: true,
          deploy: {
            id: status.id,
            state: status.state,
            url: status.ssl_url || status.url,
          },
          site: siteInfo,
        });
      }

      if (status.state === 'error') {
        return Response.json({ error: status.error_message || 'Deploy preparation failed' }, { status: 500 });
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return Response.json({ error: 'Deploy preparation timed out' }, { status: 500 });
  } catch (error) {
    console.error('Netlify deploy error:', error);
    return Response.json({ error: 'Deployment failed' }, { status: 500 });
  }
}
