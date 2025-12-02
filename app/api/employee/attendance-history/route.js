import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request) {
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

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '30');

        // Build query
        const query = { employeeId: decoded.employeeId };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        // Fetch attendance records
        const attendanceRecords = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(limit)
            .select('-faceImage -clockIn.faceImage -clockOut.faceImage'); // Exclude face images for performance

        // Calculate statistics
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
        const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);

        return NextResponse.json({
            success: true,
            attendance: attendanceRecords,
            statistics: {
                totalDays,
                presentDays,
                lateDays,
                totalHours: parseFloat(totalHours.toFixed(2)),
                averageHours: totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0,
            },
        });

    } catch (error) {
        console.error('Get attendance history error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch attendance history',
            },
            { status: 500 }
        );
    }
}
