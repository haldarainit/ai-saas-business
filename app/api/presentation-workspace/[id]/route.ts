import dbConnect from '@/lib/mongodb';
import PresentationWorkspace from '@/models/PresentationWorkspace';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET - Get a specific presentation workspace by ID
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await props.params;
        await dbConnect();

        // Find workspace by ID and verify ownership
        const workspace = await PresentationWorkspace.findOne({
            _id: id,
            userId: userId
        }).lean();

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ workspace });
    } catch (error) {
        console.error('Error fetching presentation workspace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace' },
            { status: 500 }
        );
    }
}

// PUT - Update presentation workspace
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await props.params;
        await dbConnect();

        const body = await request.json();
        const { name, prompt, slideCount, theme, status, outline, presentation } = body;

        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (prompt !== undefined) updateData.prompt = prompt;
        if (slideCount !== undefined) updateData.slideCount = slideCount;
        if (theme !== undefined) updateData.theme = theme;
        if (status !== undefined) updateData.status = status;
        if (outline !== undefined) updateData.outline = outline;
        if (presentation !== undefined) updateData.presentation = presentation;

        // Update workspace only if user owns it
        const workspace = await PresentationWorkspace.findOneAndUpdate(
            { _id: id, userId: userId },
            updateData,
            { new: true, runValidators: true }
        ).lean();

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            workspace
        });
    } catch (error) {
        console.error('Error updating presentation workspace:', error);
        return NextResponse.json(
            { error: 'Failed to update workspace' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a presentation workspace
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await props.params;
        await dbConnect();

        // Delete workspace only if user owns it
        const workspace = await PresentationWorkspace.findOneAndDelete({
            _id: id,
            userId: userId
        });

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Workspace deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting presentation workspace:', error);
        return NextResponse.json(
            { error: 'Failed to delete workspace' },
            { status: 500 }
        );
    }
}
