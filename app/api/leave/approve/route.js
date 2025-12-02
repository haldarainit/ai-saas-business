import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';
import Attendance from '@/lib/models/Attendance';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { leaveId, action, rejectionReason, approvedBy } = body;

    if (!leaveId || !action) {
      return NextResponse.json(
        { success: false, error: 'Leave ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    if (leave.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Leave request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Update leave status
      leave.status = 'approved';
      leave.approvedBy = approvedBy || 'Admin';
      leave.approvedAt = new Date();

      // Deduct from leave balance
      const employee = await Employee.findOne({ employeeId: leave.employeeId });
      if (employee) {
        const leaveBalanceKey = leave.leaveType === 'casual' ? 'casual' : leave.leaveType === 'sick' ? 'sick' : 'annual';
        if (employee.leaveBalance?.[leaveBalanceKey] >= leave.days) {
          employee.leaveBalance[leaveBalanceKey] -= leave.days;
          await employee.save();
        }
      }

      // Mark attendance records as on-leave for the date range
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate);
      const dates = [];
      
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Update or create attendance records
      for (const date of dates) {
        await Attendance.findOneAndUpdate(
          { employeeId: leave.employeeId, date },
          {
            employeeId: leave.employeeId,
            employeeName: leave.employeeName,
            date,
            status: 'on-leave',
            notes: `Leave approved: ${leave.leaveType}`,
          },
          { upsert: true }
        );
      }

      await leave.save();

      return NextResponse.json({
        success: true,
        message: 'Leave request approved successfully',
        leave,
      });

    } else {
      // Reject leave
      leave.status = 'rejected';
      leave.rejectionReason = rejectionReason || 'Leave request rejected';
      await leave.save();

      return NextResponse.json({
        success: true,
        message: 'Leave request rejected',
        leave,
      });
    }

  } catch (error) {
    console.error('Approve/reject leave error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process leave request',
      },
      { status: 500 }
    );
  }
}

