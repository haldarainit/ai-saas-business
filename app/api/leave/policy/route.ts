import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LeavePolicy from '@/lib/models/LeavePolicy';

// For now we assume a single-company setup and use a fixed companyId
const DEFAULT_COMPANY_ID = 'default';

interface LeaveType {
    code: string;
    name: string;
    yearlyQuota?: number;
    maxConsecutiveDays?: number | null;
    description?: string;
    isActive?: boolean;
}

interface LeavePolicyRequest {
    leaveTypes: LeaveType[];
}

export async function GET(): Promise<NextResponse> {
    try {
        await dbConnect();

        let policy = await LeavePolicy.findOne({ companyId: DEFAULT_COMPANY_ID }).lean();

        if (!policy) {
            // Seed with a sensible default policy
            const newPolicy = await LeavePolicy.create({
                companyId: DEFAULT_COMPANY_ID,
                leaveTypes: [
                    {
                        code: 'sick',
                        name: 'Sick Leave',
                        yearlyQuota: 15,
                        maxConsecutiveDays: null,
                        description: 'Paid sick leave for medical reasons.',
                    },
                    {
                        code: 'casual',
                        name: 'Casual Leave',
                        yearlyQuota: 5,
                        maxConsecutiveDays: 2,
                        description: 'Short casual leave, max 2 days at a time.',
                    },
                    {
                        code: 'annual',
                        name: 'Annual Leave',
                        yearlyQuota: 15,
                        maxConsecutiveDays: null,
                        description: 'Planned annual/vacation leave.',
                    },
                ],
            });

            policy = newPolicy.toObject();
        }

        return NextResponse.json({ success: true, policy });
    } catch (error) {
        console.error('Get leave policy error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch leave policy' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body: LeavePolicyRequest = await request.json();
        const { leaveTypes } = body;

        if (!Array.isArray(leaveTypes)) {
            return NextResponse.json(
                { success: false, error: 'leaveTypes must be an array' },
                { status: 400 },
            );
        }

        // Basic validation
        for (const t of leaveTypes) {
            if (!t.code || !t.name) {
                return NextResponse.json(
                    { success: false, error: 'Each leave type must have code and name' },
                    { status: 400 },
                );
            }
        }

        const policy = await LeavePolicy.findOneAndUpdate(
            { companyId: DEFAULT_COMPANY_ID },
            {
                companyId: DEFAULT_COMPANY_ID,
                leaveTypes,
                updatedAt: new Date(),
            },
            { new: true, upsert: true },
        ).lean();

        return NextResponse.json({ success: true, policy });
    } catch (error) {
        const err = error as Error;
        console.error('Update leave policy error:', error);
        return NextResponse.json(
            { success: false, error: err.message || 'Failed to update leave policy' },
            { status: 500 },
        );
    }
}
