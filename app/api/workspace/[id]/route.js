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
            const text = await request.text();
            if (!text) {
                return NextResponse.json(
                    { error: 'Empty request body' },
                    { status: 400 }
                );
            }
            body = JSON.parse(text);
        } catch (jsonError) {
            console.error(`PUT /api/workspace/${id} - Invalid JSON:`, jsonError);
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { messages, fileData, history } = body;

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
            hasFileData: !!fileData,
            hasHistory: !!history,
            historyLength: history?.length
        });

        const updateData = {};
        if (sanitizedMessages !== undefined) updateData.messages = sanitizedMessages;
        if (fileData !== undefined) updateData.fileData = fileData;
        if (history !== undefined) updateData.history = history;

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

        // Find workspace first to get attachments
        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Collect publicIds from all messages
        const publicIds = [];
        if (workspace.messages && workspace.messages.length > 0) {
            workspace.messages.forEach(msg => {
                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(att => {
                        if (att.publicId) {
                            publicIds.push(att.publicId);
                        }
                    });
                }
            });
        }

        // Delete resources from Cloudinary
        if (publicIds.length > 0) {
            console.log(`DELETE /api/workspace/${id} - Deleting ${publicIds.length} Cloudinary resources`);
            try {
                // Dynamically import to avoid issues if lib is not set up in all environments (though it should be)
                const { deleteResources } = await import('@/lib/cloudinary');
                await deleteResources(publicIds);
            } catch (cloudError) {
                console.error('Error deleting Cloudinary resources:', cloudError);
                // Continue with workspace deletion even if Cloudinary fails
            }
        }

        await Workspace.findByIdAndDelete(id);

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
