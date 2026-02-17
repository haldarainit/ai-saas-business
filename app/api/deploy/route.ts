import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import nodemailer from 'nodemailer';
import { getCurrentUser } from '@/lib/auth/current-user';
import { enforceSystemAccess } from '@/lib/system/enforce';

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
    subdomain: string;
    userData?: UserData;
}

// Email configuration using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

async function sendDeploymentNotification(userData: UserData, subdomain: string, workspaceId: string): Promise<void> {
    const { name, email, projectName, landingPageGoal, industry, country, referralSource } = userData;

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; text-align: center; }
                .content { background: #ffffff; padding: 30px; }
                .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                .details p { margin: 8px 0; }
                .label { font-weight: 600; color: #374151; min-width: 180px; display: inline-block; }
                .highlight { background: #fef3c7; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
                .subdomain-box { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #10b981; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🚀 New Landing Page Deployment</h1>
                </div>
                <div class="content">
                    <p>A new landing page has been deployed! Here are the details:</p>
                    
                    <div class="subdomain-box">
                        <p style="margin: 0; font-size: 14px; color: #059669;">Deployed Subdomain</p>
                        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #065f46;">${subdomain}</p>
                    </div>
                    
                    <div class="details">
                        <p><span class="label">Name:</span> ${name}</p>
                        <p><span class="label">Email:</span> ${email}</p>
                        <p><span class="label">Project Name:</span> ${projectName}</p>
                        <p><span class="label">Landing Page Goal:</span> <span class="highlight">${landingPageGoal}</span></p>
                        <p><span class="label">Industry / Category:</span> ${industry}</p>
                        <p><span class="label">Country:</span> ${country}</p>
                        ${referralSource ? `<p><span class="label">Referral Source:</span> ${referralSource}</p>` : ''}
                        <p><span class="label">Workspace ID:</span> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${workspaceId}</code></p>
                    </div>
                </div>
                <div class="footer">
                    <p>This notification was sent from the Landing Page Builder.</p>
                    <p>© ${new Date().getFullYear()} Haldar AI & IT PVT LTD. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await transporter.sendMail({
        from: `"Landing Page Builder" <${process.env.EMAIL_USER}>`,
        to: process.env.DEPLOYMENT_NOTIFICATION_TO || process.env.EMAIL_USER,
        replyTo: email,
        subject: `🚀 New Deployment: ${projectName} by ${name}`,
        html: emailHtml,
    });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const systemAccess = await enforceSystemAccess({
            user,
            capability: "deployments",
        });

        if (!systemAccess.ok) {
            return systemAccess.response;
        }

        await dbConnect();
        const { workspaceId, subdomain, userData } = await request.json() as RequestBody;

        if (!workspaceId || !subdomain) {
            return NextResponse.json(
                { error: 'Workspace ID and subdomain are required' },
                { status: 400 }
            );
        }

        // Validate subdomain format (alphanumeric, hyphens, 3-63 chars)
        const subdomainRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
        if (!subdomainRegex.test(subdomain)) {
            return NextResponse.json(
                { error: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.' },
                { status: 400 }
            );
        }

        // Check if subdomain is already taken
        const existingWorkspace = await Workspace.findOne({ subdomain });
        if (existingWorkspace && existingWorkspace._id.toString() !== workspaceId) {
            return NextResponse.json(
                { error: 'Subdomain is already taken' },
                { status: 409 }
            );
        }

        // Send notification email if user data is provided
        if (userData && userData.name && userData.email) {
            try {
                await sendDeploymentNotification(userData, subdomain, workspaceId);
            } catch (emailError) {
                console.error('Failed to send deployment notification email:', emailError);
                // Continue with deployment even if email fails
            }
        }

        // Update workspace with new subdomain
        const workspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            { subdomain },
            { new: true }
        );

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, workspace });

    } catch (error) {
        const err = error as Error & { code?: number };
        console.error('Deployment error:', err);
        // Handle duplicate key error specifically if it slipped through
        if (err.code === 11000) {
            return NextResponse.json(
                { error: 'Subdomain is already taken' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to deploy workspace' },
            { status: 500 }
        );
    }
}
