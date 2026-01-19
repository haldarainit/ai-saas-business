import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

interface DecodedToken {
    employeeId: string;
    userId: string;
    email: string;
    name: string;
}

interface LeaveQuery {
    userId: string;
    employeeId?: string;
    status?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        let decoded: DecodedToken;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const employeeId = searchParams.get('employeeId');

        const query: LeaveQuery = { userId: decoded.userId }; // Filter by userId for data isolation

        // If employeeId is provided and matches token, show their leaves
        // Otherwise, if admin, show all leaves
        if (employeeId && employeeId === decoded.employeeId) {
            query.employeeId = employeeId;
        } else if (!employeeId) {
            // Default: show employee's own leaves
            query.employeeId = decoded.employeeId;
        } else {
            // Admin viewing specific employee (within same company/userId)
            query.employeeId = employeeId;
        }

        if (status) {
            query.status = status;
        }

        const leaves = await Leave.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            leaves,
            count: leaves.length,
        });

    } catch (error) {
        console.error('Get leaves error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch leave requests',
            },
            { status: 500 }
        );
    }
}
