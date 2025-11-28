"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { MapPin, Users, Radio, Navigation, Clock, Battery, Activity, AlertTriangle, RefreshCw, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LiveTracking() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTrackingData();

    // Auto-refresh every 10 seconds if enabled
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadTrackingData();
      }, 10000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tracking/update?type=all');
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees || []);
        setTrackingData(data.employees || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'working': return '💼';
      case 'break': return '☕';
      case 'meeting': return '👥';
      case 'traveling': return '🚗';
      default: return '❓';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getGoogleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const activeCount = employees.filter(e => e.status === 'active').length;
  const idleCount = employees.filter(e => e.status === 'idle').length;
  const awayCount = employees.filter(e => e.status === 'away').length;
  const violationCount = employees.filter(e => e.geofenceViolation?.violated).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-blue-500/5 via-background to-cyan-500/5">
          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <Link href="/employee-management" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
                ← Back to Employee Management
              </Link>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-blue-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Live Employee Tracking</h1>
              </div>
              <p className="text-xl text-muted-foreground mb-4">
                Monitor your team's real-time locations. Employees are automatically tracked after clocking in.
              </p>
              
              {/* Live Indicator */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">LIVE</span>
                </div>
                {lastUpdate && (
                  <span className="text-sm text-muted-foreground">
                    Last updated {formatTimeAgo(lastUpdate)}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTrackingData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Statistics Cards */}
        <section className="py-8 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Idle</p>
                    <p className="text-2xl font-bold text-yellow-600">{idleCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Away</p>
                    <p className="text-2xl font-bold text-orange-600">{awayCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Violations</p>
                    <p className="text-2xl font-bold text-red-600">{violationCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Tracking Data */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Employee List */}
              <div className="lg:col-span-1">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Active Employees ({employees.length})
                  </h2>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {employees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-semibold">No employees are being tracked</p>
                        <p className="text-sm mt-2 mb-4">Employees will appear here when they send their location</p>
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📍 How to track employees:</p>
                          <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                            <li>Employees go to the <strong>Attendance page</strong></li>
                            <li>They click <strong>"Send My Location"</strong> button</li>
                            <li>Their location appears here instantly</li>
                            <li>Location updates automatically after clock in</li>
                          </ol>
                        </div>
                      </div>
                    ) : (
                      employees.map((emp: any) => (
                        <div
                          key={emp.employeeId}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedEmployee === emp.employeeId
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedEmployee(emp.employeeId)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{emp.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(emp.status)}`} />
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getActivityIcon(emp.activity)} {emp.activity}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(emp.lastActive)}
                            </span>
                          </div>

                          {emp.batteryLevel && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Battery className="w-3 h-3" />
                              {emp.batteryLevel}%
                            </div>
                          )}

                          {emp.geofenceViolation?.violated && (
                            <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                              <AlertTriangle className="w-3 h-3" />
                              Geofence violation
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Map and Details */}
              <div className="lg:col-span-2">
                {selectedEmployee ? (
                  <EmployeeDetails
                    employee={employees.find(e => e.employeeId === selectedEmployee)}
                    onClose={() => setSelectedEmployee(null)}
                  />
                ) : (
                  <Card className="p-12 text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Select an Employee</h3>
                    <p className="text-muted-foreground">
                      Click on an employee from the list to view their live location and details
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function EmployeeDetails({ employee, onClose }: { employee: any; onClose: () => void }) {
  const [history, setHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (employee) {
      loadHistory();
    }
  }, [employee?.employeeId]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/tracking/history/${employee.employeeId}?hours=8`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!employee) return null;

  const mapsUrl = `https://www.google.com/maps?q=${employee.location.latitude},${employee.location.longitude}`;

  return (
    <div className="space-y-6">
      {/* Live Location Map */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Live Location
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Embedded Google Maps */}
        <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden mb-4">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${employee.location.latitude},${employee.location.longitude}&zoom=15`}
          />
          
          {/* Fallback if no API key */}
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Map preview requires Google Maps API key
                </p>
                <Button size="sm" asChild>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="w-4 h-4 mr-2" />
              Open in Google Maps
            </a>
          </Button>
          <Button variant="outline" onClick={loadHistory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Employee Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Employee Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-semibold">{employee.employeeName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID</p>
            <p className="font-semibold">{employee.employeeId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${employee.status === 'active' ? 'bg-green-500' : employee.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
              <p className="font-semibold capitalize">{employee.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Activity</p>
            <p className="font-semibold capitalize">{getActivityIcon(employee.activity)} {employee.activity}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Coordinates</p>
            <p className="text-xs font-mono">
              {employee.location.latitude.toFixed(6)}, {employee.location.longitude.toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="font-semibold">{employee.location.accuracy || 0}m</p>
          </div>
          {employee.speed > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Speed</p>
              <p className="font-semibold">{employee.speed} km/h</p>
            </div>
          )}
          {employee.batteryLevel && (
            <div>
              <p className="text-sm text-muted-foreground">Battery</p>
              <p className="font-semibold">{employee.batteryLevel}%</p>
            </div>
          )}
        </div>

        {employee.geofenceViolation?.violated && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Geofence Violation Detected</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Employee left designated area at {new Date(employee.geofenceViolation.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </Card>

      {/* Movement Statistics */}
      {history && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Movement Statistics (Last 8 hours)
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{history.statistics.totalPoints}</p>
              <p className="text-sm text-muted-foreground">Location Updates</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{history.statistics.totalDistance} km</p>
              <p className="text-sm text-muted-foreground">Distance Traveled</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{history.statistics.maxSpeed} km/h</p>
              <p className="text-sm text-muted-foreground">Max Speed</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function getActivityIcon(activity: string) {
  switch (activity) {
    case 'working': return '💼';
    case 'break': return '☕';
    case 'meeting': return '👥';
    case 'traveling': return '🚗';
    default: return '❓';
  }
}
