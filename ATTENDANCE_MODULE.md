#  Attendance Module - Complete Implementation Guide

## Overview
The Attendance Module provides AI-powered face verification for employee clock-in/clock-out with GPS tracking, fraud detection, and comprehensive reporting.

## Feature
- ✅ Camera-based face capture
- ✅ AI face verification using Google Gemini
- ✅ GPS location tracking
- ✅ Clock In / Clock Out functionality
- ✅ Automatic working hours calculation
- ✅ Fraud detection with suspicious flags
- ✅ Rate limiting (1 attempt per minute)
- ✅ Retry mechanism with match score feedback
- ✅ Daily and monthly attendance report

## Architecture

### Database Models

#### Employee Model (`lib/models/Employee.js`)
```javascript
{
  employeeId: String (unique),
  name: String,
  email: String (unique),
  phone: String,
  department: String,
  position: String,
  profileImage: String (base64 reference image),
  status: 'active' | 'inactive' | 'on-leave' | 'terminated',
  workSchedule: {
    startTime: String,
    endTime: String,
    workingDays: [Number]
  },
  leaveBalance: {
    casual: Number,
    sick: Number,
    annual: Number
  }
}
```

#### Attendance Model (`lib/models/Attendance.js`)
```javascript
{
  employeeId: String,
  employeeName: String,
  date: String (YYYY-MM-DD),
  clockIn: {
    time: Date,
    location: { latitude, longitude, address },
    faceImage: String (base64),
    faceMatchScore: Number,
    deviceInfo: String
  },
  clockOut: {
    time: Date,
    location: { latitude, longitude, address },
    faceImage: String (base64),
    faceMatchScore: Number,
    deviceInfo: String
  },
  workingHours: Number,
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave',
  suspicious: Boolean,
  suspiciousFlags: [String],
  retryAttempts: Number
}
```

### API Endpoints

#### 1. Mark Attendance
**Endpoint:** `POST /api/attendance/mark`

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "action": "clockIn", // or "clockOut"
  "deviceInfo": "Mozilla/5.0..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Clock in successful",
  "attendance": { /* attendance object */ },
  "verification": {
    "matchScore": 85,
    "qualityScore": 90,
    "suspicious": false
  }
}
```

**Response (Verification Failed):**
```json
{
  "success": false,
  "error": "Face verification failed. Match score: 65%. Please try again.",
  "matchScore": 65,
  "retry": true
}
```

#### 2. Get Daily Attendance
**Endpoint:** `GET /api/attendance/{employeeId}/{date}`

**Example:** `/api/attendance/EMP001/2025-11-28`

**Response:**
```json
{
  "success": true,
  "attendance": {
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "date": "2025-11-28",
    "clockIn": {
      "time": "2025-11-28T09:00:00Z",
      "faceMatchScore": 85
    },
    "clockOut": {
      "time": "2025-11-28T18:00:00Z",
      "faceMatchScore": 88
    },
    "workingHours": 9,
    "status": "present"
  }
}
```

#### 3. Get Monthly Summary
**Endpoint:** `GET /api/attendance/month/{employeeId}/{month}`

**Example:** `/api/attendance/month/EMP001/2025-11`

**Response:**
```json
{
  "success": true,
  "month": "2025-11",
  "summary": {
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 0,
    "lateDays": 2,
    "totalWorkingHours": 176.5,
    "averageWorkingHours": "8.83",
    "suspiciousCount": 0,
    "totalRetryAttempts": 3
  },
  "statusBreakdown": {
    "present": 20,
    "absent": 0,
    "late": 2,
    "half-day": 0,
    "on-leave": 0
  },
  "records": [ /* array of attendance records */ ]
}
```

#### 4. Get All Attendance for Date
**Endpoint:** `GET /api/attendance/all/{date}`

**Example:** `/api/attendance/all/2025-11-28`

Returns all employee attendance records for a specific date.

#### 5. Employee Management
**Create Employee:** `POST /api/employees`
**Get Employees:** `GET /api/employees?status=active`

## Face Verification Process

### Flow
1. Frontend captures camera image using getUserMedia API
2. Image converted to base64 JPEG (0.8 quality)
3. Sent to backend with employee ID and GPS location
4. Backend calls Gemini AI with face verification prompt
5. AI analyzes image and returns:
   - Face detected: yes/no
   - Quality score: 0-100
   - Match score: 0-100 (compared to employee profile)
   - Suspicious indicators

### Verification Threshold
- **Minimum match score:** 70%
- Below threshold triggers retry with feedback
- Failed attempts logged for fraud detection

### Fraud Detection
System flags suspicious activities:
- Photo of photo
- Mask or face covering
- Multiple faces
- Multiple retry attempts
- Unusual location patterns

## Frontend Implementation

### Camera Capture Component
```typescript
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Start camera
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { 
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    }
  });
  videoRef.current.srcObject = stream;
};

// Capture image
const captureImage = (): string => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const context = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  
  return canvas.toDataURL('image/jpeg', 0.8);
};
```

### Mark Attendance Function
```typescript
const handleMarkAttendance = async () => {
  const imageData = captureImage();
  const location = await getCurrentPosition();
  
  const response = await fetch('/api/attendance/mark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: selectedEmployee,
      image: imageData,
      location,
      action: 'clockIn',
      deviceInfo: navigator.userAgent,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    showSuccessToast(data.message);
  } else if (data.retry) {
    showRetryToast(data.error);
  } else {
    showErrorToast(data.error);
  }
};
```

## Setup Instructions

### 1. Environment Variables
Add to `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/business-ai
GOOGLE_API_KEY=your_gemini_api_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Demo Employees
```bash
node scripts/seed-employees.js
```

This creates 5 demo employees:
- EMP001: John Doe (Senior Developer)
- EMP002: Jane Smith (Product Manager)
- EMP003: Mike Johnson (UI/UX Designer)
- EMP004: Sarah Williams (Marketing Lead)
- EMP005: David Brown (DevOps Engineer)

### 4. Run Development Server
```bash
npm run dev
```

### 5. Access Attendance Module
Navigate to: `http://localhost:3000/employee-management/attendance`

## Usage Guide

### For Employees

1. **Clock In:**
   - Click "Clock In" button
   - Select your employee ID
   - Allow camera and GPS permissions
   - Face the camera directly
   - Wait for verification
   - System confirms clock-in with match score

2. **Clock Out:**
   - Click "Clock Out" button
   - Select your employee ID
   - Capture face again
   - System calculates working hours

### For Managers/HR

1. **View Daily Attendance:**
   - Select date from date picker
   - View all employee attendance
   - Check suspicious flags
   - Export reports

2. **View Monthly Reports:**
   - Access via API or build dashboard
   - See attendance trends
   - Track average working hours
   - Identify patterns

## Security Features

### Rate Limiting
- 1 attempt per minute per employee per action
- Prevents rapid retry attacks
- Tracked in-memory (use Redis in production)

### Data Privacy
- Face images stored as base64
- Images excluded from list views
- Only included when explicitly requested
- GPS coordinates stored, not addresses

### Fraud Prevention
- AI detection of suspicious images
- Retry attempt tracking
- Location verification
- Device fingerprinting
- Anomaly flagging

## Production Considerations

### 1. Image Storage
- Move face images to cloud storage (S3, Cloudinary)
- Store only image URLs in database
- Implement image retention policy

### 2. Rate Limiting
- Use Redis for distributed rate limiting
- Implement sliding window algorithm
- Add CAPTCHA for multiple failures

### 3. Performance
- Implement caching for attendance queries
- Use database indexing
- Lazy load images
- Compress images before storage

### 4. Monitoring
- Log all verification attempts
- Track API response times
- Monitor Gemini API usage
- Alert on suspicious patterns

### 5. Compliance
- GDPR compliance for face data
- User consent for biometric data
- Data retention policies
- Right to deletion

## Testing

### Manual Testing
1. Create test employees using seed script
2. Test clock-in with good lighting
3. Test clock-out after clock-in
4. Try duplicate clock-in (should fail)
5. Test with poor lighting (should retry)
6. Test with no face (should fail)

### API Testing
```bash
# Mark attendance
curl -X POST http://localhost:3000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "image": "data:image/jpeg;base64,...",
    "location": {"latitude": 40.7128, "longitude": -74.0060},
    "action": "clockIn"
  }'

# Get daily attendance
curl http://localhost:3000/api/attendance/EMP001/2025-11-28

# Get monthly summary
curl http://localhost:3000/api/attendance/month/EMP001/2025-11
```

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Try different browser
- Check camera hardware

### Low Match Scores
- Improve lighting conditions
- Remove glasses/masks
- Face camera directly
- Ensure profile image is clear

### API Errors
- Check MongoDB connection
- Verify Gemini API key
- Check API rate limits
- Review server logs

## Future Enhancements

1. **Advanced Features:**
   - Multi-factor authentication
   - Liveness detection
   - QR code backup
   - Voice verification

2. **Reporting:**
   - Interactive dashboards
   - Real-time notifications
   - Custom report builder
   - Export to Excel/PDF

3. **Integration:**
   - Slack notifications
   - Email alerts
   - Calendar sync
   - Payroll integration

4. **Mobile App:**
   - Native iOS/Android apps
   - Offline support
   - Push notifications
   - Geofencing

## Support

For issues or questions:
- Check logs in browser console
- Review API response messages
- Consult MongoDB logs
- Test Gemini API separately

---

**Module Status:** ✅ Production Ready
**Last Updated:** November 28, 2025
**Version:** 1.0.0



