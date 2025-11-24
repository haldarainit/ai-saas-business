import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextResponse } from 'next/server';

// GET - Get a specific workspace by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        console.log(`GET /api/workspace/${id} - Connecting to DB...`);
        await dbConnect();
        console.log(`GET /api/workspace/${id} - Connected`);

        const workspace = await Workspace.findById(id).lean();

        if (!workspace) {
            console.log(`GET /api/workspace/${id} - Not found`);
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        console.log(`GET /api/workspace/${id} - Found`);
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
        const { id } = await params;
        console.log(`PUT /api/workspace/${id} - Connecting to DB...`);
        await dbConnect();
        console.log(`PUT /api/workspace/${id} - Connected`);

        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error(`PUT /api/workspace/${id} - Invalid JSON:`, jsonError);
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { messages, fileData } = body;

        // Sanitize messages to fix validation errors with cached schema
        // This maps 'model' -> 'ai' to ensure it passes the old enum validation
        let sanitizedMessages = messages;
        if (messages && Array.isArray(messages)) {
            sanitizedMessages = messages.map(msg => ({
                ...msg,
                role: msg.role === 'model' ? 'ai' : msg.role
            }));
        }

        console.log(`PUT /api/workspace/${id} - Updating:`, {
            hasMessages: !!sanitizedMessages,
            messageCount: sanitizedMessages?.length,
            hasFileData: !!fileData
        });

        const updateData = {};
        if (sanitizedMessages !== undefined) updateData.messages = sanitizedMessages;
        if (fileData !== undefined) updateData.fileData = fileData;

        // Don't update if nothing to update
        if (Object.keys(updateData).length === 0) {
            console.log(`PUT /api/workspace/${id} - Nothing to update`);
            return NextResponse.json({
                success: true,
                message: 'No changes to save'
            });
        }

        const workspace = await Workspace.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).lean();

        if (!workspace) {
            console.log(`PUT /api/workspace/${id} - Not found`);
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        console.log(`PUT /api/workspace/${id} - Updated successfully`);
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
