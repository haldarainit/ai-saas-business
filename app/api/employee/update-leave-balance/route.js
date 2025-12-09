import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { employeeId, casual, sick, annual } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Update leave balance
    if (casual !== undefined) employee.leaveBalance.casual = Number(casual);
    if (sick !== undefined) employee.leaveBalance.sick = Number(sick);
    if (annual !== undefined) employee.leaveBalance.annual = Number(annual);

    await employee.save();

    return NextResponse.json({
      success: true,
      message: 'Leave balance updated successfully',
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        leaveBalance: employee.leaveBalance,
      },
    });

  } catch (error) {
    console.error('Update leave balance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update leave balance',
      },
      { status: 500 }
    );
  }
}
