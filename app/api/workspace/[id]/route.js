import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextResponse } from 'next/server';

// GET - Get a specific workspace by ID
export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;

        const workspace = await Workspace.findById(id).lean();

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ workspace });
    } catch (error) {
        console.error('Error fetching workspace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace' },
            { status: 500 }
        );
    }
}

// PUT - Update workspace (messages and/or files)
export async function PUT(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { messages, fileData } = body;

        const updateData = {};
        if (messages !== undefined) updateData.messages = messages;
        if (fileData !== undefined) updateData.fileData = fileData;

        const workspace = await Workspace.findByIdAndUpdate(
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
        console.error('Error updating workspace:', error);
        return NextResponse.json(
            { error: 'Failed to update workspace' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a workspace
export async function DELETE(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;

        const workspace = await Workspace.findByIdAndDelete(id);

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
        console.error('Error deleting workspace:', error);
        return NextResponse.json(
            { error: 'Failed to delete workspace' },
            { status: 500 }
        );
    }
}
