import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { extractUserFromRequest } from '@/lib/auth-utils';

export async function GET(request, { params }) {
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

    const { date } = params;

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

    const records = await Attendance.find({ date, userId })
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
    console.error('Get all attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance records',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
