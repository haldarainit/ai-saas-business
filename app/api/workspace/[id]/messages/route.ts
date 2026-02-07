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

// POST - Add messages to a workspace
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        const workspace = await Workspace.findOneAndUpdate(
            { _id: id, userId },
            { messages },
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
            messages: workspace.messages
        });
    } catch (error) {
        if (isDbUnavailable(error)) {
            return dbUnavailableResponse(error);
        }
        console.error('Error updating messages:', error);
        return NextResponse.json(
            { error: 'Failed to update messages' },
            { status: 500 }
        );
    }
}
