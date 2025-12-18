import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { extractUserFromRequest } from '@/lib/auth-utils';

export async function GET(request) {
    try {
        await dbConnect();

        // Extract authenticated user
        const authResult = extractUserFromRequest(request);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }
        const userId = authResult.user.id;

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const employeeId = searchParams.get('employeeId');

        // Build query with userId filter for data isolation
        const query = { userId };

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
