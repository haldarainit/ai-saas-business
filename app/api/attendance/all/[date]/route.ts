import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface RouteParams {
    params: Promise<{ date: string }>;
}

interface AttendanceRecord {
    status: string;
    suspicious: boolean;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
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

        const { date } = await params;

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Date is required' },
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

        const records: AttendanceRecord[] = await Attendance.find({ date, userId })
            .select('-clockIn.faceImage -clockOut.faceImage') // Exclude images for list view
            .sort({ 'clockIn.time': -1 })
            .lean();

        // Calculate summary
        const summary = {
            total: records.length,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            late: records.filter(r => r.status === 'late').length,
            onLeave: records.filter(r => r.status === 'on-leave').length,
            suspicious: records.filter(r => r.suspicious).length,
        };

        return NextResponse.json({
            success: true,
            date,
            summary,
            records,
            count: records.length,
        });

    } catch (error) {
        const err = error as Error;
        console.error('Get all attendance error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch attendance records',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            },
            { status: 500 }
        );
    }
}
