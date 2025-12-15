"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    Bell,
    Users,
    CalendarCheck,
    Plus,
    Settings,
    Video,
    Mail,
    Phone,
    MapPin,
    X,
    Check,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Edit,
    Trash2,
    Copy,
    ExternalLink,
    Loader2,
    CalendarDays,
    RefreshCw,
    Link2,
    User,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface Appointment {
    id: string;
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    attendees: { name: string; email: string }[];
    type: "in-person" | "video" | "phone";
    status: "confirmed" | "pending" | "cancelled";
    location?: string;
    meetingLink?: string;
    reminders: boolean;
    createdAt: string;
}

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function AppointmentDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [activeTab, setActiveTab] = useState("calendar");

    // New appointment form state
    const [newAppointment, setNewAppointment] = useState({
        title: "",
        description: "",
        date: "",
        startTime: "09:00",
        endTime: "10:00",
        type: "video" as "in-person" | "video" | "phone",
        attendeeName: "",
        attendeeEmail: "",
        location: "",
        reminders: true,
    });

    // Demo appointments
    useEffect(() => {
        const demoAppointments: Appointment[] = [
            {
                id: "1",
                title: "Product Demo Call",
                description: "Demonstration of new features",
                date: new Date().toISOString().split("T")[0],
                startTime: "10:00",
                endTime: "11:00",
                attendees: [{ name: "John Smith", email: "john@example.com" }],
                type: "video",
                status: "confirmed",
                meetingLink: "https://meet.google.com/abc-defg-hij",
                reminders: true,
                createdAt: new Date().toISOString(),
            },
            {
                id: "2",
                title: "Team Planning Meeting",
                description: "Q1 planning session",
                date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                startTime: "14:00",
                endTime: "15:30",
                attendees: [
                    { name: "Sarah Wilson", email: "sarah@example.com" },
                    { name: "Mike Johnson", email: "mike@example.com" },
                ],
                type: "video",
                status: "confirmed",
                meetingLink: "https://meet.google.com/xyz-uvwx-yz",
                reminders: true,
                createdAt: new Date().toISOString(),
            },
            {
                id: "3",
                title: "Client Consultation",
                description: "Initial consultation with new client",
                date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
                startTime: "11:00",
                endTime: "12:00",
                attendees: [{ name: "Emily Brown", email: "emily@business.com" }],
                type: "in-person",
                status: "pending",
                location: "Conference Room A",
                reminders: true,
                createdAt: new Date().toISOString(),
            },
        ];
        setAppointments(demoAppointments);
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty slots for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            if (direction === "prev") {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const getAppointmentsForDate = (day: number) => {
        const dateStr = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        )
            .toISOString()
            .split("T")[0];
        return appointments.filter((apt) => apt.date === dateStr);
    };

    const handleCreateAppointment = async () => {
        setIsLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newApt: Appointment = {
            id: Date.now().toString(),
            title: newAppointment.title,
            description: newAppointment.description,
            date: newAppointment.date,
            startTime: newAppointment.startTime,
            endTime: newAppointment.endTime,
            attendees: [
                {
                    name: newAppointment.attendeeName,
                    email: newAppointment.attendeeEmail,
                },
            ],
            type: newAppointment.type,
            status: "confirmed",
            location: newAppointment.location,
            meetingLink:
                newAppointment.type === "video"
                    ? `https://meet.google.com/${Math.random().toString(36).substring(7)}`
                    : undefined,
            reminders: newAppointment.reminders,
            createdAt: new Date().toISOString(),
        };

        setAppointments((prev) => [...prev, newApt]);
        setShowNewAppointment(false);
        setNewAppointment({
            title: "",
            description: "",
            date: "",
            startTime: "09:00",
            endTime: "10:00",
            type: "video",
            attendeeName: "",
            attendeeEmail: "",
            location: "",
            reminders: true,
        });
        setIsLoading(false);
    };

    const handleConnectGoogle = () => {
        // In a real app, this would initiate OAuth flow
        setIsGoogleConnected(true);
    };

    const handleCancelAppointment = (id: string) => {
        setAppointments((prev) =>
            prev.map((apt) =>
                apt.id === id ? { ...apt, status: "cancelled" as const } : apt
            )
        );
    };

    const timeSlots: TimeSlot[] = [
        { time: "09:00 AM", available: true },
        { time: "09:30 AM", available: true },
        { time: "10:00 AM", available: false },
        { time: "10:30 AM", available: true },
        { time: "11:00 AM", available: true },
        { time: "11:30 AM", available: false },
        { time: "12:00 PM", available: true },
        { time: "12:30 PM", available: true },
        { time: "01:00 PM", available: true },
        { time: "01:30 PM", available: false },
        { time: "02:00 PM", available: true },
        { time: "02:30 PM", available: true },
        { time: "03:00 PM", available: true },
        { time: "03:30 PM", available: true },
        { time: "04:00 PM", available: false },
        { time: "04:30 PM", available: true },
    ];

    const todayAppointments = appointments.filter(
        (apt) => apt.date === new Date().toISOString().split("T")[0]
    );

    const upcomingAppointments = appointments
        .filter(
            (apt) =>
                new Date(apt.date) >= new Date() && apt.status !== "cancelled"
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <main className="flex-1 py-8">
                <div className="container px-4 md:px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Appointment Dashboard
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage your appointments and calendar integrations
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {!isGoogleConnected ? (
                                    <Button
                                        onClick={handleConnectGoogle}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                    >
                                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                                            />
                                        </svg>
                                        Connect Google Calendar
                                    </Button>
                                ) : (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1.5">
                                        <Check className="w-4 h-4 mr-1" />
                                        Google Calendar Connected
                                    </Badge>
                                )}

                                <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Appointment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Create New Appointment</DialogTitle>
                                            <DialogDescription>
                                                Schedule a new appointment with automatic reminders
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                    id="title"
                                                    placeholder="Meeting title"
                                                    value={newAppointment.title}
                                                    onChange={(e) =>
                                                        setNewAppointment({ ...newAppointment, title: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Meeting description"
                                                    value={newAppointment.description}
                                                    onChange={(e) =>
                                                        setNewAppointment({
                                                            ...newAppointment,
                                                            description: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="date">Date</Label>
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        value={newAppointment.date}
                                                        onChange={(e) =>
                                                            setNewAppointment({ ...newAppointment, date: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="type">Meeting Type</Label>
                                                    <Select
                                                        value={newAppointment.type}
                                                        onValueChange={(value: "in-person" | "video" | "phone") =>
                                                            setNewAppointment({ ...newAppointment, type: value })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="video">
                                                                <div className="flex items-center">
                                                                    <Video className="w-4 h-4 mr-2" />
                                                                    Video Call
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="in-person">
                                                                <div className="flex items-center">
                                                                    <MapPin className="w-4 h-4 mr-2" />
                                                                    In Person
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="phone">
                                                                <div className="flex items-center">
                                                                    <Phone className="w-4 h-4 mr-2" />
                                                                    Phone Call
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="startTime">Start Time</Label>
                                                    <Input
                                                        id="startTime"
                                                        type="time"
                                                        value={newAppointment.startTime}
                                                        onChange={(e) =>
                                                            setNewAppointment({
                                                                ...newAppointment,
                                                                startTime: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="endTime">End Time</Label>
                                                    <Input
                                                        id="endTime"
                                                        type="time"
                                                        value={newAppointment.endTime}
                                                        onChange={(e) =>
                                                            setNewAppointment({ ...newAppointment, endTime: e.target.value })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="attendeeName">Attendee Name</Label>
                                                    <Input
                                                        id="attendeeName"
                                                        placeholder="John Doe"
                                                        value={newAppointment.attendeeName}
                                                        onChange={(e) =>
                                                            setNewAppointment({
                                                                ...newAppointment,
                                                                attendeeName: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="attendeeEmail">Attendee Email</Label>
                                                    <Input
                                                        id="attendeeEmail"
                                                        type="email"
                                                        placeholder="john@example.com"
                                                        value={newAppointment.attendeeEmail}
                                                        onChange={(e) =>
                                                            setNewAppointment({
                                                                ...newAppointment,
                                                                attendeeEmail: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {newAppointment.type === "in-person" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Location</Label>
                                                    <Input
                                                        id="location"
                                                        placeholder="Meeting location"
                                                        value={newAppointment.location}
                                                        onChange={(e) =>
                                                            setNewAppointment({
                                                                ...newAppointment,
                                                                location: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium text-sm">Send Reminders</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Email reminders 24h and 1h before
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={newAppointment.reminders}
                                                    onCheckedChange={(checked) =>
                                                        setNewAppointment({ ...newAppointment, reminders: checked })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowNewAppointment(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreateAppointment}
                                                disabled={isLoading || !newAppointment.title || !newAppointment.date}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Create Appointment
                                                    </>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
                    >
                        {[
                            {
                                label: "Today's Appointments",
                                value: todayAppointments.length,
                                icon: <CalendarCheck className="w-5 h-5" />,
                                color: "text-indigo-500",
                                bg: "bg-indigo-500/10",
                            },
                            {
                                label: "This Week",
                                value: appointments.filter((apt) => {
                                    const aptDate = new Date(apt.date);
                                    const now = new Date();
                                    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                                    return aptDate >= now && aptDate <= weekEnd;
                                }).length,
                                icon: <CalendarDays className="w-5 h-5" />,
                                color: "text-purple-500",
                                bg: "bg-purple-500/10",
                            },
                            {
                                label: "Pending Confirmations",
                                value: appointments.filter((apt) => apt.status === "pending").length,
                                icon: <Clock className="w-5 h-5" />,
                                color: "text-yellow-500",
                                bg: "bg-yellow-500/10",
                            },
                            {
                                label: "Total Attendees",
                                value: appointments.reduce((acc, apt) => acc + apt.attendees.length, 0),
                                icon: <Users className="w-5 h-5" />,
                                color: "text-green-500",
                                bg: "bg-green-500/10",
                            },
                        ].map((stat, index) => (
                            <Card key={index} className="bg-background/80 backdrop-blur-sm border-border/50">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>

                    {/* Main Content */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="calendar" className="data-[state=active]:bg-background">
                                <Calendar className="w-4 h-4 mr-2" />
                                Calendar
                            </TabsTrigger>
                            <TabsTrigger value="list" className="data-[state=active]:bg-background">
                                <CalendarDays className="w-4 h-4 mr-2" />
                                Appointments
                            </TabsTrigger>
                            <TabsTrigger value="availability" className="data-[state=active]:bg-background">
                                <Clock className="w-4 h-4 mr-2" />
                                Availability
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="data-[state=active]:bg-background">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        {/* Calendar View */}
                        <TabsContent value="calendar">
                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Calendar */}
                                <Card className="lg:col-span-2 bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <CardTitle className="text-xl">{formatDate(currentDate)}</CardTitle>
                                            <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                                            Today
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-7 gap-1 mb-4">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                                <div
                                                    key={day}
                                                    className="text-center text-sm font-medium text-muted-foreground py-2"
                                                >
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {getDaysInMonth(currentDate).map((day, index) => {
                                                const dayAppointments = day ? getAppointmentsForDate(day) : [];
                                                const isToday =
                                                    day === new Date().getDate() &&
                                                    currentDate.getMonth() === new Date().getMonth() &&
                                                    currentDate.getFullYear() === new Date().getFullYear();
                                                const isSelected =
                                                    selectedDate &&
                                                    day === selectedDate.getDate() &&
                                                    currentDate.getMonth() === selectedDate.getMonth();

                                                return (
                                                    <motion.div
                                                        key={index}
                                                        whileHover={day ? { scale: 1.05 } : {}}
                                                        className={`min-h-[80px] p-2 rounded-lg border transition-all cursor-pointer ${!day
                                                            ? "bg-transparent border-transparent"
                                                            : isToday
                                                                ? "bg-indigo-500/10 border-indigo-500/30"
                                                                : isSelected
                                                                    ? "bg-primary/10 border-primary/30"
                                                                    : "bg-muted/30 border-border/50 hover:border-primary/30"
                                                            }`}
                                                        onClick={() =>
                                                            day &&
                                                            setSelectedDate(
                                                                new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                                                            )
                                                        }
                                                    >
                                                        {day && (
                                                            <>
                                                                <div
                                                                    className={`text-sm font-medium ${isToday ? "text-indigo-600 dark:text-indigo-400" : ""
                                                                        }`}
                                                                >
                                                                    {day}
                                                                </div>
                                                                <div className="mt-1 space-y-1">
                                                                    {dayAppointments.slice(0, 2).map((apt) => (
                                                                        <div
                                                                            key={apt.id}
                                                                            className={`text-xs truncate px-1.5 py-0.5 rounded ${apt.status === "cancelled"
                                                                                ? "bg-red-500/10 text-red-600 line-through"
                                                                                : apt.status === "pending"
                                                                                    ? "bg-yellow-500/10 text-yellow-600"
                                                                                    : "bg-indigo-500/10 text-indigo-600"
                                                                                }`}
                                                                        >
                                                                            {apt.startTime} {apt.title}
                                                                        </div>
                                                                    ))}
                                                                    {dayAppointments.length > 2 && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            +{dayAppointments.length - 2} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Upcoming Appointments */}
                                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CalendarCheck className="w-5 h-5 text-indigo-500" />
                                            Upcoming
                                        </CardTitle>
                                        <CardDescription>Your next appointments</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {upcomingAppointments.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No upcoming appointments</p>
                                            </div>
                                        ) : (
                                            upcomingAppointments.map((apt) => (
                                                <motion.div
                                                    key={apt.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {apt.type === "video" ? (
                                                                <Video className="w-4 h-4 text-indigo-500" />
                                                            ) : apt.type === "phone" ? (
                                                                <Phone className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <MapPin className="w-4 h-4 text-purple-500" />
                                                            )}
                                                            <span className="font-medium text-sm">{apt.title}</span>
                                                        </div>
                                                        <Badge
                                                            variant="secondary"
                                                            className={
                                                                apt.status === "confirmed"
                                                                    ? "bg-green-500/10 text-green-600"
                                                                    : apt.status === "pending"
                                                                        ? "bg-yellow-500/10 text-yellow-600"
                                                                        : "bg-red-500/10 text-red-600"
                                                            }
                                                        >
                                                            {apt.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays className="w-3 h-3" />
                                                            {new Date(apt.date).toLocaleDateString("en-US", {
                                                                weekday: "short",
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3 h-3" />
                                                            {apt.startTime} - {apt.endTime}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3 h-3" />
                                                            {apt.attendees.map((a) => a.name).join(", ")}
                                                        </div>
                                                    </div>
                                                    {apt.status !== "cancelled" && (
                                                        <div className="flex gap-2 mt-3">
                                                            {apt.meetingLink && (
                                                                <Button size="sm" variant="outline" className="flex-1 text-xs">
                                                                    <Video className="w-3 h-3 mr-1" />
                                                                    Join
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                                                onClick={() => handleCancelAppointment(apt.id)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Appointments List */}
                        <TabsContent value="list">
                            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle>All Appointments</CardTitle>
                                    <CardDescription>Manage and view all your scheduled appointments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {appointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`p-3 rounded-xl ${apt.type === "video"
                                                            ? "bg-indigo-500/10 text-indigo-500"
                                                            : apt.type === "phone"
                                                                ? "bg-green-500/10 text-green-500"
                                                                : "bg-purple-500/10 text-purple-500"
                                                            }`}
                                                    >
                                                        {apt.type === "video" ? (
                                                            <Video className="w-5 h-5" />
                                                        ) : apt.type === "phone" ? (
                                                            <Phone className="w-5 h-5" />
                                                        ) : (
                                                            <MapPin className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{apt.title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(apt.date).toLocaleDateString("en-US", {
                                                                weekday: "long",
                                                                month: "long",
                                                                day: "numeric",
                                                            })}{" "}
                                                            • {apt.startTime} - {apt.endTime}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Users className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">
                                                                {apt.attendees.map((a) => a.name).join(", ")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge
                                                        className={
                                                            apt.status === "confirmed"
                                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                                : apt.status === "pending"
                                                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                                        }
                                                    >
                                                        {apt.status}
                                                    </Badge>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Availability Settings */}
                        <TabsContent value="availability">
                            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle>Availability Settings</CardTitle>
                                    <CardDescription>Configure when clients can book appointments with you</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="font-semibold mb-4">Working Hours</h3>
                                            <div className="space-y-3">
                                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                                                    <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                                        <span className="font-medium">{day}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Input type="time" defaultValue="09:00" className="w-24" />
                                                            <span>-</span>
                                                            <Input type="time" defaultValue="17:00" className="w-24" />
                                                        </div>
                                                    </div>
                                                ))}
                                                {["Saturday", "Sunday"].map((day) => (
                                                    <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 opacity-50">
                                                        <span className="font-medium">{day}</span>
                                                        <Badge variant="secondary">Off</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold mb-4">Time Slots</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {timeSlots.map((slot, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 rounded-lg text-center text-sm transition-colors cursor-pointer ${slot.available
                                                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                                            : "bg-red-500/10 text-red-600 opacity-50"
                                                            }`}
                                                    >
                                                        {slot.time}
                                                        {slot.available && <Check className="w-3 h-3 inline ml-1" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Settings */}
                        <TabsContent value="settings">
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader>
                                        <CardTitle>Calendar Integrations</CardTitle>
                                        <CardDescription>Connect your calendars for bi-directional sync</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[
                                            { name: "Google Calendar", connected: isGoogleConnected, color: "text-red-500" },
                                            { name: "Outlook Calendar", connected: false, color: "text-blue-500" },
                                            { name: "Apple Calendar", connected: false, color: "text-gray-500" },
                                        ].map((cal, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className={`w-5 h-5 ${cal.color}`} />
                                                    <span className="font-medium">{cal.name}</span>
                                                </div>
                                                {cal.connected ? (
                                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                                        Connected
                                                    </Badge>
                                                ) : (
                                                    <Button variant="outline" size="sm">
                                                        Connect
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader>
                                        <CardTitle>Notification Settings</CardTitle>
                                        <CardDescription>Configure how you receive appointment notifications</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[
                                            { label: "Email notifications", description: "Receive booking confirmations", enabled: true },
                                            { label: "SMS reminders", description: "Get text reminders before meetings", enabled: false },
                                            { label: "Browser notifications", description: "Desktop push notifications", enabled: true },
                                            { label: "Daily digest", description: "Summary of daily appointments", enabled: true },
                                        ].map((setting, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                                                <div>
                                                    <p className="font-medium text-sm">{setting.label}</p>
                                                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                                                </div>
                                                <Switch defaultChecked={setting.enabled} />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <Footer />
        </div>
    );
}
