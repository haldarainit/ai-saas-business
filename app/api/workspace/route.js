import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextResponse } from 'next/server';

// GET - Get all workspaces for a user
export async function GET(request) {
    try {
        console.log("GET /api/workspace - Connecting to DB...");
        await dbConnect();
        console.log("GET /api/workspace - Connected to DB");

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        console.log("GET /api/workspace - userId:", userId);

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
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
export async function POST(request) {
    try {
        console.log("POST /api/workspace - Connecting to DB...");
        await dbConnect();
        console.log("POST /api/workspace - Connected to DB");

        const body = await request.json();
        const { name, userId } = body;
        console.log("POST /api/workspace - Creating workspace:", { name, userId });

        if (!name || !userId) {
            return NextResponse.json(
                { error: 'Name and userId are required' },
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
