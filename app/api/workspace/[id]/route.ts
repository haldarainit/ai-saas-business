import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// Type definitions
interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

interface Message {
    role: string;
    content: string;
    attachments?: Attachment[];
}

interface Attachment {
    publicId?: string;
    url?: string;
    type?: string;
}

interface UpdateWorkspaceBody {
    messages?: Message[];
    fileData?: Record<string, unknown>;
    history?: unknown[];
}

interface WorkspaceDocument {
    _id: string;
    userId: string;
    name: string;
    messages?: Message[];
    fileData?: Record<string, unknown>;
}

// GET - Get a specific workspace by ID (with ownership check)
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { id } = await params;
        console.log(`GET /api/workspace/${id} - Connecting to DB...`);
        await dbConnect();
        console.log(`GET /api/workspace/${id} - Connected`);

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const workspace = await Workspace.findById(id).lean() as WorkspaceDocument | null;

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
        console.error('Error fetching workspace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace' },
            { status: 500 }
        );
    }
}

// PUT - Update workspace (messages and/or files) - with ownership check
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { id } = await params;
        console.log(`PUT /api/workspace/${id} - Connecting to DB...`);
        await dbConnect();
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
        const existingWorkspace = await Workspace.findById(id).lean() as WorkspaceDocument | null;
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

        let body: UpdateWorkspaceBody;
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

        const updateData: Record<string, unknown> = {};
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

// DELETE - Delete a workspace - with ownership check
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();
        const { id } = await params;

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
            workspace.messages.forEach((msg: Message) => {
                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach((att: Attachment) => {
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
