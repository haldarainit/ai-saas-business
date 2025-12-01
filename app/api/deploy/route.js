import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await dbConnect();
        const { workspaceId, subdomain } = await request.json();

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
        console.error('Deployment error:', error);
        // Handle duplicate key error specifically if it slipped through
        if (error.code === 11000) {
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
