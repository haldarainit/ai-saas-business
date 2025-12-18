import dbConnect from '@/lib/mongodb';
import PresentationWorkspace from '@/models/PresentationWorkspace';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET - Get all presentation workspaces for a user
export async function GET(request) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            console.log('GET /api/presentation-workspace: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const workspaces = await PresentationWorkspace.find({ userId })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({ workspaces });
    } catch (error) {
        console.error('Error fetching presentation workspaces:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspaces' },
            { status: 500 }
        );
    }
}

// POST - Create a new presentation workspace
export async function POST(request) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            console.log('POST /api/presentation-workspace: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const { name, prompt, slideCount, theme } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const workspace = await PresentationWorkspace.create({
            name,
            userId, // Use authenticated userId, not from request body
            prompt: prompt || '',
            slideCount: slideCount || 8,
            theme: theme || 'modern',
            status: 'draft'
        });

        return NextResponse.json({
            success: true,
            workspace: workspace.toObject()
        });
    } catch (error) {
        console.error('Error creating presentation workspace:', error);
        return NextResponse.json(
            { error: 'Failed to create workspace' },
            { status: 500 }
        );
    }
}
