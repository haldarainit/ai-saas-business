import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { GoogleGenAI } from "@google/genai";
import jwt from 'jsonwebtoken';

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map();

// Helper to check rate limit
function checkRateLimit(employeeId, type = 'clockIn') {
  const key = `${employeeId}-${type}`;
  const now = Date.now();
  const lastAttempt = rateLimitMap.get(key);
  
  // Allow one attempt every 10 seconds (more lenient for testing)
  if (lastAttempt && now - lastAttempt < 10000) {
    return false;
  }
  
  rateLimitMap.set(key, now);
  return true;
}

// Helper to clean old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value > 300000) { // 5 minutes
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// Helper to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper to perform face verification
async function verifyFace(base64Image, referenceImage, employeeName, skipAI = false) {
  try {
    // SECURITY: Never skip verification in production
    const shouldSkipAI = process.env.ENABLE_AI_FACE_VERIFICATION !== 'true';
    
    if (skipAI || shouldSkipAI) {
      console.error('⚠️ SECURITY WARNING: Face verification is disabled! This is a security risk.');
      // Fail-secure: Reject if verification is disabled
      return {
        faceDetected: false,
        qualityScore: 0,
        matchScore: 0,
        suspicious: true,
        suspiciousFlags: ['Verification disabled - security risk'],
        analysis: 'Face verification is disabled. Please enable ENABLE_AI_FACE_VERIFICATION=true for security.',
      };
    }
    
    if (!referenceImage) {
      console.error('No reference image provided for employee:', employeeName);
      return {
        faceDetected: false,
        qualityScore: 0,
        matchScore: 0,
        suspicious: true,
        suspiciousFlags: ['No reference image available'],
        analysis: 'Employee has no registered profile image',
      };
    }
    
    console.log('🤖 Using AI face verification with Gemini - Comparing faces');

    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const cleanReference = referenceImage.replace(/^data:image\/\w+;base64,/, '');
    
    // CRITICAL: Compare the two images to verify they are the same person
    const prompt = `You are a security system performing face verification. Compare these TWO images:

IMAGE 1 (Reference - Registered Employee): This is the registered profile photo of employee "${employeeName}".

IMAGE 2 (Current - Clock In Attempt): This is a photo taken during clock in attempt.

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
- Reject if faces look different
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

    // Initialize Gemini API
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
    
    let modelName = null;
    for (const model of AVAILABLE_MODELS) {
      try {
        // Test if model works
        await genAI.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: "test" }] }],
        });
        modelName = model;
        break;
      } catch (e) {
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
      { text: '\n\nCurrent Image (Clock In Attempt):' },
      { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
      { text: '\n\n' + prompt }
    ];
    
    // Call Gemini with both images for comparison
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts }],
    });
    
    // Extract text from response
    let response = '';
    try {
      if (result?.response?.text) {
        response = typeof result.response.text === "function" ? result.response.text() : result.response.text;
      } else if (result?.candidates?.[0]?.content?.parts) {
        response = result.candidates[0].content.parts.map(p => p.text || '').join('');
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
        
        // SECURITY: Be strict with match scores
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
    
    // Fallback: Analyze text response for security indicators
    const lowerResponse = response.toLowerCase();
    
    // Look for positive indicators (same person)
    const positiveIndicators = [
      'same person',
      'matches',
      'same face',
      'identical',
      'recognized',
      'verified',
      'match score',
    ];
    
    // Look for negative indicators (different person)
    const negativeIndicators = [
      'different person',
      'not the same',
      'does not match',
      'different face',
      'not recognized',
      'verification failed',
      'no match',
    ];
    
    const hasPositive = positiveIndicators.some(ind => lowerResponse.includes(ind));
    const hasNegative = negativeIndicators.some(ind => lowerResponse.includes(ind));
    
    // Extract match score from response if mentioned
    const scoreMatch = response.match(/matchScore[:\s]+(\d+)/i) || response.match(/(\d+)%?\s*(?:match|similarity|score)/i);
    const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    // Determine face detection and match score
    const faceDetected = !lowerResponse.includes('no face') && !lowerResponse.includes('not detected');
    let matchScore = extractedScore || (hasPositive && !hasNegative ? 75 : hasNegative ? 30 : 50);
    
    // Be conservative - if uncertain, use lower score
    if (!hasPositive && !hasNegative) {
      matchScore = Math.min(matchScore, 60); // Default to uncertain if no clear indicators
    }
    
    const suspicious = 
      lowerResponse.includes('suspicious') ||
      lowerResponse.includes('photo of photo') ||
      lowerResponse.includes('mask') ||
      lowerResponse.includes('multiple faces') ||
      matchScore < 75;
    
    return {
      faceDetected,
      qualityScore: faceDetected ? 75 : 30,
      matchScore: matchScore,
      suspicious,
      suspiciousFlags: suspicious ? ['Uncertain verification result'] : [],
      analysis: response.substring(0, 500),
    };
  } catch (error) {
    console.error('Face verification error:', error);
    // SECURITY: Fail-secure - reject on error
    return {
      faceDetected: false,
      qualityScore: 0,
      matchScore: 0,
      suspicious: true,
      suspiciousFlags: ['Verification error - rejected for security'],
      analysis: `Error during verification: ${error.message}. Attendance rejected for security.`,
    };
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    // Get token from Authorization header (for employee authentication)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

    // Verify employee token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      employeeId, 
      image, // base64 image
      location, 
      action = 'clockIn', // 'clockIn' or 'clockOut'
      deviceInfo 
    } = body;

    // Validate required fields
    if (!employeeId || !image) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and image are required' },
        { status: 400 }
      );
    }

    // Check rate limit (skip in development for easier testing)
    if (process.env.NODE_ENV === 'production' && !checkRateLimit(employeeId, action)) {
      return NextResponse.json(
        { success: false, error: 'Please wait 10 seconds before trying again' },
        { status: 429 }
      );
    }

    // Verify that the employee can only mark their own attendance
    if (decoded.employeeId !== employeeId) {
      return NextResponse.json(
        { success: false, error: 'You can only mark your own attendance' },
        { status: 403 }
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
      employee.name,
      false // Don't skip - let the function decide based on env
    );

    console.log('Verification result:', {
      faceDetected: verification.faceDetected,
      qualityScore: verification.qualityScore,
      matchScore: verification.matchScore,
      suspicious: verification.suspicious,
    });

    if (!verification.faceDetected) {
      console.log('Face not detected, rejecting');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No clear face detected in image. Please ensure good lighting and try again.',
          retry: true,
          verification: {
            faceDetected: false,
            analysis: verification.analysis,
          }
        },
        { status: 400 }
      );
    }

    // SECURITY: Strict match threshold - must be at least 75% to pass
    // This ensures only the actual employee can clock in
    const MATCH_THRESHOLD = 75; // Same threshold for all environments for security
    if (verification.matchScore < MATCH_THRESHOLD) {
      console.log(`Match score ${verification.matchScore} below threshold ${MATCH_THRESHOLD}`);
      
      // Increment retry attempts
      const today = formatDate(new Date());
      const attendance = await Attendance.findOne({ employeeId, date: today });
      
      if (attendance) {
        attendance.retryAttempts += 1;
        await attendance.save();
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Face verification score too low: ${verification.matchScore}%. Please ensure good lighting and try again.`,
          matchScore: verification.matchScore,
          qualityScore: verification.qualityScore,
          retry: true 
        },
        { status: 400 }
      );
    }

    console.log('Verification passed! Match score:', verification.matchScore);
    console.log('Suspicious flags (non-blocking):', verification.suspiciousFlags);

    const today = formatDate(new Date());
    const now = new Date();

    if (action === 'clockIn') {
      // Check if already clocked in today
      const existingAttendance = await Attendance.findOne({ employeeId, date: today });
      
      if (existingAttendance && existingAttendance.clockIn) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Already clocked in today',
            attendance: existingAttendance 
          },
          { status: 400 }
        );
      }

      // Create or update attendance record with complete location data
      const attendanceData = {
        employeeId,
        employeeName: employee.name,
        userId: employee.userId, // Add userId for data isolation (from employee record)
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
        retryAttempts: existingAttendance?.retryAttempts || 0,
      };
      
      console.log('Storing attendance with location:', attendanceData.clockIn.location);

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
        message: 'Clock in successful',
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
          { success: false, error: 'Already clocked out today', attendance },
          { status: 400 }
        );
      }

      // Update clock out with complete location data
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
      
      console.log('Storing clock out with location:', attendance.clockOut.location);

      // Mark as suspicious if clockOut verification also flags it
      if (verification.suspicious) {
        attendance.suspicious = true;
        attendance.suspiciousFlags = [
          ...attendance.suspiciousFlags,
          ...verification.suspiciousFlags,
        ];
      }

      await attendance.save(); // This will auto-calculate workingHours

      return NextResponse.json({
        success: true,
        message: 'Clock out successful',
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
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to mark attendance',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
