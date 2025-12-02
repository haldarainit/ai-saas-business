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

    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        { success: false, error: 'From date must be before or equal to to date' },
        { status: 400 }
      );
    }

    // Calculate number of days (excluding weekends if needed)
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    // Get employee info
    const employee = await Employee.findOne({ employeeId: decoded.employeeId });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check leave balance
    const leaveBalanceKey = leaveType === 'casual' ? 'casual' : leaveType === 'sick' ? 'sick' : 'annual';
    const balance = employee.leaveBalance?.[leaveBalanceKey] || 0;

    if (days > balance) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient leave balance. Available: ${balance} days, Requested: ${days} days` 
        },
        { status: 400 }
      );
    }

    // Create leave request
    const leave = await Leave.create({
      employeeId: decoded.employeeId,
      employeeName: employee.name,
      leaveType,
      fromDate: from,
      toDate: to,
      days,
      reason,
      status: 'pending',
    });

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
    console.error('Apply leave error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit leave request',
      },
      { status: 500 }
    );
  }
}

