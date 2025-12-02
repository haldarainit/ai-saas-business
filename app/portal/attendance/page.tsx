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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [cameraActive, setCameraActive] = useState(false);
    const [action, setAction] = useState<"clockIn" | "clockOut" | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [location, setLocation] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const router = useRouter();

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Check authentication
    useEffect(() => {
        if (!employeeAuth.isAuthenticated()) {
            router.push("/portal/login");
            return;
        }

        loadEmployeeData();
        loadTodayAttendance();
        loadAttendanceHistory();
    }, []);

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

    const startCamera = async (actionType: "clockIn" | "clockOut") => {
        setAction(actionType);

        // Get location first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    toast({
                        title: "Location Error",
                        description: "Could not get your location. Please enable location services.",
                        variant: "destructive",
                    });
                }
            );
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user",
                },
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        setCameraActive(true);
                    });
                };
            }
        } catch (error) {
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
        setCameraActive(false);
        setAction(null);
    };

    const captureAndSubmit = async () => {
        if (!videoRef.current || !canvasRef.current || !action) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context || video.readyState < 2) return;

        setCapturing(true);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        const empData = employeeAuth.getEmployeeData();

        try {
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

            if (data.success) {
                toast({
                    title: "Success!",
                    description: `${action === "clockIn" ? "Clocked in" : "Clocked out"} successfully`,
                });

                loadTodayAttendance();
                loadAttendanceHistory();
                stopCamera();
            } else {
                toast({
                    title: "Failed",
                    description: data.error || "Attendance marking failed",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to mark attendance. Please try again.",
                variant: "destructive",
            });
        } finally {
            setCapturing(false);
        }
    };

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
                            <div className="flex gap-4 mt-6">
                                <Button
                                    onClick={() => startCamera("clockIn")}
                                    disabled={!canClockIn || cameraActive}
                                    className="flex-1"
                                    size="lg"
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    Clock In
                                </Button>

                                <Button
                                    onClick={() => startCamera("clockOut")}
                                    disabled={!canClockOut || cameraActive}
                                    variant="outline"
                                    className="flex-1"
                                    size="lg"
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    Clock Out
                                </Button>
                            </div>
                        </Card>

                        {/* Camera Modal */}
                        <AnimatePresence>
                            {cameraActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                                >
                                    <Card className="w-full max-w-lg">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold">
                                                    {action === "clockIn" ? "Clock In" : "Clock Out"}
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={stopCamera}
                                                    disabled={capturing}
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </div>

                                            <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-cover"
                                                />
                                                <canvas ref={canvasRef} className="hidden" />
                                            </div>

                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={captureAndSubmit}
                                                    disabled={capturing}
                                                    className="flex-1"
                                                    size="lg"
                                                >
                                                    {capturing ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="w-5 h-5 mr-2" />
                                                            Capture & Submit
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    onClick={stopCamera}
                                                    disabled={capturing}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
