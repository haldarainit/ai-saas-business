import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request) {
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

    const body = await request.json();
    const { leaveType, fromDate, toDate, reason } = body;

    // Validate required fields
    if (!leaveType || !fromDate || !toDate || !reason) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      return NextResponse.json(
        { success: false, error: 'From date must be before or equal to to date' },
        { status: 400 }
      );
    }

    // Calculate number of days
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    // Get employee details
    const employee = await Employee.findOne({ employeeId: decoded.employeeId });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employeeId: decoded.employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          fromDate: { $lte: toDate },
          toDate: { $gte: fromDate },
        },
      ],
    });

    if (overlappingLeave) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have a leave request for this period',
        },
        { status: 400 }
      );
    }

    // Create leave request
    const leave = new Leave({
      employeeId: decoded.employeeId,
      employeeName: employee.name,
      leaveType,
      fromDate,
      toDate,
      days,
      reason,
      status: 'pending',
    });

    await leave.save();

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      leave: {
        id: leave._id,
        leaveType: leave.leaveType,
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        days: leave.days,
        status: leave.status,
      },
    });
  } catch (error) {
    console.error('Leave application error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit leave request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

