"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    Video,
    MapPin,
    Phone,
    User,
    Mail,
    Loader2,
    CalendarCheck,
    Sparkles,
} from "lucide-react";

interface TimeSlot {
    time: string;
    display: string;
    available: boolean;
}

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<"video" | "phone" | "in-person">("video");
    const [isLoading, setIsLoading] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });

    const timeSlots: TimeSlot[] = [
        { time: "09:00", display: "9:00 AM", available: true },
        { time: "09:30", display: "9:30 AM", available: true },
        { time: "10:00", display: "10:00 AM", available: false },
        { time: "10:30", display: "10:30 AM", available: true },
        { time: "11:00", display: "11:00 AM", available: true },
        { time: "11:30", display: "11:30 AM", available: false },
        { time: "12:00", display: "12:00 PM", available: true },
        { time: "14:00", display: "2:00 PM", available: true },
        { time: "14:30", display: "2:30 PM", available: true },
        { time: "15:00", display: "3:00 PM", available: false },
        { time: "15:30", display: "3:30 PM", available: true },
        { time: "16:00", display: "4:00 PM", available: true },
        { time: "16:30", display: "4:30 PM", available: true },
        { time: "17:00", display: "5:00 PM", available: true },
    ];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (Date | null)[] = [];

        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const isDateAvailable = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Normalize the date to midnight for comparison
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const day = date.getDay();
        // Available if it's a weekday and not in the past
        return normalizedDate >= today && day !== 0 && day !== 6;
    };

    // Clear selected time when date changes
    useEffect(() => {
        setSelectedTime(null);
    }, [selectedDate]);

    const handleBooking = async () => {
        setIsLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setIsBooked(true);
        setIsLoading(false);
    };

    const meetingTypes = [
        {
            id: "video",
            icon: <Video className="w-6 h-6" />,
            title: "Video Call",
            description: "Google Meet link will be sent",
            color: "text-indigo-500",
            bgColor: "bg-indigo-500/10",
            borderColor: "border-indigo-500",
        },
        {
            id: "phone",
            icon: <Phone className="w-6 h-6" />,
            title: "Phone Call",
            description: "We'll call you",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500",
        },
        {
            id: "in-person",
            icon: <MapPin className="w-6 h-6" />,
            title: "In Person",
            description: "Visit our office",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500",
        },
    ];

    if (isBooked) {
        return (
            <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center py-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-md mx-auto px-4"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </motion.div>

                        <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
                        <p className="text-muted-foreground mb-8">
                            Your appointment has been scheduled. You'll receive a confirmation
                            email shortly with all the details.
                        </p>

                        <Card className="text-left mb-8 bg-muted/30">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-indigo-500" />
                                    <span>
                                        {selectedDate?.toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    <span>
                                        {timeSlots.find((t) => t.time === selectedTime)?.display}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedType === "video" ? (
                                        <Video className="w-5 h-5 text-indigo-500" />
                                    ) : selectedType === "phone" ? (
                                        <Phone className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <MapPin className="w-5 h-5 text-purple-500" />
                                    )}
                                    <span>
                                        {meetingTypes.find((t) => t.id === selectedType)?.title}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={() => {
                                setIsBooked(false);
                                setStep(1);
                                setSelectedDate(null);
                                setSelectedTime(null);
                                setFormData({ name: "", email: "", phone: "", notes: "" });
                            }}
                            variant="outline"
                        >
                            Book Another Appointment
                        </Button>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <main className="flex-1 py-12">
                <div className="container max-w-4xl px-4 md:px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <Badge className="mb-4 bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Book an Appointment
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Schedule a{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Consultation
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Choose a convenient time and we'll get back to you with
                            confirmation.
                        </p>
                    </motion.div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-12">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <motion.div
                                    animate={{
                                        scale: step === s ? 1.1 : 1,
                                        backgroundColor: step >= s ? "rgb(99, 102, 241)" : "transparent",
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s
                                        ? "bg-indigo-500 text-white"
                                        : "border-2 border-muted-foreground/30 text-muted-foreground"
                                        }`}
                                >
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                                </motion.div>
                                {s < 3 && (
                                    <div
                                        className={`w-20 h-0.5 mx-2 transition-colors ${step > s ? "bg-indigo-500" : "bg-muted-foreground/30"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 1: Select Date & Time */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader>
                                        <CardTitle>Select Date & Time</CardTitle>
                                        <CardDescription>
                                            Choose your preferred appointment date and time slot
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Calendar */}
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setCurrentMonth(
                                                                new Date(
                                                                    currentMonth.getFullYear(),
                                                                    currentMonth.getMonth() - 1
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </Button>
                                                    <h3 className="font-semibold">
                                                        {currentMonth.toLocaleDateString("en-US", {
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setCurrentMonth(
                                                                new Date(
                                                                    currentMonth.getFullYear(),
                                                                    currentMonth.getMonth() + 1
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-7 gap-1 mb-2">
                                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                                                        (day) => (
                                                            <div
                                                                key={day}
                                                                className="text-center text-xs font-medium text-muted-foreground py-2"
                                                            >
                                                                {day}
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-7 gap-1">
                                                    {getDaysInMonth(currentMonth).map((date, idx) => {
                                                        const isAvailable = date && isDateAvailable(date);
                                                        const isSelected =
                                                            selectedDate?.toDateString() ===
                                                            date?.toDateString();

                                                        return (
                                                            <motion.button
                                                                key={idx}
                                                                whileHover={isAvailable ? { scale: 1.1 } : {}}
                                                                whileTap={isAvailable ? { scale: 0.95 } : {}}
                                                                onClick={() => isAvailable && setSelectedDate(date)}
                                                                disabled={!isAvailable}
                                                                className={`aspect-square rounded-lg text-sm font-medium transition-all ${!date
                                                                    ? "bg-transparent cursor-default"
                                                                    : isSelected
                                                                        ? "bg-indigo-500 text-white"
                                                                        : isAvailable
                                                                            ? "hover:bg-indigo-500/10 cursor-pointer"
                                                                            : "text-muted-foreground/30 cursor-not-allowed"
                                                                    }`}
                                                            >
                                                                {date?.getDate()}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Time Slots */}
                                            <div>
                                                <h3 className="font-semibold mb-4">
                                                    {selectedDate
                                                        ? `Available times on ${selectedDate.toLocaleDateString(
                                                            "en-US",
                                                            { month: "short", day: "numeric" }
                                                        )}`
                                                        : "Select a date first"}
                                                </h3>

                                                {selectedDate ? (
                                                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                                        {timeSlots.map((slot) => (
                                                            <motion.button
                                                                key={slot.time}
                                                                whileHover={slot.available ? { scale: 1.02 } : {}}
                                                                whileTap={slot.available ? { scale: 0.98 } : {}}
                                                                onClick={() =>
                                                                    slot.available && setSelectedTime(slot.time)
                                                                }
                                                                disabled={!slot.available}
                                                                className={`p-3 rounded-lg text-sm font-medium transition-all ${selectedTime === slot.time
                                                                    ? "bg-indigo-500 text-white"
                                                                    : slot.available
                                                                        ? "bg-muted/50 hover:bg-indigo-500/10 cursor-pointer"
                                                                        : "bg-muted/20 text-muted-foreground/30 cursor-not-allowed line-through"
                                                                    }`}
                                                            >
                                                                {slot.display}
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                        <Calendar className="w-12 h-12 opacity-30 mr-3" />
                                                        <span>Please select a date</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-8">
                                            <Button
                                                onClick={() => setStep(2)}
                                                disabled={!selectedDate || !selectedTime}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600"
                                            >
                                                Continue
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 2: Meeting Type */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader>
                                        <CardTitle>Choose Meeting Type</CardTitle>
                                        <CardDescription>
                                            How would you like to meet?
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-3 gap-4 mb-8">
                                            {meetingTypes.map((type) => (
                                                <motion.div
                                                    key={type.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Card
                                                        className={`cursor-pointer transition-all ${selectedType === type.id
                                                            ? `border-2 ${type.borderColor} ${type.bgColor}`
                                                            : "border-border/50 hover:border-primary/30"
                                                            }`}
                                                        onClick={() => setSelectedType(type.id as "video" | "phone" | "in-person")}
                                                    >
                                                        <CardContent className="p-6 text-center">
                                                            <div
                                                                className={`w-14 h-14 rounded-xl ${type.bgColor} ${type.color} flex items-center justify-center mx-auto mb-4`}
                                                            >
                                                                {type.icon}
                                                            </div>
                                                            <h3 className="font-semibold mb-1">{type.title}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {type.description}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between">
                                            <Button variant="outline" onClick={() => setStep(1)}>
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Back
                                            </Button>
                                            <Button
                                                onClick={() => setStep(3)}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600"
                                            >
                                                Continue
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 3: Your Details */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                                    <CardHeader>
                                        <CardTitle>Your Details</CardTitle>
                                        <CardDescription>
                                            Please provide your contact information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Full Name *</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="name"
                                                            placeholder="John Doe"
                                                            value={formData.name}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, name: e.target.value })
                                                            }
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email Address *</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="john@example.com"
                                                            value={formData.email}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, email: e.target.value })
                                                            }
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">Phone Number</Label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="phone"
                                                            type="tel"
                                                            placeholder="+91 98765 43210"
                                                            value={formData.phone}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, phone: e.target.value })
                                                            }
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="notes">Additional Notes</Label>
                                                    <Textarea
                                                        id="notes"
                                                        placeholder="Anything you'd like us to know..."
                                                        value={formData.notes}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, notes: e.target.value })
                                                        }
                                                        rows={4}
                                                    />
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div>
                                                <Card className="bg-muted/30">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg">
                                                            Booking Summary
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                                            <Calendar className="w-5 h-5 text-indigo-500" />
                                                            <div>
                                                                <p className="text-sm font-medium">Date</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {selectedDate?.toLocaleDateString("en-US", {
                                                                        weekday: "long",
                                                                        month: "long",
                                                                        day: "numeric",
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                                            <Clock className="w-5 h-5 text-indigo-500" />
                                                            <div>
                                                                <p className="text-sm font-medium">Time</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {
                                                                        timeSlots.find((t) => t.time === selectedTime)
                                                                            ?.display
                                                                    }{" "}
                                                                    (30 min)
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                                            {selectedType === "video" ? (
                                                                <Video className="w-5 h-5 text-indigo-500" />
                                                            ) : selectedType === "phone" ? (
                                                                <Phone className="w-5 h-5 text-green-500" />
                                                            ) : (
                                                                <MapPin className="w-5 h-5 text-purple-500" />
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium">Meeting Type</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {
                                                                        meetingTypes.find((t) => t.id === selectedType)
                                                                            ?.title
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        <div className="flex justify-between mt-8">
                                            <Button variant="outline" onClick={() => setStep(2)}>
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleBooking}
                                                disabled={isLoading || !formData.name || !formData.email}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600 min-w-[200px]"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Booking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CalendarCheck className="w-4 h-4 mr-2" />
                                                        Confirm Booking
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <Footer />
        </div>
    );
}
