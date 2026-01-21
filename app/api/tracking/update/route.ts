import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LocationTracking from '@/lib/models/LocationTracking';
import Employee from '@/lib/models/Employee';

// Type definitions
interface Geofence {
    enabled: boolean;
    center: {
        latitude: number;
        longitude: number;
    };
    radius: number;
}

interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
}

interface LocationUpdateBody {
    employeeId: string;
    location: Location;
    status?: string;
    activity?: string;
    batteryLevel?: number;
    speed?: number;
    heading?: number;
    deviceInfo?: string;
}

interface TrackingRecord {
    employeeId: string;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    status: string;
    isInsideGeofence: boolean;
    timestamp: Date;
}

// Helper to check if location is inside geofence
function isInsideGeofence(lat: number, lng: number, geofence: Geofence): boolean {
    if (!geofence || !geofence.enabled) return true;

    // Simple radius-based geofencing
    const R = 6371; // Earth's radius in km
    const dLat = (geofence.center.latitude - lat) * Math.PI / 180;
    const dLon = (geofence.center.longitude - lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(geofence.center.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Convert to meters

    return distance <= geofence.radius;
}

// POST - Update location
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body: LocationUpdateBody = await request.json();
        const {
            employeeId,
            location,
            status = 'active',
            activity = 'working',
            batteryLevel,
            speed = 0,
            heading = 0,
            deviceInfo,
        } = body;

        // Validate required fields
        if (!employeeId || !location || !location.latitude || !location.longitude) {
            return NextResponse.json(
                { success: false, error: 'Employee ID and location are required' },
                { status: 400 }
            );
        }

        // Verify employee exists
        const employee = await Employee.findOne({ employeeId, status: 'active' });
        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found or inactive' },
                { status: 404 }
            );
        }

        // Check geofence (if configured for this employee)
        const geofence: Geofence = employee.geofence || {
            enabled: false,
            center: { latitude: 0, longitude: 0 },
            radius: 1000, // 1km default
        };

        const isInside = isInsideGeofence(
            location.latitude,
            location.longitude,
            geofence
        );

        // Create tracking record
        const trackingData = new LocationTracking({
            employeeId,
            employeeName: employee.name,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || 0,
            },
            address: location.address || '',
            status,
            activity,
            batteryLevel,
            speed,
            heading,
            isInsideGeofence: isInside,
            deviceInfo: deviceInfo || '',
            lastActive: new Date(),
            timestamp: new Date(),
        });

        // If geofence violation detected
        if (!isInside && geofence.enabled) {
            trackingData.geofenceViolation = {
                violated: true,
                timestamp: new Date(),
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
            };
        }

        await trackingData.save();

        const responseTracking: TrackingRecord = {
            employeeId: trackingData.employeeId,
            location: trackingData.location,
            status: trackingData.status,
            isInsideGeofence: trackingData.isInsideGeofence,
            timestamp: trackingData.timestamp,
        };

        return NextResponse.json({
            success: true,
            message: 'Location updated successfully',
            tracking: responseTracking,
        });
    } catch (error) {
        console.error('Location tracking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update location' },
            { status: 500 }
        );
    }
}

// GET - Get latest locations or specific employee
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const type = searchParams.get('type') || 'latest'; // 'latest' or 'all'

        if (employeeId) {
            // Get specific employee's latest location
            const tracking = await LocationTracking.getLatestLocation(employeeId);

            if (!tracking) {
                return NextResponse.json(
                    { success: false, error: 'No tracking data found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                tracking,
            });
        } else if (type === 'all') {
            // Get all active employees with their latest locations
            const activeEmployees = await LocationTracking.getActiveEmployees();

            return NextResponse.json({
                success: true,
                employees: activeEmployees,
                count: activeEmployees.length,
            });
        } else {
            // Get latest tracking data for all employees
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            const latestTracking = await LocationTracking.aggregate([
                {
                    $match: {
                        lastActive: { $gte: fiveMinutesAgo },
                    },
                },
                {
                    $sort: { timestamp: -1 },
                },
                {
                    $group: {
                        _id: '$employeeId',
                        latest: { $first: '$$ROOT' },
                    },
                },
                {
                    $replaceRoot: { newRoot: '$latest' },
                },
            ]);

            return NextResponse.json({
                success: true,
                tracking: latestTracking,
                count: latestTracking.length,
            });
        }
    } catch (error) {
        console.error('Get tracking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tracking data' },
            { status: 500 }
        );
    }
}
