# 🎯 Employee Attendance & Tracking System - Complete Guide

## 📋 Overview

This system provides **automatic location tracking** for employees after they mark their attendance. The boss/manager can monitor all employees' locations in real-time from the tracking dashboard.

---

## 🔄 Complete Workflow

### For Employees:

#### Step 1: Clock In (Attendance Page)
1. Employee goes to **Attendance page**
2. Selects their name from dropdown
3. Clicks **"Clock In"** button
4. Camera opens for face verification
5. Captures face photo
6. **GPS location is automatically captured**
7. System verifies face with AI
8. Attendance marked ✅
9. **Background location tracking starts automatically** 📍

#### What Happens Automatically:
```
Clock In → Face Verified → Attendance Marked → Location Tracking STARTS
                                                          ↓
                                               Updates every 2 minutes
                                                          ↓
                                               Boss can see location
```

#### Step 2: Work (Automatic Tracking)
- Employee's location is **automatically sent every 2 minutes**
- No action needed from employee
- Tracking happens in background
- Works even if employee closes the attendance page

#### Step 3: Clock Out
1. Employee returns to **Attendance page**
2. Clicks **"Clock Out"** button
3. Face verification again
4. Attendance updated
5. **Location tracking stops automatically** ⏹️

---

### For Boss/Manager:

#### View Live Tracking Dashboard

1. Open **Live Tracking page** (`/employee-management/tracking`)
2. See all employees who have clocked in
3. View real-time locations on map
4. Monitor activity status
5. Check geofence violations

#### Dashboard Features:
- ✅ **Live location updates** (auto-refresh every 10 seconds)
- ✅ **Employee list** with status indicators
- ✅ **Interactive map** (Google Maps integration)
- ✅ **Activity tracking** (working, break, meeting, traveling)
- ✅ **Statistics** (active/idle/away counts)
- ✅ **Movement history** (distance traveled, max speed)
- ✅ **Geofence alerts** (if employee leaves designated area)

---

## 📍 Location Tracking Details

### What Gets Tracked:

```javascript
{
  employeeId: "EMP001",
  employeeName: "John Doe",
  location: {
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 15.5       // GPS precision in meters
  },
  status: "active",      // active | idle | away
  activity: "working",   // working | break | meeting | traveling
  timestamp: "2025-11-28T10:30:00Z",
  speed: 0,              // km/h (if moving)
  heading: 0,            // Direction (0-360 degrees)
  deviceInfo: "..."      // Browser/device info
}
```

### Update Frequency:
- **Every 2 minutes** while clocked in
- **Stops automatically** when clocked out
- **High accuracy GPS** enabled
- **Background tracking** (works even if page closed)

### Data Storage:
- Stored in **MongoDB** (LocationTracking collection)
- **Auto-deleted** after 30 days (configurable)
- **Indexed** for fast queries
- **Privacy-compliant** with employee consent

---

## 🗺️ Use Cases

### 1. Work From Home Monitoring
```
Employee clocks in from home
        ↓
Boss sees employee at home location (28.6139, 77.2090)
        ↓
Location updates every 2 minutes
        ↓
Boss can verify employee is working from home
```

### 2. Field Work Tracking
```
Sales rep clocks in at office
        ↓
Travels to client locations
        ↓
Boss sees movement on map in real-time
        ↓
Can track which clients were visited
        ↓
View movement history (distance, time, route)
```

### 3. Geofencing Alerts
```
Set office geofence (1km radius)
        ↓
Employee clocks in inside geofence ✅
        ↓
Employee leaves designated area ⚠️
        ↓
Boss gets violation alert
        ↓
Can investigate why employee left area
```

---

## 💻 Technical Implementation

### Attendance Page Integration

**File:** `app/employee-management/attendance/page.tsx`

```typescript
// After successful clock-in
if (data.success && action === 'clockIn') {
  // Start background tracking
  startBackgroundTracking(employeeId, location);
  
  // Store in localStorage
  localStorage.setItem('activeTracking', {
    employeeId,
    startTime: new Date(),
    status: 'active'
  });
  
  // Send location every 2 minutes
  setInterval(sendLocationUpdate, 120000);
}
```

### Tracking Dashboard

**File:** `app/employee-management/tracking/page.tsx`

```typescript
// Auto-refresh every 10 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchLiveLocations(); // GET /api/tracking/update?type=all
  }, 10000);
}, []);
```

### API Endpoints

**POST** `/api/tracking/update` - Receive location updates
```json
{
  "employeeId": "EMP001",
  "location": { "latitude": 28.6139, "longitude": 77.2090 },
  "status": "active",
  "activity": "working"
}
```

**GET** `/api/tracking/update?type=all` - Get all tracked employees
```json
{
  "success": true,
  "employees": [
    {
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "location": { ... },
      "lastActive": "2025-11-28T10:30:00Z"
    }
  ]
}
```

---

## 🔐 Security & Privacy

### Employee Consent:
- ✅ Employees know tracking starts after clock-in
- ✅ Clear notification shown when tracking starts
- ✅ Tracking stops when clocked out
- ✅ Employees control when they work

### Data Protection:
- ✅ HTTPS encryption for all location data
- ✅ Stored securely in MongoDB
- ✅ Auto-deleted after 30 days
- ✅ Access controlled (only authorized managers)

### Browser Permissions:
- ✅ Browser asks for GPS permission
- ✅ Employee must explicitly allow
- ✅ Can be revoked anytime in browser settings

---

## 📊 Boss Dashboard Features

### Statistics Panel
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Active    │    Idle     │    Away     │ Violations  │
│      5      │      2      │      1      │      0      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Employee List (Left Sidebar)
```
👤 John Doe (EMP001)
   💼 Working | 🕐 2m ago
   🔋 85%

👤 Jane Smith (EMP002)
   ☕ Break | 🕐 5m ago
   🔋 72%

👤 Mike Johnson (EMP003)
   🚗 Traveling | 🕐 1m ago
   🔋 90%
```

### Map View (Right Panel)
- Interactive Google Maps
- Employee markers with names
- Click employee to see details
- "Open in Google Maps" button
- Real-time position updates

### Employee Details
```
📍 Location: 28.6139, 77.2090
🎯 Accuracy: 12m
🚗 Speed: 15 km/h
🧭 Heading: 180° (South)
🔋 Battery: 85%
⏱️ Last Update: 30 seconds ago
```

### Movement History
```
📊 Last 8 Hours:
   📍 120 location points
   🚗 5.4 km traveled
   ⚡ Max speed: 45 km/h
```

---

## 🧪 Testing Instructions

### Test the Complete Flow:

#### 1. Register Employee
```bash
# Go to: /employee-management/register
- Register a test employee (EMP001)
- Upload face photo
```

#### 2. Clock In
```bash
# Go to: /employee-management/attendance
- Select EMP001
- Click "Clock In"
- Capture face photo
- Wait for verification ✅
- See notification: "Location Tracking Enabled"
```

#### 3. View on Dashboard (Boss View)
```bash
# Open in another tab: /employee-management/tracking
- See EMP001 appear in employee list
- Click on employee name
- View location on map
- Watch updates every 2 minutes
```

#### 4. Simulate Movement
```bash
# Walk around with your device
# Or use simulator: /employee-management/tracking/simulator
- Location updates automatically
- Map shows movement
- Boss sees real-time position
```

#### 5. Clock Out
```bash
# Return to: /employee-management/attendance
- Click "Clock Out"
- Face verification
- Tracking stops automatically
- Employee disappears from tracking dashboard
```

---

## 🔧 Configuration

### Update Frequency

Change tracking interval in `attendance/page.tsx`:
```javascript
// Current: Every 2 minutes (120000 ms)
setInterval(sendUpdate, 120000);

// Options:
// 1 minute:  60000
// 5 minutes: 300000
// 10 minutes: 600000
```

### Geofencing

Set office location in Employee model:
```javascript
await Employee.findOneAndUpdate(
  { employeeId: 'EMP001' },
  {
    geofence: {
      enabled: true,
      center: {
        latitude: 28.6139,   // Office coordinates
        longitude: 77.2090
      },
      radius: 1000           // 1km radius
    }
  }
);
```

### Data Retention

Change auto-delete period in `LocationTracking.js`:
```javascript
// Current: 30 days
LocationTrackingSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 2592000 } // 30 days

// Options:
// 7 days:  604800
// 14 days: 1209600
// 60 days: 5184000
);
```

---

## 📱 Mobile Optimization

For production mobile apps:

### iOS (React Native):
```javascript
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';

// Enable background tracking
BackgroundGeolocation.ready({
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
  distanceFilter: 50, // Update every 50m movement
  stopTimeout: 5,
  stopOnTerminate: false,
});
```

### Android (React Native):
```javascript
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

---

## 🎯 Key Features Summary

### For Employees:
- ✅ Simple clock-in/clock-out process
- ✅ Face verification for security
- ✅ Automatic tracking (no manual action)
- ✅ Clear notifications when tracking starts/stops
- ✅ Privacy-respecting (only during work hours)

### For Boss/Manager:
- ✅ Real-time location monitoring
- ✅ All employees in one dashboard
- ✅ Interactive maps with live updates
- ✅ Activity status tracking
- ✅ Movement history and analytics
- ✅ Geofence violation alerts
- ✅ Auto-refresh every 10 seconds
- ✅ No manual setup required

---

## 🚀 Production Deployment

### Required:
1. **HTTPS** - Location API requires secure connection
2. **MongoDB** - For storing tracking data
3. **Google Maps API Key** - For map visualization
4. **Mobile App** (optional) - For better background tracking

### Environment Variables:
```env
MONGODB_URI=mongodb://...
GOOGLE_API_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
ENABLE_AI_FACE_VERIFICATION=true
```

---

## 📞 Support Scenarios

### Employee Can't Clock In:
- Check camera permissions
- Verify employee is registered
- Check GPS permissions
- Ensure good lighting for face capture

### Boss Can't See Employee:
- Check if employee has clocked in
- Verify auto-refresh is ON
- Check network connection
- Clear browser cache

### Location Not Updating:
- Verify employee hasn't clocked out
- Check GPS permissions
- Ensure device has GPS enabled
- Check browser console for errors

---

## ✅ System Benefits

### Productivity:
- Monitor work-from-home compliance
- Track field employee movements
- Verify client visits
- Optimize routes and schedules

### Security:
- Ensure employees are at authorized locations
- Geofence violations alert
- Attendance fraud prevention (face + location)
- Audit trail for compliance

### Management:
- Real-time team visibility
- Data-driven decisions
- Resource optimization
- Performance analytics

---

**Built for modern workforce management with privacy and compliance in mind** 🎯📍
