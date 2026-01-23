import dbConnect from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import { NextRequest, NextResponse } from 'next/server';

// POST - Add messages to a workspace
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await props.params;
        const body = await request.json();
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
        console.error('Error updating messages:', error);
        return NextResponse.json(
            { error: 'Failed to update messages' },
            { status: 500 }
        );
    }
}
