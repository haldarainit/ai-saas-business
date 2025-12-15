"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    DollarSign,
    ArrowRight,
    Globe,
    User,
    Loader2,
} from "lucide-react";
import Image from "next/image";

interface EventType {
    id: string;
    name: string;
    slug: string;
    description: string;
    duration: number;
    color: string;
    locationType: string;
    price: number;
    currency: string;
    bookingLink: string;
}

interface UserProfile {
    username: string;
    displayName: string;
    bio: string;
    profileImage: string;
    companyName: string;
    companyLogo: string;
    brandColor: string;
    welcomeMessage: string;
    timezone: string;
}

export default function PublicBookingPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPublicProfile();
    }, [username]);

    const fetchPublicProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/scheduling/public/${username}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load profile");
            }

            setProfile(data.profile);
            setEventTypes(data.eventTypes);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getLocationIcon = (type: string) => {
        switch (type) {
            case "video":
                return <Video className="w-4 h-4" />;
            case "phone":
                return <Phone className="w-4 h-4" />;
            case "in-person":
                return <MapPin className="w-4 h-4" />;
            default:
                return <Globe className="w-4 h-4" />;
        }
    };

    const getLocationLabel = (type: string) => {
        switch (type) {
            case "video":
                return "Video Call";
            case "phone":
                return "Phone Call";
            case "in-person":
                return "In Person";
            default:
                return "Custom Location";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                        <Skeleton className="h-8 w-48 mx-auto mb-2" />
                        <Skeleton className="h-4 w-64 mx-auto" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
                    <p className="text-muted-foreground">
                        {error || "The booking page you're looking for doesn't exist."}
                    </p>
                    <Button
                        className="mt-6"
                        onClick={() => router.push("/")}
                    >
                        Go Home
                    </Button>
                </Card>
            </div>
        );
    }

    const brandColor = profile.brandColor || "#6366f1";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Custom brand color styling */}
            <style jsx global>{`
                .brand-button {
                    background: linear-gradient(135deg, ${brandColor}, ${adjustColor(brandColor, -20)}) !important;
                }
                .brand-button:hover {
                    background: linear-gradient(135deg, ${adjustColor(brandColor, -10)}, ${adjustColor(brandColor, -30)}) !important;
                }
                .brand-border {
                    border-color: ${brandColor} !important;
                }
                .brand-text {
                    color: ${brandColor} !important;
                }
            `}</style>

            <div className="max-w-2xl mx-auto py-12 px-4">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    {profile.companyLogo ? (
                        <Image
                            src={profile.companyLogo}
                            alt={profile.companyName || "Company"}
                            width={80}
                            height={80}
                            className="mx-auto mb-4 rounded-xl"
                        />
                    ) : profile.profileImage ? (
                        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                            <AvatarImage src={profile.profileImage} />
                            <AvatarFallback className="text-2xl brand-button text-white">
                                {profile.displayName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div
                            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${brandColor}, ${adjustColor(brandColor, -20)})` }}
                        >
                            {profile.displayName?.charAt(0) || "U"}
                        </div>
                    )}

                    {profile.companyName && (
                        <p className="text-sm text-muted-foreground mb-1">{profile.companyName}</p>
                    )}

                    <h1 className="text-3xl font-bold mb-2">{profile.displayName}</h1>

                    {profile.bio && (
                        <p className="text-muted-foreground max-w-md mx-auto mb-4">
                            {profile.bio}
                        </p>
                    )}

                    <p className="text-lg text-muted-foreground">
                        {profile.welcomeMessage || "Select an event type to schedule."}
                    </p>

                    {profile.timezone && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            <span>{profile.timezone}</span>
                        </div>
                    )}
                </motion.div>

                {/* Event Types */}
                {eventTypes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="text-center py-12">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">
                                No event types available at the moment.
                            </p>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        className="space-y-4"
                    >
                        {eventTypes.map((eventType, index) => (
                            <motion.div
                                key={eventType.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                            >
                                <Card
                                    className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                                    onClick={() => router.push(`/book/${username}/${eventType.slug}`)}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
                                        style={{ backgroundColor: eventType.color || brandColor }}
                                    />
                                    <CardContent className="p-6 pl-8">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold mb-2 group-hover:brand-text transition-colors">
                                                    {eventType.name}
                                                </h3>

                                                {eventType.description && (
                                                    <p className="text-muted-foreground text-sm mb-4">
                                                        {eventType.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{eventType.duration} min</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {getLocationIcon(eventType.locationType)}
                                                        <span>{getLocationLabel(eventType.locationType)}</span>
                                                    </div>

                                                    {eventType.price > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <DollarSign className="w-4 h-4" />
                                                            <span>
                                                                {eventType.currency} {eventType.price}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                className="brand-button text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                size="sm"
                                            >
                                                Book
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-muted-foreground">
                        Powered by{" "}
                        <a href="/" className="font-semibold hover:underline brand-text">
                            AI Business Suite
                        </a>
                    </p>
                </motion.div>
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
