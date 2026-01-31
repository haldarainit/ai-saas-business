import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import { GoogleGenAI } from "@google/genai";

interface Location {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
}

interface MarkAttendanceRequest {
    employeeId: string;
    image: string;
    location: Location;
    action?: 'clockIn' | 'clockOut';
    deviceInfo?: string;
}

interface VerificationResult {
    faceDetected: boolean;
    qualityScore: number;
    matchScore: number;
    suspicious: boolean;
    suspiciousFlags: string[];
    analysis: string;
}

// Rate limiting map
const rateLimitMap = new Map<string, number>();

// Helper to check rate limit
function checkRateLimit(employeeId: string, type: string = 'clockIn'): boolean {
    const key = `admin-${employeeId}-${type}`;
    const now = Date.now();
    const lastAttempt = rateLimitMap.get(key);

    // Allow one attempt every 10 seconds
    if (lastAttempt && now - lastAttempt < 10000) {
        return false;
    }

    rateLimitMap.set(key, now);
    return true;
}

// Clean old rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now - value > 300000) {
            rateLimitMap.delete(key);
        }
    }
}, 300000);

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Helper to perform face verification using Gemini AI
async function verifyFace(
    base64Image: string,
    referenceImage: string | null | undefined,
    employeeName: string
): Promise<VerificationResult> {
    try {
        const shouldEnableAI = process.env.ENABLE_AI_FACE_VERIFICATION === 'true';

        if (!shouldEnableAI) {
            console.log('⚠️ AI Face Verification is disabled. Set ENABLE_AI_FACE_VERIFICATION=true to enable.');
            // Return a pass-through result for testing when AI is disabled
            // In production, you should require AI verification
            return {
                faceDetected: true,
                qualityScore: 80,
                matchScore: 85, // Allow attendance when AI is disabled (for development)
                suspicious: false,
                suspiciousFlags: ['AI verification disabled - development mode'],
                analysis: 'Face verification bypassed (AI disabled). Enable ENABLE_AI_FACE_VERIFICATION=true for production.',
            };
        }

        if (!referenceImage) {
            console.error('No reference image for employee:', employeeName);
            return {
                faceDetected: false,
                qualityScore: 0,
                matchScore: 0,
                suspicious: true,
                suspiciousFlags: ['No reference image available'],
                analysis: 'Employee has no registered profile image. Please register a profile photo first.',
            };
        }

        console.log('🤖 Using AI face verification with Gemini');

        // Remove data URL prefix if present
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const cleanReference = referenceImage.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `You are a security system performing face verification. Compare these TWO images:

IMAGE 1 (Reference - Registered Employee): This is the registered profile photo of employee "${employeeName}".

IMAGE 2 (Current - Clock In/Out Attempt): This is a photo taken during attendance marking.

TASK: Determine if IMAGE 2 shows the SAME PERSON as IMAGE 1.

Analyze:
1. Facial features: eyes, nose, mouth, face shape, bone structure
2. Facial landmarks and proportions
3. Distinctive features (if any)
4. Overall facial similarity

IMPORTANT SECURITY RULES:
- Only return matchScore >= 75 if you are CONFIDENT it's the same person
- Return matchScore < 75 if there are ANY doubts or differences
- Be STRICT - this is a security check
- Consider lighting, angle, and image quality but prioritize facial similarity

Respond in JSON format ONLY:
{
  "faceDetected": true/false,
  "qualityScore": 0-100 (image quality),
  "matchScore": 0-100 (similarity: 0-50=different person, 51-74=uncertain, 75-100=same person),
  "suspicious": true/false,
  "suspiciousFlags": ["array of any concerns"],
  "analysis": "brief explanation of your comparison"
}`;

        const API_KEY = process.env.GOOGLE_API_KEY;
        if (!API_KEY) {
            throw new Error('Google API key is not configured');
        }

        const genAI = new GoogleGenAI({ apiKey: API_KEY });

        // Try available models
        const AVAILABLE_MODELS = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ];

        let modelName: string | null = null;
        for (const model of AVAILABLE_MODELS) {
            try {
                await genAI.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: "test" }] }],
                });
                modelName = model;
                break;
            } catch {
                continue;
            }
        }

        if (!modelName) {
            throw new Error('No available Gemini model found');
        }

        // Prepare parts with both images
        const parts = [
            { text: 'Reference Image (Registered Employee):' },
            { inlineData: { data: cleanReference, mimeType: 'image/jpeg' } },
            { text: '\n\nCurrent Image (Clock In/Out Attempt):' },
            { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
            { text: '\n\n' + prompt }
        ];

        const result = await genAI.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts }],
        });

        // Extract text from response
        let response = '';
        try {
            const resultAny = result as { response?: { text?: string | (() => string) }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
            if (resultAny?.response?.text) {
                response = typeof resultAny.response.text === "function" ? resultAny.response.text() : resultAny.response.text;
            } else if (resultAny?.candidates?.[0]?.content?.parts) {
                response = resultAny.candidates[0].content.parts.map(p => p.text || '').join('');
            }
        } catch (e) {
            console.error('Error extracting response:', e);
        }

        console.log('AI Response:', response.substring(0, 500));

        // Try to parse JSON from response
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                const matchScore = parsed.matchScore || 0;
                const faceDetected = parsed.faceDetected !== false && matchScore > 0;

                return {
                    faceDetected,
                    qualityScore: parsed.qualityScore || 0,
                    matchScore: matchScore,
                    suspicious: parsed.suspicious || matchScore < 75,
                    suspiciousFlags: parsed.suspiciousFlags || (matchScore < 75 ? ['Low match score'] : []),
                    analysis: parsed.analysis || response,
                };
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
        }

        // Fallback analysis
        const lowerResponse = response.toLowerCase();
        const hasPositive = ['same person', 'matches', 'verified'].some(ind => lowerResponse.includes(ind));
        const hasNegative = ['different person', 'not the same', 'does not match'].some(ind => lowerResponse.includes(ind));

        const scoreMatch = response.match(/matchScore[:\s]+(\d+)/i) || response.match(/(\d+)%?\s*(?:match|similarity)/i);
        const matchScore = scoreMatch ? parseInt(scoreMatch[1]) : (hasPositive && !hasNegative ? 80 : hasNegative ? 30 : 50);

        return {
            faceDetected: !lowerResponse.includes('no face'),
            qualityScore: 75,
            matchScore,
            suspicious: matchScore < 75,
            suspiciousFlags: matchScore < 75 ? ['Uncertain verification'] : [],
            analysis: response.substring(0, 500),
        };
    } catch (error) {
        console.error('Face verification error:', error);
        // For admin marking, allow with warning when AI fails
        return {
            faceDetected: true,
            qualityScore: 70,
            matchScore: 75, // Allow but flag
            suspicious: true,
            suspiciousFlags: ['AI verification failed - manual review recommended'],
            analysis: `Verification error: ${(error as Error).message}. Allowed with warning.`,
        };
    }
}

// POST - Admin marks attendance for an employee
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        // Verify admin authentication
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Admin authentication required' },
                { status: 401 }
            );
        }

        const body: MarkAttendanceRequest = await request.json();
        const {
            employeeId,
            image,
            location,
            action = 'clockIn',
            deviceInfo
        } = body;

        // Validate required fields
        if (!employeeId || !image) {
            return NextResponse.json(
                { success: false, error: 'Employee ID and image are required' },
                { status: 400 }
            );
        }

        // Check rate limit
        if (!checkRateLimit(employeeId, action)) {
            return NextResponse.json(
                { success: false, error: 'Please wait 10 seconds before trying again' },
                { status: 429 }
            );
        }

        // Find employee and ensure they belong to this admin's organization
        const employee = await Employee.findOne({ employeeId, userId });
        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found or access denied' },
                { status: 404 }
            );
        }

        if (employee.status !== 'active') {
            return NextResponse.json(
                { success: false, error: `Employee is ${employee.status}` },
                { status: 403 }
            );
        }

        // Perform face verification
        console.log('Starting face verification for employee:', employee.name);
        console.log('AI Verification enabled:', process.env.ENABLE_AI_FACE_VERIFICATION === 'true');

        const verification = await verifyFace(
            image,
            employee.profileImage,
            employee.name
        );

        console.log('Verification result:', {
            faceDetected: verification.faceDetected,
            qualityScore: verification.qualityScore,
            matchScore: verification.matchScore,
            suspicious: verification.suspicious,
        });

        if (!verification.faceDetected) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No clear face detected in image. Please ensure good lighting and try again.',
                    retry: true,
                    qualityScore: verification.qualityScore,
                    verification: {
                        faceDetected: false,
                        analysis: verification.analysis,
                    }
                },
                { status: 400 }
            );
        }

        // Check match threshold (75%)
        const MATCH_THRESHOLD = 75;
        if (verification.matchScore < MATCH_THRESHOLD) {
            console.log(`Match score ${verification.matchScore} below threshold ${MATCH_THRESHOLD}`);

            return NextResponse.json(
                {
                    success: false,
                    error: `Face verification failed. Match score: ${verification.matchScore}%. Required: ${MATCH_THRESHOLD}%.`,
                    matchScore: verification.matchScore,
                    qualityScore: verification.qualityScore,
                    retry: true
                },
                { status: 400 }
            );
        }

        console.log('Verification passed! Match score:', verification.matchScore);

        const today = formatDate(new Date());
        const now = new Date();

        if (action === 'clockIn') {
            // Check if already clocked in today
            const existingAttendance = await Attendance.findOne({ employeeId, date: today });

            if (existingAttendance && existingAttendance.clockIn) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Employee already clocked in today',
                        attendance: existingAttendance
                    },
                    { status: 400 }
                );
            }

            // Create attendance record
            const attendanceData = {
                employeeId,
                employeeName: employee.name,
                userId,
                date: today,
                clockIn: {
                    time: now,
                    location: {
                        latitude: location.latitude || 0,
                        longitude: location.longitude || 0,
                        accuracy: location.accuracy || 0,
                    },
                    faceImage: image,
                    faceMatchScore: verification.matchScore,
                    deviceInfo,
                },
                status: 'present',
                suspicious: verification.suspicious,
                suspiciousFlags: verification.suspiciousFlags,
                markedByAdmin: true,
            };

            let attendance;
            if (existingAttendance) {
                attendance = await Attendance.findByIdAndUpdate(
                    existingAttendance._id,
                    attendanceData,
                    { new: true }
                );
            } else {
                attendance = await Attendance.create(attendanceData);
            }

            return NextResponse.json({
                success: true,
                message: `${employee.name} clocked in successfully`,
                attendance,
                verification: {
                    matchScore: verification.matchScore,
                    qualityScore: verification.qualityScore,
                    suspicious: verification.suspicious,
                },
            });
        }
        else if (action === 'clockOut') {
            // Find today's attendance
            const attendance = await Attendance.findOne({ employeeId, date: today });

            if (!attendance) {
                return NextResponse.json(
                    { success: false, error: 'No clock in record found for today' },
                    { status: 400 }
                );
            }

            if (attendance.clockOut?.time) {
                return NextResponse.json(
                    { success: false, error: 'Employee already clocked out today', attendance },
                    { status: 400 }
                );
            }

            // Update clock out
            attendance.clockOut = {
                time: now,
                location: {
                    latitude: location.latitude || 0,
                    longitude: location.longitude || 0,
                    accuracy: location.accuracy || 0,
                },
                faceImage: image,
                faceMatchScore: verification.matchScore,
                deviceInfo,
            };

            if (verification.suspicious) {
                attendance.suspicious = true;
                attendance.suspiciousFlags = [
                    ...attendance.suspiciousFlags,
                    ...verification.suspiciousFlags,
                ];
            }

            await attendance.save();

            return NextResponse.json({
                success: true,
                message: `${employee.name} clocked out successfully`,
                attendance,
                verification: {
                    matchScore: verification.matchScore,
                    qualityScore: verification.qualityScore,
                    suspicious: verification.suspicious,
                },
                workingHours: attendance.workingHours,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Admin mark attendance error:', error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || 'Failed to mark attendance',
            },
            { status: 500 }
        );
    }
}
