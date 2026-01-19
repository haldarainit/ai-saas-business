import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import EmailService from '@/lib/email/EmailService';

interface OTPData {
    otp: string;
    expiresAt: number;
    attempts: number;
    email: string;
}

interface ResetTokenData {
    token: string;
    expiresAt: number;
}

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map<string, OTPData | ResetTokenData>();

// Clean up expired OTPs every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
        if (now > value.expiresAt) {
            otpStore.delete(key);
        }
    }
}, 600000);

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask email: sh**@gm**l.com
function maskEmail(email: string): string {
    if (!email) return '';

    const [localPart, domain] = email.split('@');
    if (!domain) return email;

    const [domainName, ext] = domain.split('.');

    // Mask local part: show first 2 and last 2 characters
    let maskedLocal = localPart;
    if (localPart.length > 4) {
        maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 4) + localPart.substring(localPart.length - 2);
    } else if (localPart.length > 2) {
        maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    }

    // Mask domain: show first 2 and last 2 characters
    let maskedDomain = domainName;
    if (domainName && domainName.length > 4) {
        maskedDomain = domainName.substring(0, 2) + '*'.repeat(domainName.length - 4) + domainName.substring(domainName.length - 2);
    } else if (domainName && domainName.length > 2) {
        maskedDomain = domainName.substring(0, 2) + '*'.repeat(domainName.length - 2);
    }

    return `${maskedLocal}@${maskedDomain}.${ext}`;
}

interface ForgotPasswordRequest {
    employeeId: string;
    action?: string;
}

interface VerifyOTPRequest {
    employeeId: string;
    otp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body: ForgotPasswordRequest = await request.json();
        const { employeeId, action } = body;

        if (!employeeId) {
            return NextResponse.json(
                { success: false, error: 'Employee ID is required' },
                { status: 400 }
            );
        }

        // Find employee
        const employee = await Employee.findOne({ employeeId });

        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        if (!employee.email) {
            return NextResponse.json(
                { success: false, error: 'No email registered for this employee' },
                { status: 400 }
            );
        }

        if (action === 'send-otp') {
            // Generate OTP
            const otp = generateOTP();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

            // Store OTP
            otpStore.set(employeeId, {
                otp,
                expiresAt,
                attempts: 0,
                email: employee.email
            });

            // Send OTP email using EmailService
            try {
                const emailService = new EmailService();

                const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Hello <strong>${employee.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                We received a request to reset your password for employee ID: <strong>${employeeId}</strong>
              </p>
              
              <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your OTP Code</p>
                <h2 style="color: #667eea; font-size: 36px; margin: 10px 0; letter-spacing: 8px; font-weight: bold;">
                  ${otp}
                </h2>
                <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</p>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you didn't request this password reset, please ignore this email or contact HR immediately.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                  This is an automated email. Please do not reply.
                </p>
              </div>
            </div>
          </div>
        `;

                const result = await emailService.sendEmail(
                    employee.email,
                    'Password Reset OTP - Employee Portal',
                    htmlContent,
                    null,
                    { enableTracking: false }
                );

                if (result.success) {
                    console.log(`OTP sent to ${employee.email} for employee ${employeeId}`);

                    return NextResponse.json({
                        success: true,
                        message: 'OTP sent successfully',
                        maskedEmail: maskEmail(employee.email),
                    });
                } else {
                    throw new Error(result.error || 'Failed to send email');
                }
            } catch (emailError) {
                console.error('Failed to send OTP email:', emailError);
                return NextResponse.json(
                    { success: false, error: 'Failed to send OTP email. Please try again.' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error. Please try again later.' },
            { status: 500 }
        );
    }
}

// Verify OTP
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body: VerifyOTPRequest = await request.json();
        const { employeeId, otp } = body;

        if (!employeeId || !otp) {
            return NextResponse.json(
                { success: false, error: 'Employee ID and OTP are required' },
                { status: 400 }
            );
        }

        // Get stored OTP
        const storedData = otpStore.get(employeeId) as OTPData | undefined;

        if (!storedData || !('otp' in storedData)) {
            return NextResponse.json(
                { success: false, error: 'OTP expired or not found. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check expiration
        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(employeeId);
            return NextResponse.json(
                { success: false, error: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check attempts
        if (storedData.attempts >= 5) {
            otpStore.delete(employeeId);
            return NextResponse.json(
                { success: false, error: 'Too many failed attempts. Please request a new OTP.' },
                { status: 429 }
            );
        }

        // Verify OTP
        if (storedData.otp !== otp) {
            storedData.attempts += 1;
            otpStore.set(employeeId, storedData);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid OTP. Please try again.',
                    attemptsLeft: 5 - storedData.attempts
                },
                { status: 400 }
            );
        }

        // OTP verified successfully
        // Generate a reset token valid for 15 minutes
        const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

        // Store reset token
        otpStore.set(`reset_${employeeId}`, {
            token: resetToken,
            expiresAt: resetTokenExpiry
        });

        // Clear OTP
        otpStore.delete(employeeId);

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error. Please try again later.' },
            { status: 500 }
        );
    }
}
