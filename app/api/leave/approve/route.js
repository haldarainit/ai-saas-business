import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import Attendance from '@/lib/models/Attendance';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { leaveId, action, approvedBy, rejectionReason } = body;

    if (!leaveId || !action) {
      return NextResponse.json(
        { success: false, error: 'Leave ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find leave request
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    if (leave.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Leave request is already ${leave.status}` },
        { status: 400 }
      );
    }

    // Update leave status
    if (action === 'approve') {
      leave.status = 'approved';
      leave.approvedBy = approvedBy || 'Admin';
      leave.approvedAt = new Date();

      // Mark attendance as "on-leave" for the leave period
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate);
      
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        await Attendance.findOneAndUpdate(
          { employeeId: leave.employeeId, date: dateStr },
          {
            $set: {
              employeeId: leave.employeeId,
              employeeName: leave.employeeName,
              date: dateStr,
              status: 'on-leave',
              notes: `Leave approved: ${leave.leaveType} - ${leave.reason}`,
            },
          },
          { upsert: true, new: true }
        );
      }
    } else {
      leave.status = 'rejected';
      leave.rejectionReason = rejectionReason || 'Rejected by admin';
    }

    await leave.save();

    return NextResponse.json({
      success: true,
      message: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      leave: {
        id: leave._id,
        status: leave.status,
        approvedBy: leave.approvedBy,
        approvedAt: leave.approvedAt,
        rejectionReason: leave.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Leave approval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to ${action} leave request`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

