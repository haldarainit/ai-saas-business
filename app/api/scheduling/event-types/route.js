import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EventType from "@/lib/models/EventType";
import UserProfile from "@/lib/models/UserProfile";

// Helper to generate unique booking link ID
function generateBookingLinkId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// GET - Fetch all event types for a user
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const isActive = searchParams.get("isActive");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const query = { userId };
        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const eventTypes = await EventType.find(query).sort({ createdAt: -1 });

        // Auto-generate bookingLinkId for old event types that don't have one
        for (const eventType of eventTypes) {
            if (!eventType.bookingLinkId) {
                eventType.bookingLinkId = generateBookingLinkId();
                await eventType.save();
            }
        }

        return NextResponse.json({
            success: true,
            eventTypes,
            total: eventTypes.length,
        });
    } catch (error) {
        console.error("Error fetching event types:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch event types" },
            { status: 500 }
        );
    }
}

// POST - Create a new event type
export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const {
            userId,
            name,
            description,
            duration,
            color,
            location,
            customQuestions,
            requiresConfirmation,
            allowReschedule,
            allowCancellation,
            maxBookingsPerDay,
            bufferTimeBefore,
            bufferTimeAfter,
            minimumNotice,
            schedulingWindow,
            price,
            currency,
        } = body;

        if (!userId || !name || !duration) {
            return NextResponse.json(
                { error: "User ID, name, and duration are required" },
                { status: 400 }
            );
        }

        // Generate slug from name
        let slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        // Check for duplicate slug and make unique if needed
        let existingSlug = await EventType.findOne({ userId, slug });
        let counter = 1;
        while (existingSlug) {
            slug = `${slug}-${counter}`;
            existingSlug = await EventType.findOne({ userId, slug });
            counter++;
        }

        const eventType = new EventType({
            userId,
            name,
            slug,
            description: description || "",
            duration: duration || 30,
            color: color || "#6366f1",
            location: location || { type: "video", provider: "google-meet" },
            customQuestions: customQuestions || [],
            requiresConfirmation: requiresConfirmation || false,
            allowReschedule: allowReschedule !== false,
            allowCancellation: allowCancellation !== false,
            maxBookingsPerDay: maxBookingsPerDay || 0,
            bufferTimeBefore: bufferTimeBefore || 0,
            bufferTimeAfter: bufferTimeAfter || 0,
            minimumNotice: minimumNotice || 60,
            schedulingWindow: schedulingWindow || 30,
            price: price || 0,
            currency: currency || "USD",
        });

        await eventType.save();

        // Ensure user profile exists
        let userProfile = await UserProfile.findOne({ userId });
        if (!userProfile) {
            userProfile = new UserProfile({
                userId,
                email: body.email || userId,
            });
            await userProfile.save();
        }

        return NextResponse.json({
            success: true,
            eventType,
            bookingLink: `/book/${eventType.bookingLinkId}`,
            message: "Event type created successfully",
        });
    } catch (error) {
        console.error("Error creating event type:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create event type" },
            { status: 500 }
        );
    }
}

// PUT - Update an event type
export async function PUT(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Event type ID is required" },
                { status: 400 }
            );
        }

        const eventType = await EventType.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true }
        );

        if (!eventType) {
            return NextResponse.json(
                { error: "Event type not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            eventType,
            message: "Event type updated successfully",
        });
    } catch (error) {
        console.error("Error updating event type:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update event type" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an event type
export async function DELETE(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Event type ID is required" },
                { status: 400 }
            );
        }

        const eventType = await EventType.findByIdAndDelete(id);

        if (!eventType) {
            return NextResponse.json(
                { error: "Event type not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Event type deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting event type:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete event type" },
            { status: 500 }
        );
    }
}
