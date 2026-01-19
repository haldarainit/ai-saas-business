import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import { comparePassword } from '@/lib/utils/authUtils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

interface LoginRequest {
    employeeId: string;
    password: string;
}

interface JWTPayload {
    employeeId: string;
    userId: string;
    email: string;
    name: string;
    attendanceToken: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body: LoginRequest = await request.json();
        const { employeeId, password } = body;

        if (!employeeId || !password) {
            return NextResponse.json(
                { success: false, error: 'Employee ID and password are required' },
                { status: 400 }
            );
        }

        // Find employee with password field
        const employee = await Employee.findOne({ employeeId }).select('+password');

        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if employee has a password set
        if (!employee.password) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Account not activated. Please complete registration first.',
                },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, employee.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if email is verified
        if (!employee.isVerified) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Please verify your email before logging in',
                    emailNotVerified: true,
                },
                { status: 403 }
            );
        }

        // Check if employee is active
        if (employee.status !== 'active') {
            return NextResponse.json(
                {
                    success: false,
                    error: `Account is ${employee.status}. Please contact HR.`,
                },
                { status: 403 }
            );
        }

        // Update last login
        employee.lastLogin = new Date();
        await employee.save();

        // Generate JWT token
        const payload: JWTPayload = {
            employeeId: employee.employeeId,
            userId: employee.userId, // Add userId for data isolation
            email: employee.email,
            name: employee.name,
            attendanceToken: employee.attendanceToken,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            token,
            employee: {
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                position: employee.position,
                passwordChangeRequired: employee.passwordChangeRequired,
            },
            attendancePortalUrl: `/portal/attendance`,
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Login failed. Please try again.',
            },
            { status: 500 }
        );
    }
}
