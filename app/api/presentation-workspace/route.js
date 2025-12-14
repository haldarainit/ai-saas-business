import dbConnect from '@/lib/mongodb';
import PresentationWorkspace from '@/models/PresentationWorkspace';
import { NextResponse } from 'next/server';

// GET - Get all presentation workspaces for a user
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
        await dbConnect();

        const body = await request.json();
        const { name, userId, prompt, slideCount, theme } = body;

        if (!name || !userId) {
            return NextResponse.json(
                { error: 'Name and userId are required' },
                { status: 400 }
            );
        }

        const workspace = await PresentationWorkspace.create({
            name,
            userId,
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
