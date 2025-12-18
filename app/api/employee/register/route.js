import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import EmailService from '@/lib/email/EmailService';
import { generateEmployeeWelcomeEmail } from '@/lib/email/templates/employeeWelcome';
import {
    generatePassword,
    hashPassword,
    generateVerificationToken,
    generateAttendanceToken,
    generateTokenExpiry,
} from '@/lib/utils/authUtils';
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
                { success: false, error: 'Employee ID or email already exists in your organization' },
                { status: 400 }
            );
        }

        // Generate credentials
        const tempPassword = generatePassword(12);
        const hashedPassword = await hashPassword(tempPassword);
        const verificationToken = generateVerificationToken();
        const attendanceToken = generateAttendanceToken();
        const verificationExpiry = generateTokenExpiry(24); // 24 hours

        // Create employee with user association
        const employee = await Employee.create({
            userId, // Associate employee with authenticated user
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
            password: hashedPassword,
            verificationToken,
            verificationExpiry,
            attendanceToken,
            isVerified: false,
            passwordChangeRequired: true,
        });

        // Generate URLs
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/portal/verify?token=${verificationToken}`;
        const portalLink = `${baseUrl}/portal/login`;

        // Send welcome email with credentials
        try {
            const emailService = new EmailService();
            const emailHtml = generateEmployeeWelcomeEmail({
                name,
                employeeId,
                tempPassword,
                verificationLink,
                portalLink,
            });

            await emailService.sendEmail(
                email,
                'Welcome to the Team - Your Employee Portal Access',
                emailHtml
            );

            console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the registration if email fails
            // The admin can manually send credentials
        }

        return NextResponse.json({
            success: true,
            message: 'Employee registered successfully. Credentials sent to email.',
            employee: {
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                position: employee.position,
            },
            // In development, return credentials for testing
            ...(process.env.NODE_ENV === 'development' && {
                tempPassword,
                portalLink,
            }),
        });

    } catch (error) {
        console.error('Employee registration error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to register employee',
            },
            { status: 500 }
        );
    }
}
