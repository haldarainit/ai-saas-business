import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';

// Type definitions
interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

interface Message {
    role: string;
    content: string;
}

interface UpdateMessagesBody {
    messages: Message[];
}

interface WorkspaceWithMessages {
    messages?: Message[];
}

// POST - Add messages to a workspace
export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();

        const { id } = await params;
        const body: UpdateMessagesBody = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        const workspace = await Workspace.findByIdAndUpdate(
            id,
            { messages },
            { new: true, runValidators: true }
        ).lean() as WorkspaceWithMessages | null;

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            messages: workspace.messages
        });
    } catch (error) {
        console.error('Error updating messages:', error);
        return NextResponse.json(
            { error: 'Failed to update messages' },
            { status: 500 }
        );
    }
}
