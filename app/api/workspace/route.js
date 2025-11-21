import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextResponse } from 'next/server';

// GET - Get all workspaces for a user
export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const workspaces = await Workspace.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

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
        await dbConnect();

        const body = await request.json();
        const { name, userId } = body;

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
