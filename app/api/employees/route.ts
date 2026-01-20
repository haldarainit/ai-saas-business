import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// Type definitions
interface WorkSchedule {
    startTime: string;
    endTime: string;
    workingDays: number[];
}

interface EmployeeBody {
    employeeId: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;
    profileImage?: string;
    workSchedule?: WorkSchedule;
}

interface EmployeeQuery {
    userId: string;
    employeeId?: string;
    status?: string;
    department?: string;
}

interface EmployeeResponse {
    employeeId: string;
    name: string;
    email: string;
    department?: string;
    position?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body: EmployeeBody = await request.json();
        const {
            employeeId,
            name,
            email,
            phone,
            department,
            position,
            profileImage,
            workSchedule,
        } = body;

        // Validate required fields
        if (!employeeId || !name || !email) {
            return NextResponse.json(
                { success: false, error: 'Employee ID, name, and email are required' },
                { status: 400 }
            );
        }

        // Check if employee already exists for this user
        const existing = await Employee.findOne({
            userId,
            $or: [{ employeeId }, { email }]
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Employee ID or email already exists for your organization' },
                { status: 400 }
            );
        }

        // Create employee with user association
        const employee = await Employee.create({
            userId,
            employeeId,
            name,
            email,
            phone,
            department,
            position,
            profileImage,
            workSchedule: workSchedule || {
                startTime: '09:00',
                endTime: '18:00',
                workingDays: [1, 2, 3, 4, 5],
            },
        });

        const responseEmployee: EmployeeResponse = {
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            position: employee.position,
        };

        return NextResponse.json({
            success: true,
            message: 'Employee created successfully',
            employee: responseEmployee,
        });

    } catch (error) {
        console.error('Create employee error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const status = searchParams.get('status');
        const department = searchParams.get('department');

        const query: EmployeeQuery = { userId };

        if (employeeId) {
            query.employeeId = employeeId;
        }
        if (status) {
            query.status = status;
        }
        if (department) {
            query.department = department;
        }

        const employees = await Employee.find(query)
            .select('-profileImage')
            .sort({ name: 1 });

        return NextResponse.json({
            success: true,
            employees,
            count: employees.length,
        });

    } catch (error) {
        console.error('Get employees error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch employees',
            },
            { status: 500 }
        );
    }
}
