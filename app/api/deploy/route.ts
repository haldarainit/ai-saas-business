import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import {
  buildDeploymentUrl,
  createSubdomainSeed,
  generateSubdomainCandidates,
  getSubdomainValidationError,
  normalizeSubdomain,
} from '@/lib/subdomain';

interface UserData {
  name: string;
  email: string;
  projectName: string;
  landingPageGoal: string;
  industry: string;
  country: string;
  referralSource?: string;
}

interface RequestBody {
  workspaceId: string;
  subdomain?: string;
  userData?: UserData;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendDeploymentNotification(
  userData: UserData,
  subdomain: string,
  workspaceId: string,
  deploymentUrl: string,
): Promise<void> {
  const { name, email, projectName, landingPageGoal, industry, country, referralSource } = userData;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
          .container { max-width: 640px; margin: 0 auto; padding: 16px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
          .header { background: #2563eb; color: white; padding: 20px; }
          .content { padding: 20px; }
          .row { margin: 8px 0; }
          .label { font-weight: 700; display: inline-block; min-width: 180px; }
          .pill { display: inline-block; padding: 4px 10px; background: #ecfeff; border-radius: 9999px; border: 1px solid #bae6fd; }
          .link-box { margin-top: 16px; padding: 12px; border: 1px solid #dbeafe; background: #eff6ff; border-radius: 8px; }
          .link { color: #1d4ed8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h2 style="margin: 0;">New Landing Page Deployment</h2>
            </div>
            <div class="content">
              <div class="row"><span class="label">Subdomain:</span> <span class="pill">${subdomain}</span></div>
              <div class="row"><span class="label">Name:</span> ${name}</div>
              <div class="row"><span class="label">Email:</span> ${email}</div>
              <div class="row"><span class="label">Project Name:</span> ${projectName}</div>
              <div class="row"><span class="label">Landing Page Goal:</span> ${landingPageGoal}</div>
              <div class="row"><span class="label">Industry:</span> ${industry}</div>
              <div class="row"><span class="label">Country:</span> ${country}</div>
              ${referralSource ? `<div class="row"><span class="label">Referral Source:</span> ${referralSource}</div>` : ''}
              <div class="row"><span class="label">Workspace ID:</span> <code>${workspaceId}</code></div>
              <div class="link-box">
                <strong>Live URL:</strong>
                <div><a class="link" href="${deploymentUrl}" target="_blank" rel="noopener noreferrer">${deploymentUrl}</a></div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Landing Page Builder" <${process.env.EMAIL_USER}>`,
    to: process.env.DEPLOYMENT_NOTIFICATION_TO || 'haldarainit@gmail.com',
    replyTo: email,
    subject: `New Deployment: ${projectName} by ${name}`,
    html: emailHtml,
  });
}

async function findAvailableSubdomain(workspaceId: string, seed: string, maxCandidates = 50): Promise<string | null> {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    const body = (await request.json()) as RequestBody;
    const { workspaceId, userData } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const { userId } = await getAuthenticatedUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const rawSubdomain = typeof body.subdomain === 'string' ? body.subdomain : '';
    const requestedSubdomain = normalizeSubdomain(rawSubdomain);
    let assignedSubdomain = '';
    let autoAssigned = false;

    if (requestedSubdomain) {
      const validationError = getSubdomainValidationError(requestedSubdomain);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const existingWorkspace = await Workspace.findOne({ subdomain: requestedSubdomain })
        .select('_id')
        .lean();

      if (existingWorkspace && String((existingWorkspace as { _id: unknown })._id) !== workspaceId) {
        const suggestion = await findAvailableSubdomain(workspaceId, requestedSubdomain, 30);
        return NextResponse.json(
          {
            error: 'Subdomain is already taken',
            suggestion,
          },
          { status: 409 },
        );
      }

      assignedSubdomain = requestedSubdomain;
    } else {
      autoAssigned = true;
      const workspaceIdSuffix = String(workspace._id).slice(-6);
      const seed = createSubdomainSeed(
        userData?.projectName || workspace.name || '',
        `site-${workspaceIdSuffix}`,
      );

      const available = await findAvailableSubdomain(workspaceId, seed, 80);
      if (!available) {
        return NextResponse.json(
          { error: 'Could not find an available subdomain. Please try a custom one.' },
          { status: 500 },
        );
      }

      assignedSubdomain = available;
    }

    const workspaceResult = await Workspace.findByIdAndUpdate(
      workspaceId,
      { subdomain: assignedSubdomain },
      { new: true, runValidators: true },
    ).lean();

    if (!workspaceResult) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const deploymentUrl = buildDeploymentUrl(assignedSubdomain, request.nextUrl.origin);

    if (userData?.name && userData?.email) {
      try {
        await sendDeploymentNotification(userData, assignedSubdomain, workspaceId, deploymentUrl);
      } catch (emailError) {
        console.error('Failed to send deployment notification email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      subdomain: assignedSubdomain,
      url: deploymentUrl,
      autoAssigned,
      workspace: workspaceResult,
    });
  } catch (error) {
    const err = error as Error & { code?: number };
    console.error('Deployment error:', err);

    if (err.code === 11000) {
      return NextResponse.json({ error: 'Subdomain is already taken' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to deploy workspace' }, { status: 500 });
  }
}

