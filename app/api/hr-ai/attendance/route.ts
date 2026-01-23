import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/lib/models/Attendance";

interface DateInfo {
    date: string;
    label: string;
}

interface AttendanceRecord {
    employeeName?: string;
    employeeId?: string;
    date: string;
    status?: string;
    workingHours?: number;
    clockIn?: { time?: Date };
    clockOut?: { time?: Date };
}

interface RequestBody {
    message: string;
}

function normalizeDateString(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
}

function resolveDateFromMessage(message: string): DateInfo | null {
    const lower = message.toLowerCase();
    const today = new Date();

    if (lower.includes("yesterday")) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return {
            date: d.toISOString().split("T")[0],
            label: "yesterday",
        };
    }

    if (lower.includes("today")) {
        return {
            date: today.toISOString().split("T")[0],
            label: "today",
        };
    }

    // Match explicit YYYY-MM-DD
    const match = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) {
        return {
            date: match[1],
            label: match[1],
        };
    }

    // If no clear date phrase, return null and let AI answer generally
    return null;
}

function extractEmployeeQuery(message: string): string | null {
    const text = message.trim().toLowerCase();

    // 1) "is raju present today" - improved pattern
    const isPresentMatch = text.match(
        /is\s+([a-zA-Z0-9]+)\s+(present|there|working|attending)/i
    );
    if (isPresentMatch?.[1] && isPresentMatch[1].length >= 2) {
        return isPresentMatch[1].trim();
    }

    // 2) "Was Rajeev present yesterday?"
    const wasPresentMatch = text.match(
        /was\s+([a-zA-Z0-9]+)\s+(present|there|working)/i
    );
    if (wasPresentMatch?.[1] && wasPresentMatch[1].length >= 2) {
        return wasPresentMatch[1].trim();
    }

    // 3) "Raju is there today", "Raju is present today"
    const isThereMatch = text.match(
        /^([a-zA-Z0-9]+)\s+is\s+(present|there|working|today)/i
    );
    if (isThereMatch?.[1] && isThereMatch[1].length >= 2) {
        return isThereMatch[1].trim();
    }

    // 4) "attendance for Rajeev" / "report for Rajeev"
    const forMatch = text.match(/for\s+([a-zA-Z0-9]+)/i);
    if (forMatch?.[1] && forMatch[1].length >= 2) {
        return forMatch[1].trim();
    }

    // 5) "raju present", "raju today" - name followed by keyword
    const nameKeywordMatch = text.match(/^([a-zA-Z0-9]+)\s+(present|today|yesterday|attendance)/i);
    if (nameKeywordMatch?.[1] && nameKeywordMatch[1].length >= 2) {
        return nameKeywordMatch[1].trim();
    }

    // 6) Single-word name that's not a common word: "Rajeev?", "Raju"
    const commonWords = ['is', 'was', 'are', 'were', 'the', 'a', 'an', 'for', 'with', 'what', 'when', 'where', 'who', 'how'];
    const words = text.split(/\s+/).filter(w => w.length >= 2 && !commonWords.includes(w.toLowerCase()));
    if (words.length > 0) {
        // Return the first word that looks like a name
        return words[0];
    }

    return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { message } = await request.json() as RequestBody;

        if (!message || !message.trim()) {
            return NextResponse.json(
                { success: false, error: "Message is required" },
                { status: 400 }
            );
        }

        const employeeQuery = extractEmployeeQuery(message);
        const dateInfo = resolveDateFromMessage(message);

        // Default to today if no date specified but employee is mentioned
        const searchDate = dateInfo ? dateInfo.date : new Date().toISOString().split("T")[0];

        let record: AttendanceRecord | null = null;
        let allRecords: AttendanceRecord[] = [];

        // Try to load attendance context if employee is mentioned
        if (employeeQuery) {
            await dbConnect();

            console.log(`[HR AI] Searching for employee: "${employeeQuery}", date: "${searchDate}"`);

            const employeeRegex = new RegExp(
                employeeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            // First, try exact date match
            record = await Attendance.findOne({
                date: searchDate,
                $or: [
                    { employeeName: employeeRegex },
                    { employeeId: employeeRegex },
                    { employeeName: { $regex: employeeQuery, $options: "i" } },
                    { employeeId: { $regex: employeeQuery, $options: "i" } }
                ],
            }).lean();

            console.log(`[HR AI] Exact date match found:`, record ? "YES" : "NO");

            // If no exact match, get recent records for this employee to help AI understand context
            if (!record) {
                allRecords = await Attendance.find({
                    $or: [
                        { employeeName: employeeRegex },
                        { employeeId: employeeRegex },
                        { employeeName: { $regex: employeeQuery, $options: "i" } },
                        { employeeId: { $regex: employeeQuery, $options: "i" } }
                    ],
                })
                    .sort({ date: -1 })
                    .limit(5)
                    .lean();

                console.log(`[HR AI] Found ${allRecords.length} recent records for employee`);
            }
        } else {
            console.log(`[HR AI] No employee name extracted from message`);
        }

        // Import Gemini AI lazily to keep cold starts lighter
        let gemini: { generateAIResponse: (prompt: string) => Promise<string> };
        try {
            const geminiModule = await import("../../../../utils/gemini");
            gemini = (geminiModule.default || geminiModule) as typeof gemini;

            if (!gemini || !gemini.generateAIResponse) {
                throw new Error("Gemini module not properly loaded");
            }
        } catch (importError) {
            const err = importError as Error;
            console.error("Failed to import Gemini:", err);
            throw new Error(`Failed to load AI service: ${err.message}`);
        }

        // Build context for AI
        let attendanceContext = "NO_ATTENDANCE_RECORD";
        if (record) {
            attendanceContext = `FOUND ATTENDANCE RECORD FOR ${record.employeeName || record.employeeId} ON ${record.date}:
- Status: ${record.status || "unknown"}
- Clock In: ${record.clockIn?.time ? new Date(record.clockIn.time).toLocaleString() : "N/A"}
- Clock Out: ${record.clockOut?.time ? new Date(record.clockOut.time).toLocaleString() : "Not clocked out yet"}
- Working Hours: ${record.workingHours || 0} hours
- Date: ${record.date}`;
        } else if (allRecords.length > 0) {
            attendanceContext = `FOUND ${allRecords.length} RECENT ATTENDANCE RECORDS for this employee (but not for the requested date):
${allRecords.map((r, i) => `${i + 1}. ${r.date}: ${r.status || "unknown"} - ${r.workingHours || 0} hours`).join("\n")}`;
        }

        const aiPrompt = `You are an HR AI assistant for a company with access to attendance database.

USER QUESTION: "${message}"

ATTENDANCE DATABASE RESULT:
${attendanceContext}

CRITICAL INSTRUCTIONS:
1. If you see "FOUND ATTENDANCE RECORD", you MUST use that exact data to answer the question. Do NOT say you don't have access - you DO have the data!
2. If status is "present", the employee WAS present. If "absent", they were NOT present.
3. If you see "FOUND X RECENT ATTENDANCE RECORDS" but not for the requested date, mention that you found records but not for that specific date, and share what you found.
4. If you see "NO_ATTENDANCE_RECORD" and the question is about attendance, say you couldn't find a record for that employee/date combination.
5. For general HR questions (leave policy, benefits, etc.), answer helpfully from HR best practices.
6. Be friendly, conversational, and concise (2-4 sentences).
7. IMPORTANT: Always use the actual data from the attendance record when available - don't make up information!`;

        let answer: string;
        try {
            answer = await gemini.generateAIResponse(aiPrompt);
            if (!answer || typeof answer !== "string") {
                throw new Error("Invalid response from AI");
            }
        } catch (aiError) {
            const err = aiError as Error;
            console.error("Gemini API error:", err);
            throw new Error(`AI service error: ${err.message}`);
        }

        return NextResponse.json({
            success: true,
            answer,
            metadata: record
                ? {
                    found: true,
                    employeeId: record.employeeId,
                    employeeName: record.employeeName,
                    date: record.date,
                    status: record.status,
                    workingHours: record.workingHours,
                    clockIn: record.clockIn?.time ? new Date(record.clockIn.time).toISOString() : null,
                    clockOut: record.clockOut?.time ? new Date(record.clockOut.time).toISOString() : null,
                }
                : allRecords.length > 0
                    ? {
                        found: false,
                        message: `Found ${allRecords.length} recent records but not for the requested date`,
                        recentRecords: allRecords.slice(0, 3).map(r => ({
                            date: r.date,
                            status: r.status,
                            workingHours: r.workingHours,
                        })),
                    }
                    : {
                        found: false,
                        message: "No attendance records found",
                    },
        });
    } catch (error) {
        const err = error as Error;
        console.error("HR AI attendance error:", err);
        console.error("Error stack:", err.stack);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to process HR AI attendance query",
                details:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
                stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
            },
            { status: 500 }
        );
    }
}
