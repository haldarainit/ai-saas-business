"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Plus, Video, Phone, MapPin, Copy, ExternalLink, Loader2, Link2, User, Settings, Trash2, Check, Mail, Send, CalendarCheck, Users, Globe, Bell, ChevronLeft, ChevronRight, CalendarDays, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EventType {
    _id: string;
    name: string;
    slug: string;
    bookingLinkId: string;
    description: string;
    duration: number;
    color: string;
    location: { type: string; provider: string };
    isActive: boolean;
}

interface Booking {
    _id: string;
    bookingId: string;
    eventTypeId?: string | { _id: string };
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    attendee: { name: string; email: string };
    meetingLink?: string;
    locationType: string;
}

interface UserProfile {
    username: string;
    displayName: string;
    bio: string;
    brandColor: string;
    welcomeMessage: string;
    bookingLink: string;
    notifications?: {
        emailEnabled: boolean;
        notificationEmail?: string;
    };
    googleCalendar?: {
        connected: boolean;
        clientId?: string;
        clientSecret?: string;
        connectedEmail?: string;
    };
}

export default function AppointmentDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("bookings");
    const [loading, setLoading] = useState(true);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showEventDialog, setShowEventDialog] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [selectedEventForEmail, setSelectedEventForEmail] = useState<EventType | null>(null);

    // New event type form
    const [newEvent, setNewEvent] = useState({
        name: "", description: "", duration: 30, color: "#6366f1",
        locationType: "video", bufferTimeBefore: 0, bufferTimeAfter: 15,
        minimumNotice: 60, schedulingWindow: 30
    });

    // Email invite form
    const [emailInvite, setEmailInvite] = useState({ email: "", message: "" });

    // Profile form
    const [profileForm, setProfileForm] = useState({
        displayName: "", username: "", bio: "", brandColor: "#6366f1",
        welcomeMessage: "", notificationEmail: "", emailEnabled: true,
        googleClientId: "", googleClientSecret: ""
    });

    // Google Calendar state
    const [savingCredentials, setSavingCredentials] = useState(false);
    const [showClientSecret, setShowClientSecret] = useState(false);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);

    const userId = user?.email || user?.id || "";

    useEffect(() => {
        if (userId) fetchData();
        else setLoading(false);
    }, [userId]);

    useEffect(() => {
        if (profile) {
            setProfileForm({
                displayName: profile.displayName || "",
                username: profile.username || "",
                bio: profile.bio || "",
                brandColor: profile.brandColor || "#6366f1",
                welcomeMessage: profile.welcomeMessage || "",
                notificationEmail: profile.notifications?.notificationEmail || "",
                emailEnabled: profile.notifications?.emailEnabled !== false,
                googleClientId: profile.googleCalendar?.clientId || "",
                googleClientSecret: profile.googleCalendar?.clientSecret || ""
            });
        }
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // First ensure profile exists
            let profileRes = await fetch(`/api/scheduling/profile?userId=${userId}`);
            let profileData = await profileRes.json();

            if (!profileData.success || !profileData.profile) {
                const createRes = await fetch("/api/scheduling/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, email: user?.email || userId })
                });
                profileData = await createRes.json();
            }

            if (profileData.success) setProfile(profileData.profile);

            const [eventsRes, bookingsRes] = await Promise.all([
                fetch(`/api/scheduling/event-types?userId=${userId}`),
                fetch(`/api/scheduling/bookings?userId=${userId}`)
            ]);

            const eventsData = await eventsRes.json();
            const bookingsData = await bookingsRes.json();

            if (eventsData.success) setEventTypes(eventsData.eventTypes || []);
            if (bookingsData.success) setBookings(bookingsData.bookings || []);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const createEventType = async () => {
        if (!newEvent.name.trim()) {
            toast.error("Event name is required");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/scheduling/event-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    email: user?.email,
                    ...newEvent,
                    location: { type: newEvent.locationType, provider: "google-meet" }
                })
            });
            const data = await res.json();
            if (data.success) {
                setEventTypes([...eventTypes, data.eventType]);
                setShowEventDialog(false);
                setNewEvent({ name: "", description: "", duration: 30, color: "#6366f1", locationType: "video", bufferTimeBefore: 0, bufferTimeAfter: 15, minimumNotice: 60, schedulingWindow: 30 });
                toast.success("Event type created! Copy the booking link to share.");
            } else {
                toast.error(data.error || "Failed to create");
            }
        } catch (err) {
            toast.error("Failed to create event type");
        } finally {
            setSaving(false);
        }
    };

    const deleteEventType = async (id: string) => {
        if (!confirm("Delete this event type?")) return;
        try {
            await fetch(`/api/scheduling/event-types?id=${id}`, { method: "DELETE" });
            setEventTypes(eventTypes.filter(e => e._id !== id));
            toast.success("Event type deleted");
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch("/api/scheduling/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    displayName: profileForm.displayName,
                    username: profileForm.username,
                    bio: profileForm.bio,
                    brandColor: profileForm.brandColor,
                    welcomeMessage: profileForm.welcomeMessage,
                    notifications: {
                        emailEnabled: profileForm.emailEnabled,
                        notificationEmail: profileForm.notificationEmail
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
                toast.success("Settings saved!");
            }
        } catch (err) {
            toast.error("Failed to save");
        } finally {
            setSavingProfile(false);
        }
    };

    const sendBookingLink = async () => {
        if (!emailInvite.email) return;
        setSaving(true);
        try {
            toast.success(`Booking link sent to ${emailInvite.email}`);
            setShowEmailDialog(false);
            setEmailInvite({ email: "", message: "" });
            setSelectedEventForEmail(null);
        } finally {
            setSaving(false);
        }
    };

    const getBookingLink = (event: EventType) => `/book/${event.bookingLinkId}`;
    const getFullBookingLink = (event: EventType) => `${typeof window !== "undefined" ? window.location.origin : ""}${getBookingLink(event)}`;

    const copyBookingLink = (event: EventType) => {
        navigator.clipboard.writeText(getFullBookingLink(event));
        toast.success("Link copied!");
    };

    // Calendar helper functions
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const formatDateKey = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const navigateMonth = (direction: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    // Filter bookings by selected event type
    const filteredBookings = useMemo(() => {
        if (selectedEventFilter === "all") return bookings;
        return bookings.filter(b => {
            const eventTypeId = typeof b.eventTypeId === 'object' && b.eventTypeId !== null
                ? (b.eventTypeId as { _id: string })._id
                : b.eventTypeId;
            return eventTypeId === selectedEventFilter;
        });
    }, [bookings, selectedEventFilter, eventTypes]);

    // Group bookings by date for calendar display
    const bookingsByDate = useMemo(() => {
        const grouped: Record<string, Booking[]> = {};
        filteredBookings.forEach(booking => {
            const dateKey = booking.date;
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(booking);
        });
        return grouped;
    }, [filteredBookings]);

    // Get bookings for selected date
    const selectedDateBookings = useMemo(() => {
        if (!selectedDate) return [];
        return bookingsByDate[selectedDate] || [];
    }, [selectedDate, bookingsByDate]);

    const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getEventColorForBooking = (booking: Booking) => {
        const bookingEventId = typeof booking.eventTypeId === 'object' && booking.eventTypeId !== null
            ? (booking.eventTypeId as { _id: string })._id
            : booking.eventTypeId;
        const eventType = eventTypes.find(e => e._id === bookingEventId);
        return eventType?.color || "#6366f1";
    };

    const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date() && b.status !== "cancelled").slice(0, 5);
    const todayBookings = bookings.filter(b => b.date === new Date().toISOString().split("T")[0]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                    <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Appointment Dashboard</h1>
                        <p className="text-muted-foreground">Manage your booking page and appointments</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setShowEventDialog(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <Plus className="w-4 h-4 mr-2" />New Event Type
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Today", value: todayBookings.length, icon: <CalendarCheck className="w-5 h-5" />, color: "text-indigo-500 bg-indigo-500/10" },
                        { label: "Upcoming", value: upcomingBookings.length, icon: <Calendar className="w-5 h-5" />, color: "text-purple-500 bg-purple-500/10" },
                        { label: "Event Types", value: eventTypes.length, icon: <Settings className="w-5 h-5" />, color: "text-green-500 bg-green-500/10" },
                        { label: "Total Bookings", value: bookings.length, icon: <Users className="w-5 h-5" />, color: "text-blue-500 bg-blue-500/10" }
                    ].map((stat, i) => (
                        <Card key={i}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-3xl font-bold">{stat.value}</p></div>
                                <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-2" />Bookings</TabsTrigger>
                        <TabsTrigger value="calendar"><CalendarDays className="w-4 h-4 mr-2" />Calendar</TabsTrigger>
                        <TabsTrigger value="event-types"><Link2 className="w-4 h-4 mr-2" />Event Types & Links</TabsTrigger>
                        <TabsTrigger value="settings"><User className="w-4 h-4 mr-2" />Settings</TabsTrigger>
                    </TabsList>

                    {/* Bookings Tab */}
                    <TabsContent value="bookings">
                        <Card>
                            <CardHeader><CardTitle>Upcoming Bookings</CardTitle></CardHeader>
                            <CardContent>
                                {upcomingBookings.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No upcoming bookings</p>
                                        <p className="text-sm mt-2">Share your booking links to start receiving appointments</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {upcomingBookings.map(booking => (
                                            <div key={booking._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-lg ${booking.locationType === "video" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}`}>
                                                        {booking.locationType === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{booking.title}</p>
                                                        <p className="text-sm text-muted-foreground">{booking.attendee.name} • {booking.attendee.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
                                                    <p className="text-sm text-muted-foreground">{booking.startTime} - {booking.endTime}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {booking.meetingLink && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                                            onClick={() => window.open(booking.meetingLink, "_blank")}
                                                        >
                                                            <Video className="w-3 h-3 mr-1" />
                                                            Join
                                                        </Button>
                                                    )}
                                                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>{booking.status}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Calendar Tab */}
                    <TabsContent value="calendar">
                        <div className="grid lg:grid-cols-4 gap-6">
                            {/* Main Calendar */}
                            <div className="lg:col-span-3">
                                <Card className="overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <div className="text-center min-w-[180px]">
                                                    <h2 className="text-xl font-bold">
                                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                                    </h2>
                                                </div>
                                                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={goToToday}>
                                                    Today
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <Label className="text-sm whitespace-nowrap">Filter by Event:</Label>
                                                <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
                                                    <SelectTrigger className="w-full sm:w-[200px]">
                                                        <SelectValue placeholder="All Events" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Events</SelectItem>
                                                        {eventTypes.map(event => (
                                                            <SelectItem key={event._id} value={event._id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                                                                    {event.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {/* Day headers */}
                                        <div className="grid grid-cols-7 border-b bg-muted/30">
                                            {dayNames.map(day => (
                                                <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Calendar grid */}
                                        <div className="grid grid-cols-7">
                                            {calendarDays.map((day, index) => {
                                                const dateKey = formatDateKey(day.date);
                                                const dayBookings = bookingsByDate[dateKey] || [];
                                                const hasBookings = dayBookings.length > 0;
                                                const isSelected = selectedDate === dateKey;
                                                const isTodayDate = isToday(day.date);

                                                return (
                                                    <motion.div
                                                        key={index}
                                                        whileHover={{ scale: 0.98, backgroundColor: "rgba(99, 102, 241, 0.05)" }}
                                                        className={`
                                                            min-h-[120px] border-b border-r p-2 cursor-pointer transition-all
                                                            ${!day.isCurrentMonth ? "bg-muted/20" : "bg-background"}
                                                            ${isSelected ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/50 dark:bg-indigo-950/20" : ""}
                                                            ${isTodayDate ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}
                                                        `}
                                                        onClick={() => {
                                                            setSelectedDate(dateKey);
                                                            setShowBookingDetails(true);
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`
                                                                inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                                                                ${!day.isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"}
                                                                ${isTodayDate ? "bg-indigo-600 text-white" : ""}
                                                            `}>
                                                                {day.date.getDate()}
                                                            </span>
                                                            {hasBookings && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {dayBookings.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1 overflow-hidden">
                                                            <AnimatePresence>
                                                                {dayBookings.slice(0, 3).map((booking, bIndex) => (
                                                                    <motion.div
                                                                        key={booking._id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        exit={{ opacity: 0, x: 10 }}
                                                                        transition={{ delay: bIndex * 0.05 }}
                                                                        className="rounded px-2 py-1 text-xs truncate text-white font-medium"
                                                                        style={{ backgroundColor: getEventColorForBooking(booking) }}
                                                                        title={`${booking.startTime} - ${booking.attendee.name}`}
                                                                    >
                                                                        {booking.startTime} {booking.attendee.name}
                                                                    </motion.div>
                                                                ))}
                                                            </AnimatePresence>
                                                            {dayBookings.length > 3 && (
                                                                <p className="text-xs text-muted-foreground text-center">
                                                                    +{dayBookings.length - 3} more
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar - Selected Date Details */}
                            <div className="lg:col-span-1">
                                <Card className="sticky top-4">
                                    <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CalendarCheck className="w-5 h-5" />
                                            {selectedDate
                                                ? new Date(selectedDate + "T00:00:00").toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                                : "Select a Date"
                                            }
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {!selectedDate ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">Click on a date to view bookings</p>
                                            </div>
                                        ) : selectedDateBookings.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium">No Bookings</p>
                                                <p className="text-sm mt-1">No appointments scheduled for this date</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedDateBookings.map((booking, index) => (
                                                    <motion.div
                                                        key={booking._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="p-3 rounded-xl border bg-gradient-to-r from-muted/50 to-muted/30 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className="w-1 h-full min-h-[60px] rounded-full"
                                                                style={{ backgroundColor: getEventColorForBooking(booking) }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                                    <span className="text-sm font-semibold">
                                                                        {booking.startTime} - {booking.endTime}
                                                                    </span>
                                                                </div>
                                                                <p className="font-medium truncate" title={booking.title}>
                                                                    {booking.title}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                                    <User className="w-3 h-3" />
                                                                    <span className="truncate">{booking.attendee.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                                    <Mail className="w-3 h-3" />
                                                                    <span className="truncate text-xs">{booking.attendee.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Badge
                                                                        variant={booking.status === "confirmed" ? "default" : "secondary"}
                                                                        className="text-xs"
                                                                    >
                                                                        {booking.status}
                                                                    </Badge>
                                                                    {booking.locationType === "video" && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            <Video className="w-3 h-3 mr-1" /> Video
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {booking.meetingLink && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="w-full mt-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            window.open(booking.meetingLink, "_blank");
                                                                        }}
                                                                    >
                                                                        <Video className="w-3 h-3 mr-1" />
                                                                        Join Meeting
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Quick Stats for Selected Event */}
                                {selectedEventFilter !== "all" && (
                                    <Card className="mt-4">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Event Statistics</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {(() => {
                                                const selectedEvent = eventTypes.find(e => e._id === selectedEventFilter);
                                                const eventBookings = filteredBookings;
                                                const upcomingCount = eventBookings.filter(b => new Date(b.date) >= new Date()).length;
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">Total Bookings</span>
                                                            <span className="font-bold">{eventBookings.length}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">Upcoming</span>
                                                            <span className="font-bold text-green-600">{upcomingCount}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">Duration</span>
                                                            <span className="font-bold">{selectedEvent?.duration || 0} min</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Event Types & Links Tab */}
                    <TabsContent value="event-types">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eventTypes.map(event => (
                                <Card key={event._id} className="overflow-hidden">
                                    <div className="h-2" style={{ background: event.color }} />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">{event.name}</h3>
                                                <p className="text-sm text-muted-foreground">{event.description || "No description"}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => deleteEventType(event._id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                            <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.duration} min</div>
                                            <div className="flex items-center gap-1">
                                                {event.location?.type === "video" ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                {event.location?.type}
                                            </div>
                                        </div>

                                        {/* Unique Booking Link */}
                                        <div className="bg-muted/50 rounded-lg p-3 mb-4">
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Link2 className="w-3 h-3" />Unique Booking Link:
                                            </p>
                                            <code className="text-xs break-all font-mono">{getFullBookingLink(event)}</code>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="flex-1" onClick={() => copyBookingLink(event)}>
                                                <Copy className="w-3 h-3 mr-1" />Copy Link
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => window.open(getBookingLink(event), "_blank")}>
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => { setSelectedEventForEmail(event); setShowEmailDialog(true); }}>
                                                <Send className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Card className="border-dashed cursor-pointer hover:border-primary transition-colors" onClick={() => setShowEventDialog(true)}>
                                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                                    <Plus className="w-12 h-12 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">Create Event Type</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle>Booking Page Settings</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input value={profileForm.displayName} onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })} placeholder="Your name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Username</Label>
                                            <Input value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} placeholder="username" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bio</Label>
                                        <Textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Tell visitors about yourself..." />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Brand Color</Label>
                                            <Input type="color" value={profileForm.brandColor} onChange={e => setProfileForm({ ...profileForm, brandColor: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Welcome Message</Label>
                                            <Input value={profileForm.welcomeMessage} onChange={e => setProfileForm({ ...profileForm, welcomeMessage: e.target.value })} placeholder="Welcome! Choose an event..." />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Google Calendar Integration */}
                            <Card className="border-2 border-dashed border-green-200 dark:border-green-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-600" />
                                        Google Calendar & Meet Integration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Connect your Google Calendar to automatically create <strong>Google Meet links</strong> for each booking. Each meeting gets a unique Google Meet link synced to your calendar.
                                    </p>

                                    {/* Step 1: API Credentials */}
                                    <div className="border rounded-lg p-4 space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                                            Your Google API Credentials
                                        </h4>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <Label>Google Client ID</Label>
                                                <Input
                                                    value={profileForm.googleClientId}
                                                    onChange={e => setProfileForm({ ...profileForm, googleClientId: e.target.value })}
                                                    placeholder="xxx.apps.googleusercontent.com"
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Google Client Secret</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showClientSecret ? "text" : "password"}
                                                        value={profileForm.googleClientSecret}
                                                        onChange={e => setProfileForm({ ...profileForm, googleClientSecret: e.target.value })}
                                                        placeholder="Enter your Client Secret"
                                                        className="font-mono text-sm pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowClientSecret(!showClientSecret)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={savingCredentials || !profileForm.googleClientId || !profileForm.googleClientSecret}
                                                onClick={async () => {
                                                    setSavingCredentials(true);
                                                    try {
                                                        const res = await fetch("/api/calendar/google/connect", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                userId,
                                                                clientId: profileForm.googleClientId,
                                                                clientSecret: profileForm.googleClientSecret
                                                            })
                                                        });
                                                        const data = await res.json();

                                                        if (data.success) {
                                                            toast.success("Credentials saved! Now connect your calendar.");

                                                            // Update the profile state immediately
                                                            if (profile) {
                                                                setProfile({
                                                                    ...profile,
                                                                    googleCalendar: {
                                                                        ...profile.googleCalendar,
                                                                        clientId: profileForm.googleClientId,
                                                                        clientSecret: profileForm.googleClientSecret,
                                                                        connected: profile.googleCalendar?.connected || false
                                                                    }
                                                                });
                                                            }

                                                            // Also fetch fresh data to ensure sync
                                                            await fetchData();
                                                        } else {
                                                            toast.error(data.error || "Failed to save credentials");
                                                        }
                                                    } catch (err: any) {
                                                        toast.error(err.message || "Failed to save credentials");
                                                    } finally {
                                                        setSavingCredentials(false);
                                                    }
                                                }}
                                            >
                                                {savingCredentials ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                                Save Credentials
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Step 2: Connect Calendar */}
                                    <div className="border rounded-lg p-4 space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</span>
                                            Connect Your Calendar
                                        </h4>

                                        {profile?.googleCalendar?.connected ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                    <Check className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <span className="font-medium text-green-700 dark:text-green-400">Connected</span>
                                                        {profile?.googleCalendar?.connectedEmail && (
                                                            <p className="text-xs text-muted-foreground">{profile?.googleCalendar?.connectedEmail}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                                    onClick={async () => {
                                                        try {
                                                            await fetch(`/api/calendar/google/connect?userId=${userId}`, { method: "DELETE" });
                                                            fetchData();
                                                            toast.success("Google Calendar disconnected");
                                                        } catch (err) {
                                                            toast.error("Failed to disconnect");
                                                        }
                                                    }}
                                                >
                                                    Disconnect Calendar
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {!profile?.googleCalendar?.clientId ? (
                                                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                                                        ⚠️ Please save your Google API credentials first (Step 1)
                                                    </p>
                                                ) : (
                                                    <Button
                                                        className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`/api/calendar/google/connect?userId=${userId}&action=connect`);
                                                                const data = await res.json();
                                                                if (data.authUrl) {
                                                                    window.location.href = data.authUrl;
                                                                } else if (data.needsCredentials) {
                                                                    toast.error("Please save your Google API credentials first");
                                                                } else {
                                                                    toast.error(data.error || "Failed to connect");
                                                                }
                                                            } catch (err) {
                                                                toast.error("Failed to initiate connection");
                                                            }
                                                        }}
                                                    >
                                                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                                        Connect Google Calendar
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Setup Instructions */}
                                    <div className="border-t pt-4 mt-4">
                                        <details className="group">
                                            <summary className="text-sm font-semibold cursor-pointer flex items-center gap-2 list-none">
                                                <Globe className="w-4 h-4" />
                                                How to Get Your Google API Credentials
                                                <span className="ml-auto text-muted-foreground group-open:rotate-90 transition-transform">▶</span>
                                            </summary>
                                            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside mt-3 pl-2">
                                                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                                                <li>Create a new project or select an existing one</li>
                                                <li>Go to <strong>APIs & Services → Library</strong></li>
                                                <li>Search and enable <strong>Google Calendar API</strong></li>
                                                <li>Go to <strong>APIs & Services → Credentials</strong></li>
                                                <li>Click <strong>Create Credentials → OAuth client ID</strong></li>
                                                <li>Select <strong>Web application</strong></li>
                                                <li>Add this <strong>Authorized redirect URI</strong>:
                                                    <code className="block mt-1 p-2 bg-muted rounded text-xs break-all">
                                                        {typeof window !== "undefined" ? window.location.origin : ""}/api/calendar/google/callback
                                                    </code>
                                                </li>
                                                <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them above</li>
                                            </ol>
                                        </details>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Email Notifications</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Bell className="w-5 h-5" />
                                            <div>
                                                <p className="font-medium">Email Notifications</p>
                                                <p className="text-sm text-muted-foreground">Get notified when customers book</p>
                                            </div>
                                        </div>
                                        <Switch checked={profileForm.emailEnabled} onCheckedChange={c => setProfileForm({ ...profileForm, emailEnabled: c })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notification Email</Label>
                                        <p className="text-sm text-muted-foreground">Booking confirmations will be sent to this email</p>
                                        <Input type="email" value={profileForm.notificationEmail} onChange={e => setProfileForm({ ...profileForm, notificationEmail: e.target.value })} placeholder="your@email.com" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-6">
                            <Button onClick={saveProfile} disabled={savingProfile}>
                                {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Save Changes
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Create Event Type Dialog */}
            <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Create Event Type</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Name *</Label><Input value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="e.g., 30 Min Meeting" /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="What is this meeting for?" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Select value={String(newEvent.duration)} onValueChange={v => setNewEvent({ ...newEvent, duration: Number(v) })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="45">45 min</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="90">1.5 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Select value={newEvent.locationType} onValueChange={v => setNewEvent({ ...newEvent, locationType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video"><div className="flex items-center"><Video className="w-4 h-4 mr-2" />Video</div></SelectItem>
                                        <SelectItem value="phone"><div className="flex items-center"><Phone className="w-4 h-4 mr-2" />Phone</div></SelectItem>
                                        <SelectItem value="in-person"><div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />In-Person</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label>Color</Label><Input type="color" value={newEvent.color} onChange={e => setNewEvent({ ...newEvent, color: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
                        <Button onClick={createEventType} disabled={!newEvent.name || saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Email Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={(open) => { setShowEmailDialog(open); if (!open) setSelectedEventForEmail(null); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Send Booking Link</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Email Address</Label><Input type="email" value={emailInvite.email} onChange={e => setEmailInvite({ ...emailInvite, email: e.target.value })} placeholder="client@example.com" /></div>
                        <div className="space-y-2"><Label>Message (optional)</Label><Textarea value={emailInvite.message} onChange={e => setEmailInvite({ ...emailInvite, message: e.target.value })} placeholder="I'd like to schedule a meeting..." /></div>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Link to share:</p>
                            <code className="break-all">{selectedEventForEmail ? getFullBookingLink(selectedEventForEmail) : ""}</code>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
                        <Button onClick={sendBookingLink} disabled={!emailInvite.email || saving}><Send className="w-4 h-4 mr-2" />Send Invite</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
