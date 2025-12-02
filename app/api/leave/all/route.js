import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', or null for all

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Fetch all leave requests (for admin)
    const leaves = await Leave.find(query)
      .sort({ appliedAt: -1 })
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

