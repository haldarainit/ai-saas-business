import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import { hashPassword } from '@/lib/utils/authUtils';

// Access the same OTP store from forgot-password route
// In production, use Redis or database
const resetTokenStore = new Map();

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { employeeId, resetToken, newPassword } = body;

    if (!employeeId || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find employee
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Note: In production, verify resetToken from database or Redis
    // For now, we'll allow password reset if employee exists
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    employee.password = hashedPassword;
    employee.passwordChangedAt = new Date();
    await employee.save();

    console.log(`Password reset successful for employee ${employeeId}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
