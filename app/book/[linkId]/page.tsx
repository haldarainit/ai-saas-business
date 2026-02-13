"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  User,
  Mail,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Globe,
  CalendarCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface EventType {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  location: { type: string; provider: string; value?: string };
  minimumNotice: number;
  schedulingWindow: number;
  customQuestions: any[];
  price: number;
  currency: string;
}

interface Host {
  displayName: string;
  bio: string;
  profileImage: string;
  companyName: string;
  brandColor: string;
  welcomeMessage: string;
  timezone: string;
}

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.linkId as string;

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking flow
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchEventType();
  }, [linkId]);

  useEffect(() => {
    if (selectedDate && eventType) {
      // Clear previously selected time when date changes
      setSelectedTime(null);
      fetchTimeSlots();
    }
  }, [selectedDate]);

  const fetchEventType = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/scheduling/book/${linkId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Page not found");
      }

      setEventType(data.eventType);
      setHost(data.host);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate || !eventType) return;

    setLoadingSlots(true);
    try {
      const dateStr = formatLocalDate(selectedDate);
      const res = await fetch(
        `/api/scheduling/slots?eventTypeId=${eventType.id}&date=${dateStr}`,
      );
      const data = await res.json();

      if (data.success) {
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

    setIsSubmitting(true);
    try {
      const dateStr = formatLocalDate(selectedDate);
      const res = await fetch("/api/scheduling/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          date: dateStr,
          startTime: selectedTime,
          attendee: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          attendeeNotes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book");
      }

      setBookingData(data.booking);
      setIsBooked(true);

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
        console.error("Email error:", emailErr);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
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

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Normalize the date to midnight for comparison
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const day = date.getDay();

    // Calculate max date based on scheduling window
    const schedulingWindowDays = eventType?.schedulingWindow || 30;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + schedulingWindowDays);

    // Must be today or future, not a weekend, and within scheduling window
    return (
      normalizedDate >= today &&
      normalizedDate <= maxDate &&
      day !== 0 &&
      day !== 6
    );
  };

  const brandColor = host?.brandColor || "#6366f1";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
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
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">
            {error || "This booking page doesn't exist or is no longer active."}
          </p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (isBooked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto"
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
            You'll receive a confirmation email shortly.
          </p>

          <Card className="text-left mb-8 bg-muted/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: brandColor }} />
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
                <Clock className="w-5 h-5" style={{ color: brandColor }} />
                <span>
                  {selectedTime} ({eventType.duration} min)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {eventType.location?.type === "video" ?
                  <Video className="w-5 h-5" style={{ color: brandColor }} />
                : <MapPin className="w-5 h-5" style={{ color: brandColor }} />}
                <span>
                  {eventType.location?.type === "video" ?
                    "Video Call"
                  : eventType.location?.type}
                </span>
              </div>
              {bookingData?.meetingLink && (
                <div className="pt-2 border-t">
                  <a
                    href={bookingData.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                    style={{ color: brandColor }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Meeting Link
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={() => {
              setIsBooked(false);
              setStep(1);
              setSelectedDate(null);
              setSelectedTime(null);
              setFormData({ name: "", email: "", phone: "", notes: "" });
            }}
          >
            Book Another Appointment
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <style jsx global>{`
        .brand-button {
          background: linear-gradient(
            135deg,
            ${brandColor},
            ${brandColor}dd
          ) !important;
        }
        .brand-button:hover {
          opacity: 0.9;
        }
      `}</style>

      <main className="py-12">
        <div className="container max-w-4xl px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge
              className="mb-4"
              style={{
                backgroundColor: `${brandColor}20`,
                color: brandColor,
                borderColor: `${brandColor}40`,
              }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {host?.companyName || "Book Appointment"}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {eventType.name}
            </h1>
            {eventType.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                {eventType.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {eventType.duration} min
              </div>
              <div className="flex items-center gap-1">
                {eventType.location?.type === "video" ?
                  <Video className="w-4 h-4" />
                : eventType.location?.type === "phone" ?
                  <Phone className="w-4 h-4" />
                : <MapPin className="w-4 h-4" />}
                {eventType.location?.type === "video" ?
                  "Video Call"
                : eventType.location?.type === "phone" ?
                  "Phone Call"
                : "In Person"}
              </div>
              {host?.timezone && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {host.timezone}
                </div>
              )}
            </div>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <motion.div
                  animate={{ scale: step === s ? 1.1 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? "text-white" : "border-2 border-muted-foreground/30 text-muted-foreground"}`}
                  style={step >= s ? { backgroundColor: brandColor } : {}}
                >
                  {step > s ?
                    <CheckCircle className="w-5 h-5" />
                  : s}
                </motion.div>
                {s < 3 && (
                  <div
                    className={`w-20 h-0.5 mx-2 transition-colors`}
                    style={{
                      backgroundColor:
                        step > s ? brandColor : "rgba(0,0,0,0.1)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Date & Time */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-background/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Select Date & Time</CardTitle>
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
                                  currentMonth.getMonth() - 1,
                                ),
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
                                  currentMonth.getMonth() + 1,
                                ),
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
                            ),
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
                                onClick={() =>
                                  isAvailable && setSelectedDate(date)
                                }
                                disabled={!isAvailable}
                                className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                                  !date ? "bg-transparent"
                                  : isSelected ? "text-white"
                                  : isAvailable ?
                                    "hover:bg-muted cursor-pointer"
                                  : "text-muted-foreground/30 cursor-not-allowed"
                                }`}
                                style={
                                  isSelected ?
                                    { backgroundColor: brandColor }
                                  : {}
                                }
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
                          {selectedDate ?
                            `Available on ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : "Select a date first"}
                        </h3>

                        {selectedDate ?
                          loadingSlots ?
                            <div className="flex items-center justify-center h-[300px]">
                              <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                          : timeSlots.length > 0 ?
                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                              {timeSlots
                                .filter((s) => s.available)
                                .map((slot) => (
                                  <motion.button
                                    key={slot.time}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedTime(slot.time)}
                                    className={`p-3 rounded-lg text-sm font-medium transition-all ${selectedTime === slot.time ? "text-white" : "bg-muted/50 hover:bg-muted"}`}
                                    style={
                                      selectedTime === slot.time ?
                                        { backgroundColor: brandColor }
                                      : {}
                                    }
                                  >
                                    {slot.time}
                                  </motion.button>
                                ))}
                            </div>
                          : <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                              No available slots
                            </div>

                        : <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            <Calendar className="w-12 h-12 opacity-30 mr-3" />
                            <span>Please select a date</span>
                          </div>
                        }
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button
                        onClick={() => setStep(2)}
                        disabled={!selectedDate || !selectedTime}
                        className="brand-button text-white"
                      >
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-background/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                              placeholder="John Doe"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  email: e.target.value,
                                })
                              }
                              placeholder="john@example.com"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="+91 98765 43210"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Anything you'd like us to know..."
                            rows={4}
                          />
                        </div>
                      </div>

                      <div>
                        <Card className="bg-muted/30">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Booking Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                              <Calendar
                                className="w-5 h-5"
                                style={{ color: brandColor }}
                              />
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
                              <Clock
                                className="w-5 h-5"
                                style={{ color: brandColor }}
                              />
                              <div>
                                <p className="text-sm font-medium">Time</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedTime} ({eventType.duration} min)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                              {eventType.location?.type === "video" ?
                                <Video
                                  className="w-5 h-5"
                                  style={{ color: brandColor }}
                                />
                              : <MapPin
                                  className="w-5 h-5"
                                  style={{ color: brandColor }}
                                />
                              }
                              <div>
                                <p className="text-sm font-medium">Location</p>
                                <p className="text-sm text-muted-foreground">
                                  {eventType.location?.type === "video" ?
                                    "Video Call"
                                  : eventType.location?.type}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={handleBooking}
                        disabled={
                          isSubmitting || !formData.name || !formData.email
                        }
                        className="brand-button text-white min-w-[200px]"
                      >
                        {isSubmitting ?
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        : <>
                            <CalendarCheck className="w-4 h-4 mr-2" />
                            Confirm Booking
                          </>
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
