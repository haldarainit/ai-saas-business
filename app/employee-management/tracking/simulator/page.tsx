"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { MapPin, Play, Square, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrackingSimulator() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Simulation parameters
  const [centerLat, setCenterLat] = useState(28.6139); // Delhi
  const [centerLng, setCenterLng] = useState(77.2090);
  const [currentLat, setCurrentLat] = useState(28.6139);
  const [currentLng, setCurrentLng] = useState(77.2090);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=active');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
        if (data.employees?.length > 0) {
          setSelectedEmployee(data.employees[0].employeeId);
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev.slice(0, 19)]);
  };

  const sendLocationUpdate = async () => {
    if (!selectedEmployee) return;

    // Simulate movement (random walk)
    const latChange = (Math.random() - 0.5) * 0.002; // ~200m
    const lngChange = (Math.random() - 0.5) * 0.002;
    
    const newLat = currentLat + latChange;
    const newLng = currentLng + lngChange;
    
    setCurrentLat(newLat);
    setCurrentLng(newLng);

    const speed = Math.random() * 50; // 0-50 km/h
    const heading = Math.random() * 360;
    const activities = ['working', 'break', 'meeting', 'traveling'];
    const statuses = ['active', 'idle'];
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const batteryLevel = 100 - Math.floor(updateCount / 2);

    const trackingData = {
      employeeId: selectedEmployee,
      location: {
        latitude: newLat,
        longitude: newLng,
        accuracy: Math.random() * 20 + 5,
      },
      status,
      activity,
      batteryLevel: Math.max(batteryLevel, 10),
      speed: parseFloat(speed.toFixed(1)),
      heading: parseFloat(heading.toFixed(0)),
      deviceInfo: 'Tracking Simulator',
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
        addLog(`✅ Update #${updateCount + 1}: ${status} - ${activity} (${newLat.toFixed(6)}, ${newLng.toFixed(6)})`);
      } else {
        addLog(`❌ Failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const startSimulation = () => {
    if (!selectedEmployee) {
      toast({
        title: "Select Employee",
        description: "Please select an employee first",
        variant: "destructive",
      });
      return;
    }

    setIsSimulating(true);
    setUpdateCount(0);
    setCurrentLat(centerLat);
    setCurrentLng(centerLng);
    addLog(`🚀 Started tracking for ${selectedEmployee}`);

    // Send initial update
    sendLocationUpdate();

    // Send updates every 3 seconds
    intervalRef.current = setInterval(() => {
      sendLocationUpdate();
    }, 3000);

    toast({
      title: "Simulation Started",
      description: "Location updates every 3 seconds",
    });
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
    addLog(`⏹️ Stopped tracking`);

    toast({
      title: "Simulation Stopped",
      description: `Sent ${updateCount} location updates`,
    });
  };

  const sendSingleUpdate = () => {
    if (!selectedEmployee) {
      toast({
        title: "Select Employee",
        description: "Please select an employee first",
        variant: "destructive",
      });
      return;
    }

    sendLocationUpdate();
  };

  const resetLocation = () => {
    setCurrentLat(centerLat);
    setCurrentLng(centerLng);
    setUpdateCount(0);
    addLog(`🔄 Location reset to center`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <Link href="/employee-management/tracking" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
            ← Back to Live Tracking
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Zap className="w-10 h-10 text-yellow-500" />
              Location Tracking Simulator
            </h1>
            <p className="text-muted-foreground">
              Simulate real-time GPS location updates for testing the live tracking dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Simulation Controls</h2>

              <div className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Employee
                  </label>
                  {employees.length === 0 ? (
                    <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                      No employees found. Run: <code>npm run seed:employees</code>
                    </div>
                  ) : (
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose employee..." />
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

                {/* Center Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Center Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={centerLat}
                      onChange={(e) => setCenterLat(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Center Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={centerLng}
                      onChange={(e) => setCenterLng(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                {/* Current Location */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Current Location</p>
                  <p className="text-xs font-mono">
                    {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updates sent: {updateCount}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!isSimulating ? (
                    <>
                      <Button
                        onClick={startSimulation}
                        className="w-full"
                        disabled={!selectedEmployee}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Continuous Tracking
                      </Button>
                      <Button
                        onClick={sendSingleUpdate}
                        variant="outline"
                        className="w-full"
                        disabled={!selectedEmployee}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Send Single Update
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={stopSimulation}
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Tracking
                    </Button>
                  )}
                  
                  <Button
                    onClick={resetLocation}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Location
                  </Button>
                </div>

                {/* View Dashboard Button */}
                <div className="pt-4 border-t">
                  <Link href="/employee-management/tracking">
                    <Button variant="secondary" className="w-full">
                      View Live Tracking Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Activity Log */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Activity Log</h2>

              <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No activity yet. Start simulation to see logs.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs([])}
                >
                  Clear Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEmployees}
                >
                  Reload Employees
                </Button>
              </div>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">📋 How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Select an employee from the dropdown</li>
              <li>Click "Start Continuous Tracking" to send updates every 3 seconds</li>
              <li>Open the <Link href="/employee-management/tracking" className="text-primary underline">Live Tracking Dashboard</Link> in another tab</li>
              <li>Watch the employee appear on the map with real-time updates</li>
              <li>The employee will move randomly around the center point</li>
              <li>Click "Stop Tracking" when done</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Tip:</strong> Change the center latitude/longitude to simulate tracking at different locations
                (e.g., New York: 40.7128, -74.0060 | London: 51.5074, -0.1278)
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
