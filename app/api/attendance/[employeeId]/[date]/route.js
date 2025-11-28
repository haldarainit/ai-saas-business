import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { employeeId, date } = params;

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

    const attendance = await Attendance.findOne({ employeeId, date });

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
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
