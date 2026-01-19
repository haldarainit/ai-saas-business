import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';

interface DebugVerifyRequest {
    employeeId: string;
}

// Debug endpoint to manually verify employee (REMOVE IN PRODUCTION)
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body: DebugVerifyRequest = await request.json();
        const { employeeId } = body;

        if (!employeeId) {
            return NextResponse.json(
                { success: false, error: 'Employee ID required' },
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

        employee.isVerified = true;
        employee.verificationToken = undefined;
        employee.verificationExpiry = undefined;
        await employee.save();

        return NextResponse.json({
            success: true,
            message: 'Employee verified manually',
            employee: {
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                isVerified: employee.isVerified,
            },
        });

    } catch (error) {
        console.error('Manual verify error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to verify employee' },
            { status: 500 }
        );
    }
}
