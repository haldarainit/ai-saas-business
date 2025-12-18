import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

export async function POST(request) {
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

    const body = await request.json();
    const { 
      employeeId, 
      name, 
      email, 
      phone,
      department,
      position,
      profileImage, // base64 reference image
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
      userId, // Associate employee with the authenticated user
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
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
      },
    });

  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create employee',
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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

    let query = { userId }; // Only get employees for this user
    
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
      .select('-profileImage') // Exclude profile images from list
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
