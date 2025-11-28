"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Play, Square, Navigation, Activity, Battery, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
}

export default function StartTrackingButton() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [activityStatus, setActivityStatus] = useState<string>("working");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    checkBattery();
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=active');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const checkBattery = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  };

  const sendLocationUpdate = async (location: LocationData) => {
    if (!selectedEmployee) return;

    const trackingData = {
      employeeId: selectedEmployee,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
      status: 'active',
      activity: activityStatus,
      batteryLevel: batteryLevel || undefined,
      speed: location.speed ? parseFloat((location.speed * 3.6).toFixed(1)) : 0, // m/s to km/h
      heading: location.heading || 0,
      deviceInfo: navigator.userAgent,
    };

    try {
      const response = await fetch('/api/tracking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData),
      });

      const result = await response.json();

      if (result.success) {
        setUpdateCount(prev => prev + 1);
        console.log('Location updated:', location);
      } else {
        console.error('Failed to update location:', result.error);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const startTracking = () => {
    if (!selectedEmployee) {
      toast({
        title: "Select Employee",
        description: "Please select an employee to start tracking",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    setUpdateCount(0);

    // Request high accuracy GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };

        setCurrentLocation(locationData);
        sendLocationUpdate(locationData);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    toast({
      title: "Tracking Started",
      description: "Your live location is now being tracked",
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);

    if (updateCount > 0) {
      toast({
        title: "Tracking Stopped",
        description: `Sent ${updateCount} location updates`,
      });
    }
  };

  const openDialog = () => {
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleStartTracking = () => {
    startTracking();
    closeDialog();
  };

  return (
    <>
      <Button onClick={openDialog} className="gap-2">
        <Navigation className="w-4 h-4" />
        Start Live Tracking
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Live Location Tracking</DialogTitle>
            <DialogDescription>
              Your GPS location will be tracked and sent to the server in real-time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Your Employee Profile
              </label>
              {employees.length === 0 ? (
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  No employees found. Please register employees first.
                </div>
              ) : (
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.name} ({emp.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Activity Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Current Activity
              </label>
              <Select value={activityStatus} onValueChange={setActivityStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">💼 Working</SelectItem>
                  <SelectItem value="break">☕ On Break</SelectItem>
                  <SelectItem value="meeting">👥 In Meeting</SelectItem>
                  <SelectItem value="traveling">🚗 Traveling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Device Info */}
            <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GPS Status</span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {navigator.geolocation ? 'Available' : 'Not Available'}
                </span>
              </div>
              {batteryLevel !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Battery</span>
                  <span className="flex items-center gap-1">
                    <Battery className="w-3 h-3" />
                    {batteryLevel}%
                  </span>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-400">
                ⚠️ Make sure to allow location access when prompted by your browser
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleStartTracking}
                disabled={!selectedEmployee || isTracking}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tracking Status (appears when tracking is active) */}
      {isTracking && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="p-4 shadow-lg border-2 border-green-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-sm">Live Tracking Active</span>
                </div>
                
                {currentLocation && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      <span>Updates sent: {updateCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3 h-3" />
                      <span>Accuracy: {currentLocation.accuracy.toFixed(0)}m</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={stopTracking}
              >
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
