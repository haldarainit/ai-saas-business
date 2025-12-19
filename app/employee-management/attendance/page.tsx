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
import { useAuth } from "@/contexts/auth-context";
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
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [lastVerificationResult, setLastVerificationResult] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { authToken, user } = useAuth();

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

  // Load employees on mount and when user or selectedDate changes
  useEffect(() => {
    if (user) {
      loadEmployees();
      loadAttendanceData();
    }
  }, [selectedDate, user]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const loadEmployees = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/employees?status=active', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const loadAttendanceData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load all attendance for selected date using query parameter
      const response = await fetch(`/api/attendance/all?date=${selectedDate}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendanceData(data.attendance || []);
          console.log('Loaded attendance records:', data.attendance?.length || 0);
        } else {
          console.error('API returned error:', data.error);
          toast({
            title: "Error",
            description: data.error || "Failed to load attendance data",
            variant: "destructive",
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to load attendance:', response.status, errorText);
        
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view attendance data.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load attendance data. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to server. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
        setVerificationFailed(false);
        setLastVerificationResult(null);
        setRetryCount(0);
        loadAttendanceData();
      } else {
        console.error('Attendance marking failed:', data);
        
        // Handle verification failure with modal
        if (data.retry && (data.matchScore !== undefined || data.qualityScore !== undefined)) {
          setLastVerificationResult({
            matchScore: data.matchScore || 0,
            qualityScore: data.qualityScore || 0,
            error: data.error,
            threshold: 75,
            employeeName: employees.find((e: any) => e.employeeId === selectedEmployee)?.name || 'Unknown'
          });
          setVerificationFailed(true);
          setRetryCount(prev => prev + 1);
        } else {
          toast({
            title: "❌ Error",
            description: data.error || "Unknown error occurred",
            variant: "destructive",
          });
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
    setVerificationFailed(false);
    setLastVerificationResult(null);
    setRetryCount(0);
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

      {!user ? (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to view attendance data.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Go to the main page and sign in with your account, then return to this page.
            </p>
            <div className="space-x-4">
              <Link href="/" className="text-blue-600 hover:underline">
                Go to Home
              </Link>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </div>
        </main>
      ) : (
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden bg-gradient-to-br from-cyan-500/5 via-background to-blue-500/5">
          <div className="container relative px-4 sm:px-6 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <Link href="/employee-management" className="text-xs sm:text-sm text-muted-foreground hover:text-primary mb-3 sm:mb-4 inline-block">
                ← Back to Employee Management
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-500" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">Attendance Management</h1>
              </div>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground">
                Track employee attendance in real-time with automated reporting and analytics.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-4 sm:py-6 md:py-8 border-y bg-muted/30">
          <div className="container px-4 sm:px-6 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Card className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-500">
                  {attendanceData.filter((a: any) => a.status === 'present').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Present Today</div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-red-500">
                  {attendanceData.filter((a: any) => a.status === 'absent').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Absent Today</div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-orange-500">
                  {attendanceData.filter((a: any) => a.status === 'on-leave').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">On Leave</div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-cyan-500">
                  {attendanceData.length > 0 
                    ? ((attendanceData.filter((a: any) => a.status === 'present').length / attendanceData.length) * 100).toFixed(0)
                    : 0}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Attendance Rate</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 sm:py-8 md:py-12">
          <div className="container px-4 sm:px-6 md:px-6">
            {/* Controls */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-48 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => openMarkAttendance("clockIn")}
                  className="flex-1 sm:flex-initial text-sm sm:text-base"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Clock In</span>
                  <span className="sm:hidden">In</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => openMarkAttendance("clockOut")}
                  className="flex-1 sm:flex-initial text-sm sm:text-base"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Clock Out</span>
                  <span className="sm:hidden">Out</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadAttendanceData}
                  className="flex-1 sm:flex-initial text-sm sm:text-base"
                >
                  <RefreshCw className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <div className="flex-1 sm:flex-initial">
                  <ManualLocationUpdate />
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
                  Loading attendance data...
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
                  No attendance records for this date
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden divide-y">
                    {attendanceData.map((record: any) => (
                      <div key={record._id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{record.employeeName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                                <span className="text-xs text-red-500">⚠️</span>
                              )}
                            </div>
                          </div>
                          {record.clockIn?.faceMatchScore && (
                            <div className="text-xs text-muted-foreground ml-2">
                              {record.clockIn.faceMatchScore}%
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">In:</span> {record.clockIn?.time ? new Date(record.clockIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Out:</span> {record.clockOut?.time ? new Date(record.clockOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Hours:</span> {record.workingHours ? `${record.workingHours}h` : '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr className="text-left">
                          <th className="p-3 md:p-4 font-semibold text-sm whitespace-nowrap">Employee</th>
                          <th className="p-3 md:p-4 font-semibold text-sm whitespace-nowrap">Check In</th>
                          <th className="p-3 md:p-4 font-semibold text-sm whitespace-nowrap">Check Out</th>
                          <th className="p-3 md:p-4 font-semibold text-sm whitespace-nowrap">Hours</th>
                          <th className="p-3 md:p-4 font-semibold text-sm whitespace-nowrap">Status</th>
                          <th className="p-3 md:p-4 font-semibold text-sm whitespace-nowrap">Match Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.map((record: any) => (
                          <tr key={record._id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="p-3 md:p-4 font-medium text-sm">{record.employeeName}</td>
                            <td className="p-3 md:p-4 text-muted-foreground text-sm whitespace-nowrap">
                              {record.clockIn?.time ? new Date(record.clockIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 md:p-4 text-muted-foreground text-sm whitespace-nowrap">
                              {record.clockOut?.time ? new Date(record.clockOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 md:p-4 text-muted-foreground text-sm whitespace-nowrap">
                              {record.workingHours ? `${record.workingHours}h` : '-'}
                            </td>
                            <td className="p-3 md:p-4">
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
                            <td className="p-3 md:p-4 text-muted-foreground text-sm whitespace-nowrap">
                              {record.clockIn?.faceMatchScore ? `${record.clockIn.faceMatchScore}%` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>

            {/* Camera Dialog */}
            <Dialog open={cameraOpen} onOpenChange={handleCloseCamera}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {action === "clockIn" ? "Clock In" : "Clock Out"}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Select employee and capture face image for verification
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* Employee Selection */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-2 block">
                      Select Employee
                    </label>
                    {employees.length === 0 ? (
                      <div className="p-3 sm:p-4 bg-muted rounded-lg text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                          No employees registered yet
                        </p>
                        <Link href="/employee-management/register">
                          <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Register First Employee
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Choose employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp: any) => (
                            <SelectItem key={emp.employeeId} value={emp.employeeId} className="text-sm sm:text-base">
                              {emp.name} ({emp.employeeId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Camera Feed */}
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${capturing ? 'block' : 'hidden'}`}
                    />
                    {!capturing && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center px-4">
                          <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50 animate-pulse" />
                          <p className="text-sm sm:text-base">Starting camera...</p>
                          <p className="text-xs text-gray-400 mt-2">Please allow camera access if prompted</p>
                        </div>
                      </div>
                    )}
                    {capturing && (
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white">Live</span>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Instructions */}
                  <div className="bg-muted p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
                    <p className="font-semibold mb-2">Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Ensure your face is clearly visible and well-lit</li>
                      <li>Look directly at the camera</li>
                      <li>Remove any accessories that cover your face</li>
                      <li>Face verification requires 70% match score</li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCloseCamera} 
                      disabled={loading}
                      className="w-full sm:w-auto text-sm sm:text-base order-2 sm:order-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleMarkAttendance} 
                      disabled={loading || !selectedEmployee || !capturing}
                      className="w-full sm:w-auto text-sm sm:text-base order-1 sm:order-2"
                    >
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

            {/* Verification Failed Modal */}
            <Dialog open={verificationFailed} onOpenChange={(open) => {
              if (!open) {
                setVerificationFailed(false);
                setLastVerificationResult(null);
              }
            }}>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-orange-500 text-base sm:text-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Face Verification Failed
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    {lastVerificationResult?.employeeName}'s face could not be verified with sufficient confidence
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4">
                  {/* Score Display */}
                  {lastVerificationResult && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="p-3 sm:p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium">Match Score</span>
                          <span className={`text-xl sm:text-2xl font-bold ${lastVerificationResult.matchScore >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                            {lastVerificationResult.matchScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 dark:bg-gray-700">
                          <div 
                            className={`h-2 sm:h-2.5 rounded-full ${lastVerificationResult.matchScore >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${lastVerificationResult.matchScore}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Required: {lastVerificationResult.threshold}% or higher
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium">Image Quality</span>
                          <span className={`text-base sm:text-lg font-bold ${lastVerificationResult.qualityScore >= 70 ? 'text-green-500' : lastVerificationResult.qualityScore >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                            {lastVerificationResult.qualityScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                          <div 
                            className={`h-1.5 rounded-full ${lastVerificationResult.qualityScore >= 70 ? 'bg-green-500' : lastVerificationResult.qualityScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${lastVerificationResult.qualityScore}%` }}
                          />
                        </div>
                      </div>

                      {lastVerificationResult.error && (
                        <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                            {lastVerificationResult.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Improvement Tips */}
                  <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Tips to Improve Verification
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 sm:space-y-1.5 ml-5 sm:ml-6">
                      <li>✓ Move to a well-lit area (avoid backlighting)</li>
                      <li>✓ Face the camera directly at eye level</li>
                      <li>✓ Remove glasses, hats, or masks if wearing</li>
                      <li>✓ Keep face centered in the circle</li>
                      <li>✓ Stay still with neutral expression</li>
                      <li>✓ Ensure camera lens is clean</li>
                    </ul>
                  </div>

                  {/* Retry Count Warning */}
                  {retryCount >= 2 && (
                    <div className="p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠️ Attempt {retryCount} of 5. Multiple failures flagged for admin review.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCloseCamera}
                      className="flex-1 text-xs sm:text-sm"
                      size="sm"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Cancel</span>
                      <span className="sm:hidden">Cancel</span>
                    </Button>
                    <Button
                      onClick={() => {
                        setVerificationFailed(false);
                        setLastVerificationResult(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs sm:text-sm"
                      disabled={retryCount >= 5}
                      size="sm"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {retryCount >= 5 ? 'Max Attempts' : 'Try Again'}
                    </Button>
                  </div>

                  {retryCount >= 5 && (
                    <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 text-center">
                        Maximum attempts reached. Contact supervisor/HR for assistance.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10 md:mt-12">
              <Card className="p-4 sm:p-5 md:p-6">
                <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Biometric Integration</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Seamlessly integrate with biometric devices for accurate attendance tracking.
                </p>
              </Card>
              <Card className="p-4 sm:p-5 md:p-6">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Shift Management</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage multiple shifts and track attendance across different time zones.
                </p>
              </Card>
              <Card className="p-4 sm:p-5 md:p-6">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Auto Reports</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Generate comprehensive attendance reports automatically with insights.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      )}

      <Footer />
    </div>
  );
}
