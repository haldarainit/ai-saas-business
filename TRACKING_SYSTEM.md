# 🗺️ Real-Time Employee Tracking System

## Overview

A complete GPS-based live tracking system for monitoring employee locations, activities, and movements in real-time with geofencing alerts and movement analytics.

---

## 🎯 Features

### ✅ Core Features
- **Live GPS Tracking** - Real-time location updates every 10 seconds
- **Activity Monitoring** - Track employee status (active, idle, away, offline)
- **Movement History** - Complete route tracking with distance and speed analytics
- **Geofencing** - Set boundaries and receive alerts when employees leave designated areas
- **Battery Monitoring** - Track device battery levels
- **Speed & Direction** - Monitor employee movement speed and heading

### ✅ Dashboard Features
- **Interactive Map** - Google Maps integration with employee markers
- **Auto-Refresh** - Live updates every 10 seconds (can be toggled)
- **Employee List** - Real-time status of all tracked employees
- **Detailed View** - Individual employee tracking with full details
- **Statistics** - Movement analytics (distance, speed, location count)
- **Violation Alerts** - Visual alerts for geofence violations

---

## 📁 File Structure

```
app/
├── employee-management/
│   └── tracking/
│       └── page.tsx                 # Live tracking dashboard
├── api/
    └── tracking/
        ├── update/
        │   └── route.js              # POST location updates, GET live data
        └── history/
            └── [employeeId]/
                └── route.js          # GET movement history

lib/
└── models/
    ├── LocationTracking.js           # Tracking data schema
    └── Employee.js                   # Employee with geofence config

scripts/
└── test-tracking.js                  # Testing & simulation script
```

---

## 🗄️ Database Schema

### LocationTracking Model

```javascript
{
  employeeId: "EMP001",
  employeeName: "John Doe",
  location: {
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 15.5          // GPS accuracy in meters
  },
  address: "123 Main St",   // Optional reverse geocoded address
  status: "active",         // active | idle | away | offline
  activity: "working",      // working | break | meeting | traveling | unknown
  batteryLevel: 85,         // 0-100%
  speed: 15.5,              // km/h
  heading: 180,             // Degrees (0-360)
  isInsideGeofence: true,
  geofenceViolation: {
    violated: false,
    timestamp: Date,
    location: { lat, lng }
  },
  deviceInfo: "iPhone 14",
  lastActive: Date,
  timestamp: Date
}
```

### Employee Model (Geofence Config)

```javascript
{
  employeeId: "EMP001",
  name: "John Doe",
  // ... other fields
  geofence: {
    enabled: true,
    center: {
      latitude: 28.6139,     // Office location
      longitude: 77.2090
    },
    radius: 1000             // Meters (1km)
  }
}
```

---

## 🚀 API Endpoints

### 1. Update Location (POST)

**Endpoint:** `/api/tracking/update`

**Body:**
```json
{
  "employeeId": "EMP001",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 15.5
  },
  "status": "active",
  "activity": "working",
  "batteryLevel": 85,
  "speed": 15.5,
  "heading": 180,
  "deviceInfo": "iPhone 14"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "tracking": {
    "employeeId": "EMP001",
    "location": { "latitude": 28.6139, "longitude": 77.2090 },
    "status": "active",
    "isInsideGeofence": true,
    "timestamp": "2025-11-28T10:30:00Z"
  }
}
```

### 2. Get Live Tracking (GET)

**Endpoint:** `/api/tracking/update?type=all`

**Response:**
```json
{
  "success": true,
  "employees": [
    {
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "location": { "latitude": 28.6139, "longitude": 77.2090 },
      "status": "active",
      "activity": "working",
      "lastActive": "2025-11-28T10:30:00Z",
      "batteryLevel": 85,
      "isInsideGeofence": true
    }
  ],
  "count": 1
}
```

### 3. Get Movement History (GET)

**Endpoint:** `/api/tracking/history/EMP001?hours=24`

**Response:**
```json
{
  "success": true,
  "history": {
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "startDate": "2025-11-27T10:30:00Z",
    "endDate": "2025-11-28T10:30:00Z",
    "locations": [
      {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timestamp": "2025-11-28T09:00:00Z",
        "status": "active",
        "activity": "working"
      }
    ],
    "statistics": {
      "totalPoints": 120,
      "totalDistance": 5.45,   // km
      "maxSpeed": 45.2,        // km/h
      "duration": 24           // hours
    }
  }
}
```

---

## 💻 Frontend Usage

### Access the Dashboard

```
http://localhost:3000/employee-management/tracking
```

### Features:
1. **Auto-refresh** - Updates every 10 seconds
2. **Employee List** - Left sidebar shows all active employees
3. **Map View** - Click employee to see their location on map
4. **Statistics** - View active/idle/away counts
5. **Details Panel** - Shows full employee tracking details
6. **Movement Stats** - Distance traveled, max speed, location count

---

## 🧪 Testing

### Option 1: Run Simulation Script

```bash
# Simulate 10 location updates for EMP001
npm run test:tracking

# View current tracking data
npm run tracking:view

# View movement history
node scripts/test-tracking.js history EMP001
```

### Option 2: Manual API Testing

**Update Location:**
```bash
curl -X POST http://localhost:3000/api/tracking/update \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "accuracy": 15
    },
    "status": "active",
    "activity": "working",
    "batteryLevel": 85
  }'
```

**Get Live Data:**
```bash
curl http://localhost:3000/api/tracking/update?type=all
```

---

## 🎯 How It Works

### 1. Location Update Flow

```
Employee Device (GPS)
         ↓
Browser/App captures location
         ↓
POST /api/tracking/update
         ↓
Backend validates employee
         ↓
Check geofence boundaries
         ↓
Save to LocationTracking collection
         ↓
Return success + geofence status
```

### 2. Live Dashboard Flow

```
Dashboard loads
         ↓
GET /api/tracking/update?type=all
         ↓
Fetch latest locations for all employees
         ↓
Display on map + employee list
         ↓
Auto-refresh every 10 seconds
         ↓
Update UI with new positions
```

### 3. Geofencing Logic

```javascript
// Check if employee is inside radius
function isInsideGeofence(empLat, empLng, geofence) {
  const distance = calculateDistance(
    empLat, empLng,
    geofence.center.latitude, geofence.center.longitude
  );
  
  return distance <= geofence.radius; // Returns true/false
}

// If outside boundary:
if (!isInsideGeofence) {
  tracking.geofenceViolation = {
    violated: true,
    timestamp: new Date(),
    location: { latitude: empLat, longitude: empLng }
  };
  // Can trigger alerts, notifications, etc.
}
```

---

## 🔧 Configuration

### Enable Geofencing for Employee

```javascript
// Update employee with geofence
await Employee.findOneAndUpdate(
  { employeeId: 'EMP001' },
  {
    geofence: {
      enabled: true,
      center: {
        latitude: 28.6139,   // Office location
        longitude: 77.2090
      },
      radius: 1000           // 1km radius
    }
  }
);
```

### Google Maps Integration

Add to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Get API key from: https://console.cloud.google.com/

---

## 📊 Data Retention

- **Auto-deletion:** Tracking data older than 30 days is automatically deleted (TTL index)
- **Modify retention:**

```javascript
// In LocationTracking model
LocationTrackingSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 2592000 } // 30 days (change this value)
);
```

---

## 🚨 Geofence Alerts

### Current Implementation:
- Violations are **flagged** in the database
- UI shows **red warning badge**
- Can be extended to:
  - Send email alerts
  - SMS notifications
  - Push notifications
  - Webhook triggers

### Example Alert Extension:

```javascript
// In /api/tracking/update/route.js
if (!isInside && geofence.enabled) {
  trackingData.geofenceViolation = { violated: true, ... };
  
  // Send alert (add this)
  await sendAlert({
    type: 'geofence_violation',
    employeeId,
    employeeName: employee.name,
    location: { lat, lng },
    timestamp: new Date()
  });
}
```

---

## 📱 Mobile Integration (Future)

For production mobile apps:

1. **Background Location:**
   - iOS: CoreLocation with background modes
   - Android: WorkManager for periodic updates

2. **Battery Optimization:**
   - Reduce update frequency when idle
   - Use geofencing API for efficient monitoring

3. **Offline Support:**
   - Queue locations locally
   - Sync when connection restored

---

## 🎨 UI Components

### Status Colors:
- 🟢 **Active** - Employee is working
- 🟡 **Idle** - No activity detected
- 🟠 **Away** - Employee marked as away
- ⚫ **Offline** - No location updates (5+ min)

### Activity Icons:
- 💼 **Working** - Regular work
- ☕ **Break** - On break
- 👥 **Meeting** - In meeting
- 🚗 **Traveling** - Moving/commuting

---

## 🔐 Security Considerations

1. **Authentication:** Ensure only authorized employees can be tracked
2. **Privacy:** Inform employees about tracking (compliance)
3. **Data Access:** Restrict who can view tracking data
4. **Geolocation Permissions:** Request browser/app permissions
5. **HTTPS:** Always use secure connections for location data

---

## 📈 Statistics & Analytics

### Available Metrics:
- Total distance traveled (km)
- Maximum speed recorded (km/h)
- Number of location points
- Time spent in different activities
- Geofence violations count
- Battery consumption patterns

---

## 🎉 Quick Start

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Access tracking dashboard:**
   ```
   http://localhost:3000/employee-management/tracking
   ```

3. **Simulate tracking data:**
   ```bash
   npm run test:tracking
   ```

4. **View results:** Refresh dashboard to see simulated employee moving on map!

---

## 🐛 Troubleshooting

### No employees showing:
- Ensure employees exist in database (`npm run seed:employees`)
- Check if location updates are being sent
- Verify MongoDB connection

### Map not loading:
- Add Google Maps API key to `.env.local`
- Fallback: "Open in Google Maps" button still works

### Geofence not working:
- Verify employee has geofence configured
- Check `geofence.enabled` is `true`
- Ensure location is outside radius for violation

---

## 📚 Related Documentation

- [Attendance Module](./ATTENDANCE_MODULE.md)
- [MongoDB Setup](./MONGODB_SETUP.md)
- [Employee Management](./app/employee-management/README.md)

---

**Built with ❤️ for real-time employee monitoring**
