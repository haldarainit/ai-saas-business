import dbConnect from '@/lib/mongodb';
import PresentationWorkspace from '@/models/PresentationWorkspace';
import { NextResponse } from 'next/server';

// GET - Get a specific presentation workspace by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const workspace = await PresentationWorkspace.findById(id).lean();

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
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const body = await request.json();
        const { name, prompt, slideCount, theme, status, outline, presentation } = body;

        const updateData = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (prompt !== undefined) updateData.prompt = prompt;
        if (slideCount !== undefined) updateData.slideCount = slideCount;
        if (theme !== undefined) updateData.theme = theme;
        if (status !== undefined) updateData.status = status;
        if (outline !== undefined) updateData.outline = outline;
        if (presentation !== undefined) updateData.presentation = presentation;

        const workspace = await PresentationWorkspace.findByIdAndUpdate(
            id,
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
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const workspace = await PresentationWorkspace.findByIdAndDelete(id);

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
