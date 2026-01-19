import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import { comparePassword, hashPassword } from '@/lib/utils/authUtils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

interface DecodedToken {
    employeeId: string;
    userId: string;
    email: string;
    name: string;
}

interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
        let decoded: DecodedToken;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body: ChangePasswordRequest = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return NextResponse.json(
                { success: false, error: 'New password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Find employee
        const employee = await Employee.findOne({ employeeId: decoded.employeeId }).select('+password');

        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, employee.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        employee.password = hashedPassword;
        employee.passwordChangeRequired = false;
        await employee.save();

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully',
        });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to change password',
            },
            { status: 500 }
        );
    }
}
