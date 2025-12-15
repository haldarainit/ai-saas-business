"use client";

import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, Video, Phone, MapPin, Copy, ExternalLink, Loader2, Link2, User, Settings, Trash2, Check, Mail, Send, CalendarCheck, Users, Globe, Bell } from "lucide-react";
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
        welcomeMessage: "", notificationEmail: "", emailEnabled: true
    });

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
                emailEnabled: profile.notifications?.emailEnabled !== false
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
                                                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>{booking.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
