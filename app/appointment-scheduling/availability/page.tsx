"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { Clock, Plus, Trash2, Save, Loader2, Globe, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS: Record<string, string> = {
    sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday"
};

interface TimeRange { start: string; end: string; }
interface DaySchedule { enabled: boolean; timeRanges: TimeRange[]; }
interface WeeklySchedule { [key: string]: DaySchedule; }

export default function AvailabilityPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timezone, setTimezone] = useState("Asia/Kolkata");
    const [bufferBetweenMeetings, setBufferBetweenMeetings] = useState(0);
    const [minimumNotice, setMinimumNotice] = useState(60);
    const [schedulingWindow, setSchedulingWindow] = useState(30);
    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
        sunday: { enabled: false, timeRanges: [] },
        monday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
        tuesday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
        wednesday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
        thursday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
        friday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
        saturday: { enabled: false, timeRanges: [] },
    });

    const userId = user?.email || user?.id || "";

    useEffect(() => {
        if (userId) fetchAvailability();
    }, [userId]);

    const fetchAvailability = async () => {
        try {
            const res = await fetch(`/api/scheduling/availability?userId=${userId}`);
            const data = await res.json();
            if (data.success && data.availability) {
                const a = data.availability;
                setTimezone(a.timezone || "Asia/Kolkata");
                setBufferBetweenMeetings(a.bufferBetweenMeetings || 0);
                setMinimumNotice(a.minimumNotice || 60);
                setSchedulingWindow(a.schedulingWindow || 30);
                if (a.weeklySchedule) setWeeklySchedule(a.weeklySchedule);
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const saveAvailability = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/scheduling/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, timezone, bufferBetweenMeetings, minimumNotice, schedulingWindow, weeklySchedule })
            });
            const data = await res.json();
            if (data.success) toast.success("Availability saved!");
            else toast.error("Failed to save");
        } catch (err) {
            toast.error("Error saving availability");
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled,
                timeRanges: !prev[day].enabled && prev[day].timeRanges.length === 0 ? [{ start: "09:00", end: "17:00" }] : prev[day].timeRanges
            }
        }));
    };

    const updateTimeRange = (day: string, index: number, field: "start" | "end", value: string) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeRanges: prev[day].timeRanges.map((tr, i) => i === index ? { ...tr, [field]: value } : tr)
            }
        }));
    };

    const addTimeRange = (day: string) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], timeRanges: [...prev[day].timeRanges, { start: "09:00", end: "17:00" }] }
        }));
    };

    const removeTimeRange = (day: string, index: number) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], timeRanges: prev[day].timeRanges.filter((_, i) => i !== index) }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Availability</h1>
                        <p className="text-muted-foreground">Set your weekly working hours</p>
                    </div>
                    <Button onClick={saveAvailability} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                {/* Settings */}
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Globe className="w-4 h-4" />Timezone</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Buffer between meetings</Label>
                            <Select value={String(bufferBetweenMeetings)} onValueChange={v => setBufferBetweenMeetings(Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No buffer</SelectItem>
                                    <SelectItem value="5">5 minutes</SelectItem>
                                    <SelectItem value="10">10 minutes</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Minimum notice</Label>
                            <Select value={String(minimumNotice)} onValueChange={v => setMinimumNotice(Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No minimum</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                    <SelectItem value="240">4 hours</SelectItem>
                                    <SelectItem value="1440">24 hours</SelectItem>
                                    <SelectItem value="2880">48 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Booking window</Label>
                            <Select value={String(schedulingWindow)} onValueChange={v => setSchedulingWindow(Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">1 week</SelectItem>
                                    <SelectItem value="14">2 weeks</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="60">60 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" />Weekly Hours</CardTitle>
                        <CardDescription>Set your available hours for each day</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {DAYS.map(day => (
                            <motion.div key={day} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-[140px]">
                                    <Switch checked={weeklySchedule[day].enabled} onCheckedChange={() => toggleDay(day)} />
                                    <span className={`font-medium ${!weeklySchedule[day].enabled ? "text-muted-foreground" : ""}`}>{DAY_LABELS[day]}</span>
                                </div>

                                {weeklySchedule[day].enabled ? (
                                    <div className="flex-1 space-y-2">
                                        {weeklySchedule[day].timeRanges.map((range, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Input type="time" value={range.start} onChange={e => updateTimeRange(day, idx, "start", e.target.value)} className="w-32" />
                                                <span className="text-muted-foreground">to</span>
                                                <Input type="time" value={range.end} onChange={e => updateTimeRange(day, idx, "end", e.target.value)} className="w-32" />
                                                {weeklySchedule[day].timeRanges.length > 1 && (
                                                    <Button size="icon" variant="ghost" onClick={() => removeTimeRange(day, idx)}><Trash2 className="w-4 h-4" /></Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button size="sm" variant="ghost" onClick={() => addTimeRange(day)}><Plus className="w-4 h-4 mr-1" />Add time range</Button>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Unavailable</span>
                                )}
                            </motion.div>
                        ))}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
