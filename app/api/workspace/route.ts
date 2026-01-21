import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// Type definitions
interface CreateWorkspaceBody {
    name: string;
}

// GET - Get all workspaces for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        console.log("GET /api/workspace - Connecting to DB...");
        await dbConnect();
        console.log("GET /api/workspace - Connected to DB");

        // Get authenticated user from session
        const { userId } = await getAuthenticatedUser(request);
        console.log("GET /api/workspace - userId:", userId);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const workspaces = await Workspace.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`GET /api/workspace - Found ${workspaces.length} workspaces`);
        return NextResponse.json({ workspaces });
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspaces' },
            { status: 500 }
        );
    }
}

// POST - Create a new workspace
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        console.log("POST /api/workspace - Connecting to DB...");
        await dbConnect();
        console.log("POST /api/workspace - Connected to DB");

        // Get authenticated user from session
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body: CreateWorkspaceBody = await request.json();
        const { name } = body;
        console.log("POST /api/workspace - Creating workspace:", { name, userId });

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const workspace = await Workspace.create({
            name,
            userId,
            messages: [],
            fileData: {}
        });

        console.log("POST /api/workspace - Workspace created:", workspace._id);
        return NextResponse.json({
            success: true,
            workspace: workspace.toObject()
        });
    } catch (error) {
        console.error('Error creating workspace:', error);
        return NextResponse.json(
            { error: 'Failed to create workspace' },
            { status: 500 }
        );
    }
}
