import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { employeeId, month } = params;
    const { searchParams } = new URL(request.url);
    const includeImages = searchParams.get('includeImages') === 'true';

    if (!employeeId || !month) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and month are required' },
        { status: 400 }
      );
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { success: false, error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Get all attendance records for the month
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-');
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    const endDateStr = endDate.toISOString().split('T')[0];

    const query = {
      employeeId,
      date: { $gte: startDate, $lte: endDateStr }
    };

    // Build projection to exclude images if not requested
    const projection = includeImages ? {} : {
      'clockIn.faceImage': 0,
      'clockOut.faceImage': 0,
    };

    const attendanceRecords = await Attendance.find(query, projection)
      .sort({ date: 1 })
      .lean();

    // Calculate summary statistics
    const summary = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(a => a.status === 'present').length,
      absentDays: attendanceRecords.filter(a => a.status === 'absent').length,
      lateDays: attendanceRecords.filter(a => a.status === 'late').length,
      halfDays: attendanceRecords.filter(a => a.status === 'half-day').length,
      leaveDays: attendanceRecords.filter(a => a.status === 'on-leave').length,
      totalWorkingHours: attendanceRecords.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      averageWorkingHours: 0,
      suspiciousCount: attendanceRecords.filter(a => a.suspicious).length,
      totalRetryAttempts: attendanceRecords.reduce((sum, a) => sum + (a.retryAttempts || 0), 0),
    };

    summary.averageWorkingHours = summary.totalDays > 0 
      ? (summary.totalWorkingHours / summary.totalDays).toFixed(2)
      : 0;

    // Group by status for easy visualization
    const statusBreakdown = {
      present: summary.presentDays,
      absent: summary.absentDays,
      late: summary.lateDays,
      'half-day': summary.halfDays,
      'on-leave': summary.leaveDays,
    };

    return NextResponse.json({
      success: true,
      month,
      summary,
      statusBreakdown,
      records: attendanceRecords,
      recordCount: attendanceRecords.length,
    });

  } catch (error) {
    console.error('Get monthly attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch monthly attendance',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
