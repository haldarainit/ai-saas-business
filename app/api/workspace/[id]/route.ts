import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

function isDbUnavailable(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    return (
        message.includes('ETIMEDOUT') ||
        message.includes('ECONN') ||
        message.includes('Server selection timed out') ||
        (error as any)?.name === 'MongoServerSelectionError' ||
        (error as any)?.name === 'MongoNetworkError'
    );
}

function dbUnavailableResponse(error: unknown) {
    console.error('Database unavailable:', error);
    return NextResponse.json(
        { error: 'Database unavailable. Please try again shortly.' },
        { status: 503, headers: { 'Retry-After': '15' } },
    );
}

// GET - Get a specific workspace by ID (with ownership check)
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        console.log(`GET /api/workspace/${id} - Connecting to DB...`);
        try {
            await dbConnect();
        } catch (error) {
            if (isDbUnavailable(error)) {
                return dbUnavailableResponse(error);
            }
            throw error;
        }
        console.log(`GET /api/workspace/${id} - Connected`);

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const workspace = await Workspace.findById(id).lean();

        if (!workspace) {
            console.log(`GET /api/workspace/${id} - Not found`);
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (workspace.userId !== userId) {
            console.log(`GET /api/workspace/${id} - Access denied`);
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        console.log(`GET /api/workspace/${id} - Found`);
        return NextResponse.json({ workspace });
    } catch (error) {
        if (isDbUnavailable(error)) {
            return dbUnavailableResponse(error);
        }
        console.error('Error fetching workspace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace' },
            { status: 500 }
        );
    }
}

// PUT - Update workspace (messages and/or files) - with ownership check
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        console.log(`PUT /api/workspace/${id} - Connecting to DB...`);
        try {
            await dbConnect();
        } catch (error) {
            if (isDbUnavailable(error)) {
                return dbUnavailableResponse(error);
            }
            throw error;
        }
        console.log(`PUT /api/workspace/${id} - Connected`);

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // First, verify ownership
        const existingWorkspace = await Workspace.findById(id).lean();
        if (!existingWorkspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }
        if (existingWorkspace.userId !== userId) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

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

        const { messages, fileData, history, name } = body;

        // Sanitize messages to fix validation errors with cached schema
        // This maps 'model' -> 'ai' to ensure it passes the old enum validation
        let sanitizedMessages = messages;
        if (messages && Array.isArray(messages)) {
            sanitizedMessages = messages.map((msg: any) => ({
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

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
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
        if (isDbUnavailable(error)) {
            return dbUnavailableResponse(error);
        }
        console.error('Error updating workspace:', error);
        return NextResponse.json(
            { error: 'Failed to update workspace' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a workspace - with ownership check
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        try {
            await dbConnect();
        } catch (error) {
            if (isDbUnavailable(error)) {
                return dbUnavailableResponse(error);
            }
            throw error;
        }
        const { id } = await props.params;

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Find workspace first to get attachments and verify ownership
        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (workspace.userId !== userId) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Collect publicIds from all messages
        const publicIds: string[] = [];
        if (workspace.messages && workspace.messages.length > 0) {
            workspace.messages.forEach((msg: any) => {
                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach((att: any) => {
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
        if (isDbUnavailable(error)) {
            return dbUnavailableResponse(error);
        }
        console.error('Error deleting workspace:', error);
        return NextResponse.json(
            { error: 'Failed to delete workspace' },
            { status: 500 }
        );
    }
}
