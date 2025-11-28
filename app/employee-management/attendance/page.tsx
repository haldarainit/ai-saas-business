"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle, UserCheck, Download, Filter, Search, Camera, X, RefreshCw, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import ManualLocationUpdate from "@/components/manual-location-update";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [action, setAction] = useState<"clockIn" | "clockOut">("clockIn");
  const [capturing, setCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Background tracking function
  const startBackgroundTracking = (employeeId: string, initialLocation: any) => {
    // Store tracking state in localStorage
    localStorage.setItem('activeTracking', JSON.stringify({
      employeeId,
      startTime: new Date().toISOString(),
      status: 'active'
    }));

    // Send location update every 2 minutes
    const sendUpdate = async () => {
      const trackingData = JSON.parse(localStorage.getItem('activeTracking') || '{}');
      
      if (!trackingData.employeeId) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await fetch('/api/tracking/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeId: trackingData.employeeId,
                location: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                },
                status: 'active',
                activity: 'working',
                speed: position.coords.speed ? (position.coords.speed * 3.6) : 0,
                heading: position.coords.heading || 0,
                deviceInfo: navigator.userAgent,
              }),
            });
            console.log('Background location updated');
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    // Initial update
    sendUpdate();

    // Schedule periodic updates (every 2 minutes)
    const intervalId = setInterval(sendUpdate, 120000);
    localStorage.setItem('trackingIntervalId', intervalId.toString());

    toast({
      title: "📍 Location Tracking Enabled",
      description: "Your location will be tracked while you're clocked in",
    });
  };

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
    loadAttendanceData();
  }, [selectedDate]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=active');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      // Load all attendance for selected date
      const response = await fetch(`/api/attendance/all/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendanceData(data.records || []);
        }
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCapturing(true);
          }).catch((err) => {
            console.error('Error playing video:', err);
            toast({
              title: "Camera Error",
              description: "Unable to start video stream.",
              variant: "destructive",
            });
          });
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please grant camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturing(false);
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Canvas context not available');
      return null;
    }

    // Check if video is ready
    if (video.readyState < 2) {
      console.error('Video not ready');
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('Invalid video dimensions');
      return null;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleMarkAttendance = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Employee Required",
        description: "Please select an employee.",
        variant: "destructive",
      });
      return;
    }

    if (!capturing) {
      toast({
        title: "Camera Not Ready",
        description: "Please wait for camera to start.",
        variant: "destructive",
      });
      return;
    }

    const imageData = captureImage();
    if (!imageData) {
      toast({
        title: "Capture Error",
        description: "Failed to capture image. Ensure camera is working and try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('Image captured, size:', imageData.length);
    setLoading(true);

    try {
      // Get location
      const location = await new Promise<{ latitude: number; longitude: number }>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          () => {
            console.log('Geolocation not available, using default');
            resolve({ latitude: 0, longitude: 0 });
          }
        );
      });

      console.log('Sending attendance request...');
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          image: imageData,
          location,
          action,
          deviceInfo: navigator.userAgent,
        }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        toast({
          title: "✅ Success!",
          description: data.message,
        });
        
        // Show match score
        if (data.verification) {
          setTimeout(() => {
            toast({
              title: "🎯 Verification Details",
              description: `Match Score: ${data.verification.matchScore}% | Quality: ${data.verification.qualityScore}%`,
            });
          }, 500);
        }

        // Start background location tracking after clock-in
        if (action === 'clockIn') {
          startBackgroundTracking(selectedEmployee, location);
        }

        stopCamera();
        setCameraOpen(false);
        setSelectedEmployee("");
        loadAttendanceData();
      } else {
        console.error('Attendance marking failed:', data);
        toast({
          title: data.retry ? "⚠️ Verification Failed" : "❌ Error",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });

        if (data.retry) {
          // Allow retry - keep dialog open
          setTimeout(() => {
            toast({
              title: "💡 Tip",
              description: "Ensure good lighting and face the camera directly. Try again in a moment.",
            });
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Mark attendance error:', error);
      toast({
        title: "❌ Network Error",
        description: error.message || "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openMarkAttendance = (attendanceAction: "clockIn" | "clockOut") => {
    setAction(attendanceAction);
    setCameraOpen(true);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setSelectedEmployee("");
  };

  // Start camera when dialog opens
  useEffect(() => {
    if (cameraOpen && !capturing) {
      startCamera();
    }
  }, [cameraOpen]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-cyan-500/5 via-background to-blue-500/5">
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
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-cyan-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Attendance Management</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Track employee attendance in real-time with automated reporting and analytics.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-500">
                  {attendanceData.filter((a: any) => a.status === 'present').length}
                </div>
                <div className="text-sm text-muted-foreground">Present Today</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-red-500">
                  {attendanceData.filter((a: any) => a.status === 'absent').length}
                </div>
                <div className="text-sm text-muted-foreground">Absent Today</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-500">
                  {attendanceData.filter((a: any) => a.status === 'on-leave').length}
                </div>
                <div className="text-sm text-muted-foreground">On Leave</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-cyan-500">
                  {attendanceData.length > 0 
                    ? ((attendanceData.filter((a: any) => a.status === 'present').length / attendanceData.length) * 100).toFixed(0)
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Attendance Rate</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-10"
                  />
                </div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openMarkAttendance("clockIn")}>
                  <Camera className="w-4 h-4 mr-2" />
                  Clock In
                </Button>
                <Button variant="outline" onClick={() => openMarkAttendance("clockOut")}>
                  <Camera className="w-4 h-4 mr-2" />
                  Clock Out
                </Button>
                <Button variant="outline" onClick={loadAttendanceData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <ManualLocationUpdate />
              </div>
            </div>

            {/* Attendance Table */}
            <Card>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading attendance data...
                  </div>
                ) : attendanceData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No attendance records for this date
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-semibold">Employee</th>
                        <th className="p-4 font-semibold">Check In</th>
                        <th className="p-4 font-semibold">Check Out</th>
                        <th className="p-4 font-semibold">Hours</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Match Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((record: any) => (
                        <tr key={record._id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{record.employeeName}</td>
                          <td className="p-4 text-muted-foreground">
                            {record.clockIn?.time ? new Date(record.clockIn.time).toLocaleTimeString() : '-'}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {record.clockOut?.time ? new Date(record.clockOut.time).toLocaleTimeString() : '-'}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {record.workingHours ? `${record.workingHours}h` : '-'}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              record.status === "present" 
                                ? "bg-green-500/20 text-green-600" 
                                : record.status === "absent"
                                ? "bg-red-500/20 text-red-600"
                                : record.status === "late"
                                ? "bg-orange-500/20 text-orange-600"
                                : "bg-gray-500/20 text-gray-600"
                            }`}>
                              {record.status}
                            </span>
                            {record.suspicious && (
                              <span className="ml-2 text-xs text-red-500">⚠️</span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {record.clockIn?.faceMatchScore ? `${record.clockIn.faceMatchScore}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            {/* Camera Dialog */}
            <Dialog open={cameraOpen} onOpenChange={handleCloseCamera}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {action === "clockIn" ? "Clock In" : "Clock Out"}
                  </DialogTitle>
                  <DialogDescription>
                    Select employee and capture face image for verification
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Employee Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Employee
                    </label>
                    {employees.length === 0 ? (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          No employees registered yet
                        </p>
                        <Link href="/employee-management/register">
                          <Button size="sm" variant="outline">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Register First Employee
                          </Button>
                        </Link>
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

                  {/* Camera Feed */}
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${capturing ? 'block' : 'hidden'}`}
                    />
                    {!capturing && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                          <p>Starting camera...</p>
                          <p className="text-xs text-gray-400 mt-2">Please allow camera access if prompted</p>
                        </div>
                      </div>
                    )}
                    {capturing && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white">Live</span>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Instructions */}
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <p className="font-semibold mb-2">Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Ensure your face is clearly visible and well-lit</li>
                      <li>Look directly at the camera</li>
                      <li>Remove any accessories that cover your face</li>
                      <li>Face verification requires 70% match score</li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCloseCamera} disabled={loading}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleMarkAttendance} disabled={loading || !selectedEmployee || !capturing}>
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {action === "clockIn" ? "Clock In" : "Clock Out"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6">
                <UserCheck className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Biometric Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Seamlessly integrate with biometric devices for accurate attendance tracking.
                </p>
              </Card>
              <Card className="p-6">
                <Calendar className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Shift Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage multiple shifts and track attendance across different time zones.
                </p>
              </Card>
              <Card className="p-6">
                <CheckCircle className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Auto Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Generate comprehensive attendance reports automatically with insights.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
