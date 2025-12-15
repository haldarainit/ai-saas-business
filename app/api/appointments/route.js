import { NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, use MongoDB or another database
let appointments = [];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const date = searchParams.get("date");
        const status = searchParams.get("status");

        let filteredAppointments = [...appointments];

        if (userId) {
            filteredAppointments = filteredAppointments.filter(
                (apt) => apt.userId === userId
            );
        }

        if (date) {
            filteredAppointments = filteredAppointments.filter(
                (apt) => apt.date === date
            );
        }

        if (status) {
            filteredAppointments = filteredAppointments.filter(
                (apt) => apt.status === status
            );
        }

        // Sort by date and time
        filteredAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA - dateB;
        });

        return NextResponse.json({
            success: true,
            appointments: filteredAppointments,
            total: filteredAppointments.length,
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch appointments" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            date,
            startTime,
            endTime,
            type,
            attendees,
            location,
            reminders,
            userId,
        } = body;

        // Validate required fields
        if (!title || !date || !startTime || !endTime) {
            return NextResponse.json(
                { error: "Title, date, start time, and end time are required" },
                { status: 400 }
            );
        }

        // Check for conflicts
        const conflictingAppointment = appointments.find((apt) => {
            if (apt.date !== date || apt.status === "cancelled") return false;

            const newStart = new Date(`${date}T${startTime}`);
            const newEnd = new Date(`${date}T${endTime}`);
            const existingStart = new Date(`${apt.date}T${apt.startTime}`);
            const existingEnd = new Date(`${apt.date}T${apt.endTime}`);

            return (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            );
        });

        if (conflictingAppointment) {
            return NextResponse.json(
                {
                    error: "Time slot conflict",
                    conflictWith: conflictingAppointment.title,
                },
                { status: 409 }
            );
        }

        // Generate meeting link for video appointments
        let meetingLink = null;
        if (type === "video") {
            meetingLink = `https://meet.google.com/${Math.random()
                .toString(36)
                .substring(2, 5)}-${Math.random()
                    .toString(36)
                    .substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
        }

        const newAppointment = {
            id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            title,
            description: description || "",
            date,
            startTime,
            endTime,
            type: type || "video",
            attendees: attendees || [],
            location: location || "",
            meetingLink,
            reminders: reminders !== false,
            status: "confirmed",
            userId: userId || "guest",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        appointments.push(newAppointment);

        // TODO: Send confirmation email to attendees
        // TODO: Create Google Calendar event if connected
        // TODO: Schedule reminder notifications

        return NextResponse.json({
            success: true,
            appointment: newAppointment,
            message: "Appointment created successfully",
        });
    } catch (error) {
        console.error("Error creating appointment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create appointment" },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Appointment ID is required" },
                { status: 400 }
            );
        }

        const appointmentIndex = appointments.findIndex((apt) => apt.id === id);

        if (appointmentIndex === -1) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        // Update the appointment
        appointments[appointmentIndex] = {
            ...appointments[appointmentIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        // TODO: Send update notification to attendees
        // TODO: Update Google Calendar event if connected

        return NextResponse.json({
            success: true,
            appointment: appointments[appointmentIndex],
            message: "Appointment updated successfully",
        });
    } catch (error) {
        console.error("Error updating appointment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update appointment" },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Appointment ID is required" },
                { status: 400 }
            );
        }

        const appointmentIndex = appointments.findIndex((apt) => apt.id === id);

        if (appointmentIndex === -1) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        // Soft delete - mark as cancelled
        appointments[appointmentIndex] = {
            ...appointments[appointmentIndex],
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // TODO: Send cancellation notification to attendees
        // TODO: Update Google Calendar event if connected

        return NextResponse.json({
            success: true,
            message: "Appointment cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to cancel appointment" },
            { status: 500 }
        );
    }
}
