# 🎯 Attendance Module - Quick Start Guide

## ✅ What's Been Built

A complete AI-powered attendance management system with:
- 📸 Camera-based face capture
- 🤖 AI face verification using Google Gemini
- 📍 GPS location tracking
- ⏰ Clock In/Out with automatic hours calculation
- 🚨 Fraud detection
- 📊 Daily and monthly reports

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create or update `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/business-ai
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Step 3: Seed Demo Employees
```bash
npm run seed:employees
```

This creates 5 test employees (EMP001 - EMP005).

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Test the Module
Open: `http://localhost:3000/employee-management/attendance`

## 🧪 Testing

### Option 1: Use the UI
1. Navigate to `/employee-management/attendance`
2. Click "Clock In" button
3. Select an employee (EMP001 - EMP005)
4. Allow camera permissions
5. Capture your face
6. View results and match score

### Option 2: Test APIs Directly
```bash
node scripts/test-attendance-api.js
```

## 📁 Files Created

### Backend
- `lib/models/Employee.js` - Employee schema
- `lib/models/Attendance.js` - Attendance schema
- `app/api/attendance/mark/route.js` - Mark attendance endpoint
- `app/api/attendance/[employeeId]/[date]/route.js` - Get daily attendance
- `app/api/attendance/month/[employeeId]/[month]/route.js` - Monthly summary
- `app/api/attendance/all/[date]/route.js` - All attendance for date
- `app/api/employees/route.js` - Employee management

### Frontend
- `app/employee-management/attendance/page.tsx` - Updated with camera capture

### Scripts
- `scripts/seed-employees.js` - Create demo employees
- `scripts/test-attendance-api.js` - API testing script

### Documentation
- `ATTENDANCE_MODULE.md` - Complete technical documentation

## 🎯 Key Features

### 1. Face Verification Flow
```
Camera → Capture → Base64 → API → Gemini AI → Verification → Database
```

### 2. Verification Logic
- Minimum match score: **70%**
- Below threshold → Retry allowed
- Failed attempts logged for fraud detection

### 3. Rate Limiting
- 1 attempt per minute per employee
- Prevents brute force attacks

### 4. Fraud Detection
System flags:
- Photo of photo
- Face masks
- Multiple faces
- Unusual retry patterns

## 📊 API Endpoints

### Mark Attendance
```bash
POST /api/attendance/mark
Body: {
  "employeeId": "EMP001",
  "image": "data:image/jpeg;base64,...",
  "location": { "latitude": 40.7128, "longitude": -74.0060 },
  "action": "clockIn"
}
```

### Get Daily Attendance
```bash
GET /api/attendance/EMP001/2025-11-28
```

### Get Monthly Summary
```bash
GET /api/attendance/month/EMP001/2025-11
```

### Get All Attendance (All Employees)
```bash
GET /api/attendance/all/2025-11-28
```

## 🔧 Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS (or localhost)
- Check browser permissions
- Try a different browser

### Low Match Scores
The system uses AI for verification. For testing:
- Ensure good lighting
- Face the camera directly
- Remove glasses/masks
- The system may flag test images as low quality

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If not installed, use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env.local
```

### Gemini API Issues
- Verify API key is correct
- Check API quota/limits
- Ensure billing is enabled on Google Cloud

## 📱 Usage Examples

### Employee Clock-In
```typescript
// Frontend code
const handleClockIn = async () => {
  const image = captureImage(); // from camera
  const location = await getGPSLocation();
  
  const response = await fetch('/api/attendance/mark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: 'EMP001',
      image,
      location,
      action: 'clockIn'
    })
  });
  
  const result = await response.json();
  console.log('Match score:', result.verification.matchScore);
};
```

### Manager View Attendance
```typescript
// Get today's attendance
const today = new Date().toISOString().split('T')[0];
const response = await fetch(`/api/attendance/all/${today}`);
const data = await response.json();

console.log('Present today:', data.summary.present);
console.log('Total employees:', data.summary.total);
```

## 🎨 UI Features

### Attendance Page
- Real-time camera feed
- Employee selection dropdown
- Live verification feedback
- Match score display
- Attendance table with filters
- Daily statistics cards

### Camera Dialog
- HD video preview
- Capture button
- Instructions panel
- Loading states
- Error handling

## 📈 Next Steps

### Immediate
1. Test with real employees
2. Add profile images for employees
3. Configure work schedule rules
4. Set up late arrival detection

### Phase 2
1. Advanced reporting dashboard
2. Email notifications
3. Mobile app support
4. Geofencing validation

### Phase 3
1. Integration with payroll
2. Leave system integration
3. Performance analytics
4. Predictive insights

## 🔐 Security Notes

- Face images stored as base64 (move to cloud storage in production)
- GPS coordinates logged for audit
- Rate limiting prevents abuse
- Suspicious activity flagged
- Device fingerprinting tracked

## 📚 Additional Resources

- Full documentation: `ATTENDANCE_MODULE.md`
- API examples: `scripts/test-attendance-api.js`
- Gemini AI docs: `utils/gemini.js`

## ✨ Demo Employees

Created by seed script:

| ID | Name | Department | Position |
|---|---|---|---|
| EMP001 | John Doe | Engineering | Senior Developer |
| EMP002 | Jane Smith | Product | Product Manager |
| EMP003 | Mike Johnson | Design | UI/UX Designer |
| EMP004 | Sarah Williams | Marketing | Marketing Lead |
| EMP005 | David Brown | Engineering | DevOps Engineer |

## 🎉 Ready to Use!

The attendance module is fully functional and ready for testing. Navigate to:

**http://localhost:3000/employee-management/attendance**

---

**Questions?** Check the full documentation in `ATTENDANCE_MODULE.md`
