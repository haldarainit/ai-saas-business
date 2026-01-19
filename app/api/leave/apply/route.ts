import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';
import LeavePolicy from '@/lib/models/LeavePolicy';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

interface DecodedToken {
    employeeId: string;
    userId: string;
    email: string;
    name: string;
}

interface LeaveApplyRequest {
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
}

interface LeaveTypeConfig {
    code: string;
    name?: string;
    isActive?: boolean;
    maxConsecutiveDays?: number;
}

interface LeaveBalance {
    casual?: number;
    sick?: number;
    annual?: number;
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
        let decoded: DecodedToken;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body: LeaveApplyRequest = await request.json();
        const { leaveType, fromDate, toDate, reason } = body;

        // Validate required fields
        if (!leaveType || !fromDate || !toDate || !reason) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate dates
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid date format' },
                { status: 400 }
            );
        }

        if (from > to) {
            return NextResponse.json(
                { success: false, error: 'From date must be before or equal to to date' },
                { status: 400 }
            );
        }

        // Calculate number of days (excluding weekends if needed)
        const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Load leave policy and validate leave type + rules
        const policy = await LeavePolicy.findOne({ companyId: 'default' }).lean() as { leaveTypes?: LeaveTypeConfig[] } | null;
        if (policy && Array.isArray(policy.leaveTypes)) {
            const typeConfig = policy.leaveTypes.find(
                (t) => t.code === leaveType && t.isActive !== false
            );

            if (!typeConfig) {
                return NextResponse.json(
                    { success: false, error: 'Selected leave type is not allowed in current policy' },
                    { status: 400 }
                );
            }

            if (
                typeConfig.maxConsecutiveDays &&
                Number(typeConfig.maxConsecutiveDays) > 0 &&
                days > Number(typeConfig.maxConsecutiveDays)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `You cannot take more than ${typeConfig.maxConsecutiveDays} consecutive days for ${typeConfig.name || leaveType}.`,
                        maxConsecutiveDays: Number(typeConfig.maxConsecutiveDays),
                        requestedDays: days,
                        validationError: 'EXCEEDS_CONSECUTIVE_LIMIT'
                    },
                    { status: 400 }
                );
            }
        }

        // Get employee info
        const employee = await Employee.findOne({ employeeId: decoded.employeeId, userId: decoded.userId });
        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found or access denied' },
                { status: 404 }
            );
        }

        // Check leave balance
        let leaveBalanceKey: keyof LeaveBalance = 'annual'; // default
        if (leaveType === 'casual') leaveBalanceKey = 'casual';
        else if (leaveType === 'sick') leaveBalanceKey = 'sick';

        const leaveBalance = employee.leaveBalance as LeaveBalance | undefined;
        const balance = leaveBalance?.[leaveBalanceKey] || 0;

        // Only check balance if it's explicitly set and greater than 0
        // If balance is 0 or not set, allow the request (admin can manage balances)
        if (balance > 0 && days > balance) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Insufficient leave balance. Available: ${balance} days, Requested: ${days} days`,
                    availableBalance: balance,
                    requestedDays: days,
                    validationError: 'INSUFFICIENT_BALANCE'
                },
                { status: 400 }
            );
        }

        // Create leave request
        const leave = await Leave.create({
            employeeId: decoded.employeeId,
            employeeName: employee.name,
            userId: decoded.userId, // Add userId for data isolation
            leaveType,
            fromDate: from,
            toDate: to,
            days,
            reason,
            status: 'pending',
        });

        return NextResponse.json({
            success: true,
            message: 'Leave request submitted successfully',
            leave: {
                id: leave._id,
                leaveType: leave.leaveType,
                fromDate: leave.fromDate,
                toDate: leave.toDate,
                days: leave.days,
                status: leave.status,
            },
        });

    } catch (error) {
        const err = error as Error;
        console.error('Apply leave error:', error);
        return NextResponse.json(
            {
                success: false,
                error: err.message || 'Failed to submit leave request',
            },
            { status: 500 }
        );
    }
}
