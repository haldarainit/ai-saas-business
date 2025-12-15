"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    Video,
    Phone,
    MapPin,
    Globe,
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    User,
    Mail,
    MessageSquare,
    CheckCircle2,
    CalendarCheck,
} from "lucide-react";

interface EventType {
    id: string;
    name: string;
    slug: string;
    description: string;
    duration: number;
    color: string;
    location: {
        type: string;
        provider: string;
        value?: string;
    };
    customQuestions: {
        id: string;
        label: string;
        type: string;
        required: boolean;
        placeholder?: string;
        options?: string[];
    }[];
}

interface TimeSlot {
    time: string;
    endTime: string;
    available: boolean;
    formattedTime: string;
}

interface UserProfile {
    username: string;
    displayName: string;
    profileImage: string;
    brandColor: string;
    timezone: string;
}

export default function EventBookingPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const eventSlug = params.eventSlug as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking flow state
    const [step, setStep] = useState<"date" | "time" | "details" | "confirmation">("date");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [booking, setBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Form state
    const [attendee, setAttendee] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
        customResponses: {} as Record<string, string>,
    });

    useEffect(() => {
        fetchEventType();
    }, [username, eventSlug]);

    useEffect(() => {
        if (selectedDate && eventType) {
            fetchTimeSlots();
        }
    }, [selectedDate, eventType]);

    const fetchEventType = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/scheduling/public/${username}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load event");
            }

            setProfile(data.profile);

            const event = data.eventTypes.find((e: any) => e.slug === eventSlug);
            if (!event) {
                throw new Error("Event type not found");
            }

            // Fetch full event type details
            const eventResponse = await fetch(`/api/scheduling/event-types?userId=${data.profile.userId || username}&slug=${eventSlug}`);
            const eventData = await eventResponse.json();

            if (eventData.eventTypes && eventData.eventTypes.length > 0) {
                setEventType(eventData.eventTypes.find((e: any) => e.slug === eventSlug) || event);
            } else {
                setEventType(event);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeSlots = async () => {
        if (!selectedDate || !eventType) return;

        try {
            setLoadingSlots(true);
            const response = await fetch(
                `/api/scheduling/slots?eventTypeId=${eventType.id}&date=${selectedDate}`
            );
            const data = await response.json();

            if (response.ok) {
                setTimeSlots(data.slots || []);
            }
        } catch (err) {
            console.error("Error fetching slots:", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedDate || !selectedTime || !eventType) return;

        try {
            setBooking(true);
            const response = await fetch("/api/scheduling/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventTypeId: eventType.id,
                    date: selectedDate,
                    startTime: selectedTime,
                    attendee: {
                        name: attendee.name,
                        email: attendee.email,
                        phone: attendee.phone,
                        customResponses: attendee.customResponses,
                    },
                    attendeeNotes: attendee.notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create booking");
            }

            setBookingResult(data.booking);
            setStep("confirmation");

            // Send confirmation email
            try {
                await fetch("/api/scheduling/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "confirmation",
                        bookingId: data.booking.bookingId,
                    }),
                });
            } catch (emailErr) {
                console.error("Error sending confirmation email:", emailErr);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBooking(false);
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (number | null)[] = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentMonth((prev) => {
            const newDate = new Date(prev);
            if (direction === "prev") {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
        setSelectedDate(null);
        setSelectedTime(null);
    };

    const isDateSelectable = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };

    const formatSelectedDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const brandColor = profile?.brandColor || eventType?.color || "#6366f1";

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-12 w-64 mb-8" />
                    <div className="grid md:grid-cols-2 gap-8">
                        <Skeleton className="h-96" />
                        <Skeleton className="h-96" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !eventType) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
                    <p className="text-muted-foreground">{error || "This event doesn't exist."}</p>
                    <Button className="mt-6" onClick={() => router.push(`/book/${username}`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Button>
                </Card>
            </div>
        );
    }

    // Confirmation step
    if (step === "confirmation" && bookingResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg mx-auto"
                >
                    <Card className="overflow-hidden">
                        <div
                            className="py-8 text-center text-white"
                            style={{ background: `linear-gradient(135deg, ${brandColor}, ${adjustColor(brandColor, -20)})` }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                            >
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                            </motion.div>
                            <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
                        </div>

                        <CardContent className="p-6">
                            <div className="bg-muted/50 rounded-xl p-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4">{eventType.name}</h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-muted-foreground" />
                                        <span>{formatSelectedDate(bookingResult.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                        <span>{bookingResult.startTime} - {bookingResult.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                        <span>with {bookingResult.hostName}</span>
                                    </div>
                                </div>

                                {bookingResult.meetingLink && (
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                            Meeting Link
                                        </p>
                                        <a
                                            href={bookingResult.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline break-all"
                                        >
                                            {bookingResult.meetingLink}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-muted-foreground text-center mb-6">
                                A calendar invitation has been sent to <strong>{attendee.email}</strong>
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push(`/book/${username}`)}
                                >
                                    Book Another
                                </Button>
                                <Button
                                    className="flex-1"
                                    style={{ background: brandColor }}
                                    onClick={() => {
                                        // Add to Google Calendar
                                        const startDate = `${bookingResult.date.replace(/-/g, "")}T${bookingResult.startTime.replace(":", "")}00`;
                                        const endDate = `${bookingResult.date.replace(/-/g, "")}T${bookingResult.endTime.replace(":", "")}00`;
                                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventType.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(bookingResult.meetingLink || "")}`;
                                        window.open(url, "_blank");
                                    }}
                                >
                                    <CalendarCheck className="w-4 h-4 mr-2" />
                                    Add to Calendar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back button */}
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => router.push(`/book/${username}`)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Event Info Sidebar */}
                    <div className="lg:col-span-2">
                        <Card className="sticky top-8">
                            <CardContent className="p-6">
                                {/* Host info */}
                                <div className="flex items-center gap-3 mb-6">
                                    {profile?.profileImage ? (
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={profile.profileImage} />
                                            <AvatarFallback style={{ background: brandColor }}>
                                                {profile.displayName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ background: brandColor }}
                                        >
                                            {profile?.displayName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{profile?.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{eventType.name}</p>
                                    </div>
                                </div>

                                <div
                                    className="w-full h-1 rounded-full mb-6"
                                    style={{ background: brandColor }}
                                />

                                {/* Event details */}
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">{eventType.name}</h2>

                                    {eventType.description && (
                                        <p className="text-muted-foreground">{eventType.description}</p>
                                    )}

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                            <span>{eventType.duration} minutes</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {eventType.location?.type === "video" ? (
                                                <Video className="w-5 h-5 text-muted-foreground" />
                                            ) : eventType.location?.type === "phone" ? (
                                                <Phone className="w-5 h-5 text-muted-foreground" />
                                            ) : (
                                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                            )}
                                            <span>
                                                {eventType.location?.type === "video"
                                                    ? "Video Call"
                                                    : eventType.location?.type === "phone"
                                                        ? "Phone Call"
                                                        : eventType.location?.value || "In Person"}
                                            </span>
                                        </div>

                                        {profile?.timezone && (
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-5 h-5 text-muted-foreground" />
                                                <span>{profile.timezone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected date/time summary */}
                                    {selectedDate && (
                                        <div className="mt-6 p-4 bg-muted/50 rounded-xl space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium">
                                                    {formatSelectedDate(selectedDate)}
                                                </span>
                                            </div>
                                            {selectedTime && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-medium">{selectedTime}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Flow */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {step === "date" && (
                                <motion.div
                                    key="date"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Select a Date</CardTitle>
                                            <CardDescription>
                                                Choose a date for your {eventType.duration}-minute meeting
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Calendar header */}
                                            <div className="flex items-center justify-between mb-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigateMonth("prev")}
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </Button>
                                                <h3 className="text-xl font-semibold">
                                                    {formatMonthYear(currentMonth)}
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigateMonth("next")}
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>

                                            {/* Day names */}
                                            <div className="grid grid-cols-7 gap-2 mb-4">
                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                                    (day) => (
                                                        <div
                                                            key={day}
                                                            className="text-center text-sm font-medium text-muted-foreground py-2"
                                                        >
                                                            {day}
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {/* Calendar grid */}
                                            <div className="grid grid-cols-7 gap-2">
                                                {getDaysInMonth(currentMonth).map((day, index) => {
                                                    if (day === null) {
                                                        return <div key={index} />;
                                                    }

                                                    const dateStr = `${currentMonth.getFullYear()}-${String(
                                                        currentMonth.getMonth() + 1
                                                    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                                    const isSelectable = isDateSelectable(day);
                                                    const isSelected = selectedDate === dateStr;
                                                    const isToday =
                                                        new Date().toDateString() ===
                                                        new Date(
                                                            currentMonth.getFullYear(),
                                                            currentMonth.getMonth(),
                                                            day
                                                        ).toDateString();

                                                    return (
                                                        <motion.button
                                                            key={index}
                                                            whileHover={isSelectable ? { scale: 1.1 } : {}}
                                                            whileTap={isSelectable ? { scale: 0.95 } : {}}
                                                            onClick={() => {
                                                                if (isSelectable) {
                                                                    setSelectedDate(dateStr);
                                                                    setSelectedTime(null);
                                                                    setStep("time");
                                                                }
                                                            }}
                                                            disabled={!isSelectable}
                                                            className={`
                                                                aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                                                ${!isSelectable
                                                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                                                    : isSelected
                                                                        ? "text-white"
                                                                        : isToday
                                                                            ? "ring-2 ring-offset-2"
                                                                            : "hover:bg-muted"
                                                                }
                                                            `}
                                                            style={{
                                                                background: isSelected ? brandColor : undefined,
                                                                ringColor: isToday ? brandColor : undefined,
                                                            }}
                                                        >
                                                            {day}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {step === "time" && (
                                <motion.div
                                    key="time"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setStep("date")}
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </Button>
                                                <div>
                                                    <CardTitle>Select a Time</CardTitle>
                                                    <CardDescription>
                                                        {selectedDate && formatSelectedDate(selectedDate)}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {loadingSlots ? (
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                                        <Skeleton key={i} className="h-12" />
                                                    ))}
                                                </div>
                                            ) : timeSlots.filter(s => s.available).length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                                    <p className="text-muted-foreground">
                                                        No available times for this date.
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => setStep("date")}
                                                    >
                                                        Choose Another Date
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                    {timeSlots
                                                        .filter((slot) => slot.available)
                                                        .map((slot) => (
                                                            <motion.button
                                                                key={slot.time}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => {
                                                                    setSelectedTime(slot.time);
                                                                    setStep("details");
                                                                }}
                                                                className={`
                                                                    p-3 rounded-lg border text-sm font-medium transition-all
                                                                    ${selectedTime === slot.time
                                                                        ? "text-white border-transparent"
                                                                        : "hover:border-primary"
                                                                    }
                                                                `}
                                                                style={{
                                                                    background:
                                                                        selectedTime === slot.time
                                                                            ? brandColor
                                                                            : undefined,
                                                                }}
                                                            >
                                                                {slot.formattedTime}
                                                            </motion.button>
                                                        ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {step === "details" && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setStep("time")}
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </Button>
                                                <div>
                                                    <CardTitle>Your Details</CardTitle>
                                                    <CardDescription>
                                                        Enter your information to confirm the booking
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Name *</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="name"
                                                            placeholder="Your name"
                                                            className="pl-10"
                                                            value={attendee.name}
                                                            onChange={(e) =>
                                                                setAttendee({ ...attendee, name: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email *</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="your@email.com"
                                                            className="pl-10"
                                                            value={attendee.email}
                                                            onChange={(e) =>
                                                                setAttendee({ ...attendee, email: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">Phone (optional)</Label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="phone"
                                                            placeholder="+1 (555) 000-0000"
                                                            className="pl-10"
                                                            value={attendee.phone}
                                                            onChange={(e) =>
                                                                setAttendee({ ...attendee, phone: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="notes">Additional notes</Label>
                                                    <Textarea
                                                        id="notes"
                                                        placeholder="Anything you'd like the host to know..."
                                                        rows={4}
                                                        value={attendee.notes}
                                                        onChange={(e) =>
                                                            setAttendee({ ...attendee, notes: e.target.value })
                                                        }
                                                    />
                                                </div>

                                                {/* Custom questions */}
                                                {eventType.customQuestions?.map((question) => (
                                                    <div key={question.id} className="space-y-2">
                                                        <Label>
                                                            {question.label}
                                                            {question.required && " *"}
                                                        </Label>
                                                        {question.type === "textarea" ? (
                                                            <Textarea
                                                                placeholder={question.placeholder}
                                                                value={attendee.customResponses[question.id] || ""}
                                                                onChange={(e) =>
                                                                    setAttendee({
                                                                        ...attendee,
                                                                        customResponses: {
                                                                            ...attendee.customResponses,
                                                                            [question.id]: e.target.value,
                                                                        },
                                                                    })
                                                                }
                                                            />
                                                        ) : (
                                                            <Input
                                                                type={question.type === "email" ? "email" : "text"}
                                                                placeholder={question.placeholder}
                                                                value={attendee.customResponses[question.id] || ""}
                                                                onChange={(e) =>
                                                                    setAttendee({
                                                                        ...attendee,
                                                                        customResponses: {
                                                                            ...attendee.customResponses,
                                                                            [question.id]: e.target.value,
                                                                        },
                                                                    })
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                className="w-full"
                                                size="lg"
                                                onClick={handleBooking}
                                                disabled={!attendee.name || !attendee.email || booking}
                                                style={{ background: brandColor }}
                                            >
                                                {booking ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Confirming...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Confirm Booking
                                                    </>
                                                )}
                                            </Button>

                                            <p className="text-xs text-center text-muted-foreground">
                                                By confirming, you agree to receive email notifications about this booking.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);

    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
