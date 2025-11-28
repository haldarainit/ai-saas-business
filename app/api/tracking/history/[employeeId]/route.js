import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LocationTracking from '@/lib/models/LocationTracking';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { employeeId } = params;
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const hours = parseInt(searchParams.get('hours') || '24');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    let startDate, endDate;

    if (date) {
      // Specific date
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Last N hours
      endDate = new Date();
      startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
    }

    const history = await LocationTracking.getMovementHistory(
      employeeId,
      startDate,
      endDate
    );

    // Calculate statistics
    let totalDistance = 0;
    let maxSpeed = 0;
    const locations = [];

    for (let i = 0; i < history.length; i++) {
      const current = history[i];
      locations.push({
        latitude: current.location.latitude,
        longitude: current.location.longitude,
        timestamp: current.timestamp,
        status: current.status,
        activity: current.activity,
      });

      if (i > 0) {
        const prev = history[i - 1];
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (current.location.latitude - prev.location.latitude) * Math.PI / 180;
        const dLon = (current.location.longitude - prev.location.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(prev.location.latitude * Math.PI / 180) * 
          Math.cos(current.location.latitude * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        totalDistance += distance;
      }

      if (current.speed > maxSpeed) {
        maxSpeed = current.speed;
      }
    }

    return NextResponse.json({
      success: true,
      history: {
        employeeId,
        employeeName: history[0]?.employeeName || '',
        startDate,
        endDate,
        locations,
        statistics: {
          totalPoints: history.length,
          totalDistance: Math.round(totalDistance * 100) / 100, // km
          maxSpeed: Math.round(maxSpeed * 100) / 100, // km/h
          duration: hours,
        },
      },
    });
  } catch (error) {
    console.error('Movement history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movement history' },
      { status: 500 }
    );
  }
}
