import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request) {
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

        // Find employee (exclude password)
        const employee = await Employee.findOne({ employeeId: decoded.employeeId }).select('-password');

        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            employee: {
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                department: employee.department,
                position: employee.position,
                status: employee.status,
                joinDate: employee.joinDate,
                workSchedule: employee.workSchedule,
                leaveBalance: employee.leaveBalance || { casual: 0, sick: 0, annual: 0 },
                passwordChangeRequired: employee.passwordChangeRequired,
                lastLogin: employee.lastLogin,
            },
        });

    } catch (error) {
        console.error('Get employee error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch employee data',
            },
            { status: 500 }
        );
    }
}
