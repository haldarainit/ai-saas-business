import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface AttendanceQuery {
    userId: string;
    date?: string;
    employeeId?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const employeeId = searchParams.get('employeeId');

        // Build query with userId filter for data isolation
        const query: AttendanceQuery = { userId };

        if (date) {
            query.date = date;
        }

        if (employeeId) {
            query.employeeId = employeeId;
        }

        // Fetch attendance records for this user only
        const attendance = await Attendance.find(query).sort({ date: -1 });

        return NextResponse.json({
            success: true,
            attendance,
            count: attendance.length,
        });

    } catch (error) {
        console.error('Get all attendance error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch attendance records',
            },
            { status: 500 }
        );
    }
}
