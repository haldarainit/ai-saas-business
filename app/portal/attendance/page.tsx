"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { employeeAuth } from "@/lib/utils/employeeAuth";
import { useRouter } from "next/navigation";
import {
    LogOut,
    Camera,
    MapPin,
    Clock,
    CheckCircle,
    X,
    Loader2,
    Calendar,
    TrendingUp,
    RefreshCw,
    CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AttendanceRecord {
    date: string;
    clockIn?: { time: string; location?: any };
    clockOut?: { time: string; location?: any };
    workingHours?: number;
    status: string;
}

export default function AttendancePortal() {
    const [employee, setEmployee] = useState<any>(null);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [statistics, setStatistics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [action, setAction] = useState<"clockIn" | "clockOut" | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [location, setLocation] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [verificationFailed, setVerificationFailed] = useState(false);
    const [lastVerificationResult, setLastVerificationResult] = useState<any>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [leaveForm, setLeaveForm] = useState({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
    });
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const router = useRouter();

    // Background tracking functions
    const startBackgroundTracking = (employeeId: string) => {
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
    };

    const stopBackgroundTracking = () => {
        const intervalId = localStorage.getItem('trackingIntervalId');
        if (intervalId) {
            clearInterval(parseInt(intervalId));
            localStorage.removeItem('trackingIntervalId');
        }
        localStorage.removeItem('activeTracking');
    };

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Check authentication and restore tracking state
    useEffect(() => {
        if (!employeeAuth.isAuthenticated()) {
            router.push("/portal/login");
            return;
        }

        loadEmployeeData();
        loadTodayAttendance();
        loadAttendanceHistory();
        loadLeaves();
        
        // Restore background tracking if user was clocked in
        const trackingData = localStorage.getItem('activeTracking');
        if (trackingData) {
            const { employeeId, startTime } = JSON.parse(trackingData);
            const empData = employeeAuth.getEmployeeData();
            
            // Verify it's the same employee and tracking is recent (within 24 hours)
            if (employeeId === empData?.employeeId) {
                const timeSinceStart = Date.now() - new Date(startTime).getTime();
                if (timeSinceStart < 24 * 60 * 60 * 1000) {
                    console.log('Restoring background tracking for', employeeId);
                    startBackgroundTracking(employeeId);
                } else {
                    // Clean up old tracking data
                    localStorage.removeItem('activeTracking');
                    localStorage.removeItem('trackingIntervalId');
                }
            }
        }
    }, []);

    // Cleanup camera stream
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    const loadEmployeeData = async () => {
        try {
            const response = await employeeAuth.apiCall("/api/employee/me");
            const data = await response.json();

            if (data.success) {
                setEmployee(data.employee);
            }
        } catch (error) {
            console.error("Failed to load employee data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadTodayAttendance = async () => {
        const today = new Date().toISOString().split("T")[0];
        try {
            const response = await fetch(`/api/attendance/all?date=${today}`);
            const data = await response.json();

            if (data.success && data.attendance.length > 0) {
                const empData = employeeAuth.getEmployeeData();
                const myAttendance = data.attendance.find(
                    (a: any) => a.employeeId === empData?.employeeId
                );
                setTodayAttendance(myAttendance || null);
            }
        } catch (error) {
            console.error("Failed to load today's attendance:", error);
        }
    };

    const loadAttendanceHistory = async () => {
        try {
            const response = await employeeAuth.apiCall(
                "/api/employee/attendance-history?limit=7"
            );
            const data = await response.json();

            if (data.success) {
                setAttendanceHistory(data.attendance);
                setStatistics(data.statistics);
            }
        } catch (error) {
            console.error("Failed to load attendance history:", error);
        }
    };

    const loadLeaves = async () => {
        try {
            const response = await employeeAuth.apiCall("/api/leave/list");
            const data = await response.json();

            if (data.success) {
                setLeaves(data.leaves || []);
            }
        } catch (error) {
            console.error("Failed to load leaves:", error);
        }
    };

    const handleApplyLeave = async () => {
        if (!leaveForm.leaveType || !leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
            toast({
                title: "Validation Error",
                description: "Please fill all fields",
                variant: "destructive",
            });
            return;
        }

        setSubmittingLeave(true);
        try {
            const response = await employeeAuth.apiCall("/api/leave/apply", {
                method: "POST",
                body: JSON.stringify(leaveForm),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Leave request submitted successfully",
                });
                setLeaveOpen(false);
                setLeaveForm({ leaveType: "", fromDate: "", toDate: "", reason: "" });
                loadLeaves();
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to submit leave request",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error("Failed to apply leave:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit leave request",
                variant: "destructive",
            });
        } finally {
            setSubmittingLeave(false);
        }
    };

    const openMarkAttendance = (actionType: "clockIn" | "clockOut") => {
        setAction(actionType);
        setCameraOpen(true);
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    facingMode: "user",
                },
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        setCapturing(true);
                    }).catch((err) => {
                        console.error("Error playing video:", err);
                        toast({
                            title: "Camera Error",
                            description: "Unable to start video stream.",
                            variant: "destructive",
                        });
                    });
                };
            }
        } catch (error) {
            console.error("Camera access error:", error);
            toast({
                title: "Camera Error",
                description: "Unable to access camera. Please allow camera permissions.",
                variant: "destructive",
            });
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setCapturing(false);
    };

    const handleCloseCamera = () => {
        stopCamera();
        setCameraOpen(false);
        setAction(null);
        setVerificationFailed(false);
        setLastVerificationResult(null);
        setRetryCount(0);
    };

    const captureImage = (): string | null => {
        if (!videoRef.current || !canvasRef.current) {
            console.error("Video or canvas ref not available");
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
            console.error("Canvas context not available");
            return null;
        }

        if (video.readyState < 2) {
            console.error("Video not ready");
            return null;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) {
            console.error("Invalid video dimensions");
            return null;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.8);
    };

    const handleMarkAttendance = async () => {
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

        setSubmitting(true);

        try {
            // Get location with proper timeout and accuracy
            const location = await new Promise<{ latitude: number; longitude: number; accuracy: number }>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Location obtained:', {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        toast({
                            title: "Location Warning",
                            description: "Unable to get location. Proceeding with default.",
                            variant: "destructive",
                        });
                        resolve({ latitude: 0, longitude: 0, accuracy: 0 });
                    },
                    { 
                        enableHighAccuracy: true, 
                        timeout: 10000, 
                        maximumAge: 0 
                    }
                );
            });

            const empData = employeeAuth.getEmployeeData();

            console.log('Submitting attendance with data:', {
                employeeId: empData.employeeId,
                action,
                location,
                hasImage: !!imageData
            });

            const response = await fetch("/api/attendance/mark", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: empData.employeeId,
                    image: imageData,
                    location,
                    action,
                    deviceInfo: navigator.userAgent,
                }),
            });

            const data = await response.json();
            console.log('Attendance response:', data);

            if (data.success) {
                toast({
                    title: "✅ Success!",
                    description: data.message,
                });

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
                    startBackgroundTracking(empData.employeeId);
                    toast({
                        title: "📍 Location Tracking Enabled",
                        description: "Your location will be tracked while you're clocked in",
                    });
                } else if (action === 'clockOut') {
                    // Stop tracking on clock out
                    stopBackgroundTracking();
                }

                stopCamera();
                setCameraOpen(false);
                setAction(null);
                setVerificationFailed(false);
                setLastVerificationResult(null);
                setRetryCount(0);
                loadTodayAttendance();
                loadAttendanceHistory();
            } else {
                // Handle verification failure
                if (data.retry && (data.matchScore !== undefined || data.qualityScore !== undefined)) {
                    // Show verification failure modal
                    setLastVerificationResult({
                        matchScore: data.matchScore || 0,
                        qualityScore: data.qualityScore || 0,
                        error: data.error,
                        threshold: 75
                    });
                    setVerificationFailed(true);
                    setRetryCount(prev => prev + 1);
                } else {
                    // Other errors
                    toast({
                        title: "❌ Error",
                        description: data.error || "Unknown error occurred",
                        variant: "destructive",
                    });
                }
            }
        } catch (error: any) {
            console.error("Mark attendance error:", error);
            toast({
                title: "❌ Network Error",
                description: error.message || "Failed to mark attendance. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Start camera when dialog opens
    useEffect(() => {
        if (cameraOpen && !capturing) {
            startCamera();
        }
    }, [cameraOpen]);

    const handleLogout = () => {
        employeeAuth.logout();
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    const canClockIn = !todayAttendance || !todayAttendance.clockIn;
    const canClockOut = todayAttendance?.clockIn && !todayAttendance?.clockOut;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500/5 via-background to-cyan-500/5">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                            Employee Portal
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {employee?.name} • {employee?.employeeId}
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Current Time Display */}
                <Card className="mb-6 bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                    <div className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock className="w-6 h-6" />
                            <span className="text-sm font-medium">Current Time</span>
                        </div>
                        <div className="text-4xl font-bold">
                            {currentTime.toLocaleTimeString("en-US")}
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                            {currentTime.toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today's Status */}
                    <div className="lg:col-span-2">
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Today's Attendance
                            </h2>

                            {todayAttendance ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                            <div>
                                                <p className="font-semibold">Clock In</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatTime(todayAttendance.clockIn.time)}
                                                </p>
                                            </div>
                                        </div>
                                        {todayAttendance.clockIn.location && (
                                            <MapPin className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>

                                    {todayAttendance.clockOut ? (
                                        <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-6 h-6 text-blue-500" />
                                                <div>
                                                    <p className="font-semibold">Clock Out</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatTime(todayAttendance.clockOut.time)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">
                                                    {todayAttendance.workingHours?.toFixed(2)}h
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Working Hours
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-muted rounded-lg text-center">
                                            <p className="text-muted-foreground">Not clocked out yet</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 bg-muted rounded-lg text-center">
                                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">
                                        You haven't clocked in today
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-6 flex-wrap">
                                <Button
                                    onClick={() => openMarkAttendance("clockIn")}
                                    disabled={!canClockIn || cameraOpen}
                                    className="flex-1"
                                    size="lg"
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    Clock In
                                </Button>

                                <Button
                                    onClick={() => openMarkAttendance("clockOut")}
                                    disabled={!canClockOut || cameraOpen}
                                    variant="outline"
                                    className="flex-1"
                                    size="lg"
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    Clock Out
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    loadTodayAttendance();
                                    loadAttendanceHistory();
                                }}
                                className="w-full mt-3"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Status
                            </Button>
                        </Card>

                        {/* Camera Dialog */}
                        <Dialog open={cameraOpen} onOpenChange={handleCloseCamera}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        {action === "clockIn" ? "Clock In" : "Clock Out"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Capture face image for verification
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {/* Camera Feed */}
                                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9", minHeight: "300px" }}>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className={`w-full h-full object-cover ${capturing ? "block" : "hidden"}`}
                                            style={{ transform: "scaleX(-1)" }}
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
                                        {/*  Face guide overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-64 h-80 border-4 border-white/30 rounded-full" />
                                        </div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>

                                    {/* Instructions */}
                                    <div className="bg-muted p-4 rounded-lg text-sm">
                                        <p className="font-semibold mb-2">Instructions:</p>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            <li>Ensure your face is clearly visible and well-lit</li>
                                            <li>Look directly at the camera</li>
                                            <li>Position your face within the circle</li>
                                            <li>Face verification requires 75% match score</li>
                                        </ul>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleCloseCamera}
                                            disabled={submitting}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleMarkAttendance}
                                            disabled={submitting || !capturing}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-orange-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Face Verification Failed
                                    </DialogTitle>
                                    <DialogDescription>
                                        Your face could not be verified with sufficient confidence
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {/* Score Display */}
                                    {lastVerificationResult && (
                                        <div className="space-y-3">
                                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">Match Score</span>
                                                    <span className={`text-2xl font-bold ${lastVerificationResult.matchScore >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                                                        {lastVerificationResult.matchScore}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div 
                                                        className={`h-2.5 rounded-full ${lastVerificationResult.matchScore >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${lastVerificationResult.matchScore}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Required: {lastVerificationResult.threshold}% or higher
                                                </p>
                                            </div>

                                            <div className="p-4 bg-muted rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Image Quality</span>
                                                    <span className={`text-lg font-bold ${lastVerificationResult.qualityScore >= 70 ? 'text-green-500' : lastVerificationResult.qualityScore >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
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
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-sm text-red-600 dark:text-red-400">
                                                        {lastVerificationResult.error}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Improvement Tips */}
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Tips to Improve Verification
                                        </p>
                                        <ul className="text-xs text-muted-foreground space-y-1.5 ml-6">
                                            <li>✓ Move to a well-lit area (avoid backlighting)</li>
                                            <li>✓ Face the camera directly at eye level</li>
                                            <li>✓ Remove glasses, hats, or masks if wearing</li>
                                            <li>✓ Keep your face centered in the circle</li>
                                            <li>✓ Stay still and maintain a neutral expression</li>
                                            <li>✓ Ensure camera lens is clean</li>
                                        </ul>
                                    </div>

                                    {/* Retry Count Warning */}
                                    {retryCount >= 2 && (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                                ⚠️ Attempt {retryCount} of 5. Multiple failed attempts may be flagged for review.
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleCloseCamera}
                                            className="flex-1"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setVerificationFailed(false);
                                                setLastVerificationResult(null);
                                                // Keep camera running for retry
                                            }}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                                            disabled={retryCount >= 5}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            {retryCount >= 5 ? 'Max Attempts Reached' : 'Try Again'}
                                        </Button>
                                    </div>

                                    {retryCount >= 5 && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                                Maximum retry attempts reached. Please contact your supervisor or HR for assistance.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Leave Application Dialog */}
                        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full mt-3">
                                    <CalendarDays className="w-4 h-4 mr-2" />
                                    Apply for Leave
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Apply for Leave</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details for your leave request.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="leave-type">Leave Type</Label>
                                        <Select
                                            value={leaveForm.leaveType}
                                            onValueChange={(value) =>
                                                setLeaveForm({ ...leaveForm, leaveType: value })
                                            }
                                        >
                                            <SelectTrigger id="leave-type">
                                                <SelectValue placeholder="Select leave type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sick">Sick Leave</SelectItem>
                                                <SelectItem value="vacation">Vacation</SelectItem>
                                                <SelectItem value="personal">Personal Leave</SelectItem>
                                                <SelectItem value="emergency">Emergency Leave</SelectItem>
                                                <SelectItem value="casual">Casual Leave</SelectItem>
                                                <SelectItem value="annual">Annual Leave</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="from-date">From Date</Label>
                                            <Input
                                                id="from-date"
                                                type="date"
                                                value={leaveForm.fromDate}
                                                onChange={(e) =>
                                                    setLeaveForm({ ...leaveForm, fromDate: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="to-date">To Date</Label>
                                            <Input
                                                id="to-date"
                                                type="date"
                                                value={leaveForm.toDate}
                                                onChange={(e) =>
                                                    setLeaveForm({ ...leaveForm, toDate: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="reason">Reason</Label>
                                        <Textarea
                                            id="reason"
                                            placeholder="Explain your reason for leave..."
                                            value={leaveForm.reason}
                                            onChange={(e) =>
                                                setLeaveForm({ ...leaveForm, reason: e.target.value })
                                            }
                                            rows={4}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setLeaveOpen(false)}
                                        disabled={submittingLeave}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleApplyLeave} disabled={submittingLeave}>
                                        {submittingLeave ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Request"
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Leave Status */}
                        <Card className="p-6 mt-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-orange-500" />
                                My Leave Requests
                            </h2>
                            {leaves.length > 0 ? (
                                <div className="space-y-2">
                                    {leaves.slice(0, 5).map((leave: any) => (
                                        <div
                                            key={leave._id}
                                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium text-sm capitalize">
                                                    {leave.leaveType} Leave
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(leave.fromDate).toLocaleDateString()} -{" "}
                                                    {new Date(leave.toDate).toLocaleDateString()} ({leave.days} days)
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {leave.status === "approved" && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                                {leave.status === "pending" && (
                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                )}
                                                {leave.status === "rejected" && (
                                                    <X className="w-4 h-4 text-red-500" />
                                                )}
                                                <span
                                                    className={`text-sm font-medium ${
                                                        leave.status === "approved"
                                                            ? "text-green-600"
                                                            : leave.status === "pending"
                                                            ? "text-orange-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No leave requests yet
                                </p>
                            )}
                        </Card>
                    </div>

                    {/* Statistics & History */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        {statistics && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                                    Stats (Last 7 Days)
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Days Present</span>
                                            <span className="font-bold">{statistics.presentDays}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Total Hours</span>
                                            <span className="font-bold">{statistics.totalHours}h</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Avg Hours/Day</span>
                                            <span className="font-bold">
                                                {statistics.averageHours}h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Recent History */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">Recent Attendance</h3>
                            <div className="space-y-2">
                                {attendanceHistory.slice(0, 5).map((record, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{formatDate(record.date)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {record.clockIn && formatTime(record.clockIn.time)}
                                                {record.clockOut && ` - ${formatTime(record.clockOut.time)}`}
                                            </p>
                                        </div>
                                        {record.workingHours && (
                                            <span className="text-sm font-bold">
                                                {record.workingHours.toFixed(1)}h
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
