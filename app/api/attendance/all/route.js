import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const employeeId = searchParams.get('employeeId');

        // Build query
        const query = {};

        if (date) {
            query.date = date;
        }

        if (employeeId) {
            query.employeeId = employeeId;
        }

        // Fetch attendance records
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
