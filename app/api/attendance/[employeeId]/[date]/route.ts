import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { extractUserFromRequest } from '@/lib/auth-utils';

interface RouteParams {
    params: Promise<{ employeeId: string; date: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();

        // Extract authenticated user
        const authResult = await extractUserFromRequest(request);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }
        const userId = authResult.user.id;

        const { employeeId, date } = await params;

        if (!employeeId || !date) {
            return NextResponse.json(
                { success: false, error: 'Employee ID and date are required' },
                { status: 400 }
            );
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return NextResponse.json(
                { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            );
        }

        const attendance = await Attendance.findOne({ employeeId, userId, date });

        if (!attendance) {
            return NextResponse.json({
                success: true,
                attendance: null,
                message: 'No attendance record found for this date',
            });
        }

        return NextResponse.json({
            success: true,
            attendance,
        });

    } catch (error) {
        const err = error as Error;
        console.error('Get attendance error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch attendance',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            },
            { status: 500 }
        );
    }
}
