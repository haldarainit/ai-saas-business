import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', or null for all

    // Build query
    const query = { employeeId: decoded.employeeId };
    if (status) {
      query.status = status;
    }

    // Fetch leave requests
    const leaves = await Leave.find(query)
      .sort({ appliedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      leaves,
      count: leaves.length,
    });
  } catch (error) {
    console.error('Get leave list error:', error);
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

