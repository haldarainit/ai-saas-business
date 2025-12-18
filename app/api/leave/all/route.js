import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

export async function GET(request) {
  try {
    await dbConnect();

    // Extract authenticated user for data isolation
    const { userId } = await getAuthenticatedUser(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    let query = { userId }; // Filter by userId for data isolation
    
    if (status) {
      query.status = status;
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      leaves,
      count: leaves.length,
    });

  } catch (error) {
    console.error('Get all leaves error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leave requests',
      },
      { status: 500 }
    );
  }
}

