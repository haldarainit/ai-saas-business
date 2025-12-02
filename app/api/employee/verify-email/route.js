import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import { isTokenExpired } from '@/lib/utils/authUtils';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Verification token is required' },
                { status: 400 }
            );
        }

        // Find employee by verification token
        const employee = await Employee.findOne({ verificationToken: token });

        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Invalid verification token' },
                { status: 404 }
            );
        }

        // Check if already verified
        if (employee.isVerified) {
            return NextResponse.json({
                success: true,
                message: 'Email already verified',
                alreadyVerified: true,
            });
        }

        // Check if token expired
        if (isTokenExpired(employee.verificationExpiry)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Verification token has expired. Please request a new one.',
                    expired: true,
                },
                { status: 400 }
            );
        }

        // Mark as verified
        employee.isVerified = true;
        employee.verificationToken = undefined; // Clear token
        employee.verificationExpiry = undefined;
        await employee.save();

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully!',
            employee: {
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
            },
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to verify email',
            },
            { status: 500 }
        );
    }
}
