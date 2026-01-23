// Test script to simulate employee location tracking
// const fetch = require('node-fetch'); // Use global fetch in Node 18+

const BASE_URL = 'http://localhost:3000';

// Simulate location updates for an employee
async function simulateTracking() {
    console.log('🗺️  Starting location tracking simulation...\n');

    // Test employee
    const employeeId = 'EMP001';

    // Simulate movement around a central point (office location)
    const centerLat = 28.6139; // Delhi example
    const centerLng = 77.2090;

    let currentLat = centerLat;
    let currentLng = centerLng;
    let speed = 0;
    let heading = 0;

    const activities = ['working', 'break', 'meeting', 'traveling'];
    const statuses = ['active', 'idle', 'away'];

    for (let i = 0; i < 10; i++) {
        // Simulate slight movement (random walk)
        const latChange = (Math.random() - 0.5) * 0.001; // ~100m
        const lngChange = (Math.random() - 0.5) * 0.001;

        currentLat += latChange;
        currentLng += lngChange;

        speed = Math.random() * 50; // 0-50 km/h
        heading = Math.random() * 360; // 0-360 degrees

        const activity = activities[Math.floor(Math.random() * activities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const batteryLevel = 100 - (i * 5); // Simulate battery drain

        const trackingData = {
            employeeId,
            location: {
                latitude: currentLat,
                longitude: currentLng,
                accuracy: Math.random() * 20 + 5, // 5-25m accuracy
            },
            status,
            activity,
            batteryLevel,
            speed: speed.toFixed(1),
            heading: heading.toFixed(0),
            deviceInfo: 'Test Device / Node.js Script',
        };

        try {
            const response = await fetch(`${BASE_URL}/api/tracking/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trackingData),
            });

            const result: any = await response.json();

            if (result.success) {
                console.log(`✅ Update ${i + 1}/10: ${status} - ${activity}`);
                console.log(`   📍 Location: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`);
                console.log(`   🚗 Speed: ${speed.toFixed(1)} km/h | 🔋 Battery: ${batteryLevel}%`);
                console.log(`   ✓ Inside Geofence: ${result.tracking.isInsideGeofence}`);
            } else {
                console.log(`❌ Update ${i + 1}/10 failed:`, result.error);
            }
        } catch (error: any) {
            console.error(`❌ Error updating location:`, error.message);
        }

        console.log('');

        // Wait 2 seconds between updates
        if (i < 9) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n🎉 Tracking simulation completed!');
    console.log('\n📊 View tracking data:');
    console.log(`   Dashboard: ${BASE_URL}/employee-management/tracking`);
    console.log(`   API: ${BASE_URL}/api/tracking/update?type=all`);
}

// Get current tracking data
async function getTrackingData() {
    console.log('📡 Fetching current tracking data...\n');

    try {
        const response = await fetch(`${BASE_URL}/api/tracking/update?type=all`);
        const result: any = await response.json();

        if (result.success) {
            console.log(`✅ Found ${result.count} active employees:\n`);

            result.employees.forEach((emp: any) => {
                console.log(`👤 ${emp.employeeName} (${emp.employeeId})`);
                console.log(`   Status: ${emp.status} | Activity: ${emp.activity}`);
                console.log(`   Location: ${emp.location.latitude.toFixed(6)}, ${emp.location.longitude.toFixed(6)}`);
                console.log(`   Last active: ${new Date(emp.lastActive).toLocaleString()}`);
                console.log('');
            });
        } else {
            console.log('❌ Failed to fetch tracking data:', result.error);
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

// Get movement history
async function getHistory(employeeId: string) {
    console.log(`📈 Fetching movement history for ${employeeId}...\n`);

    try {
        const response = await fetch(`${BASE_URL}/api/tracking/history/${employeeId}?hours=24`);
        const result: any = await response.json();

        if (result.success) {
            const { history } = result;
            console.log(`✅ Movement History for ${history.employeeName}:\n`);
            console.log(`   📍 Total Points: ${history.statistics.totalPoints}`);
            console.log(`   🚗 Distance Traveled: ${history.statistics.totalDistance} km`);
            console.log(`   ⚡ Max Speed: ${history.statistics.maxSpeed} km/h`);
            console.log(`   ⏱️  Duration: ${history.statistics.duration} hours`);
        } else {
            console.log('❌ Failed to fetch history:', result.error);
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

// Main
const command = process.argv[2];
const employeeId = process.argv[3];

console.log('═══════════════════════════════════════════');
console.log('   🗺️  Employee Location Tracking Test   ');
console.log('═══════════════════════════════════════════\n');

if (command === 'simulate') {
    simulateTracking();
} else if (command === 'view') {
    getTrackingData();
} else if (command === 'history' && employeeId) {
    getHistory(employeeId);
} else {
    console.log('Usage:');
    console.log('  node scripts/test-tracking.js simulate    - Simulate 10 location updates');
    console.log('  node scripts/test-tracking.js view        - View current tracking data');
    console.log('  node scripts/test-tracking.js history EMP001 - View movement history');
    console.log('');
}
