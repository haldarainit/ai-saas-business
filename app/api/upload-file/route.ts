import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Allowed file types
const ALLOWED_TYPES = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
    document: [
        "text/plain",
        "text/csv",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileCategory(mimeType: string): string | null {
    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
        if (types.includes(mimeType)) {
            return category;
        }
    }
    return null;
}

function isTextBasedFile(mimeType: string): boolean {
    return ["text/plain", "text/csv"].includes(mimeType);
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
                },
                { status: 400 }
            );
        }

        // Validate file type
        const category = getFileCategory(file.type);
        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File type ${file.type} not supported. Allowed types: images, videos, audio, and documents.`,
                },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split(".").pop();
        const filename = `${timestamp}-${randomString}.${extension}`;
        const filepath = path.join(uploadsDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // For text-based files, extract content
        let extractedContent: string | undefined;
        if (isTextBasedFile(file.type)) {
            try {
                extractedContent = await readFile(filepath, "utf-8");
            } catch (error) {
                console.error("Error reading file content:", error);
            }
        }

        // Return file info
        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({
            success: true,
            file: {
                url: fileUrl,
                type: category,
                filename: file.name,
                size: file.size,
                mimeType: file.type,
                extractedContent,
            },
        });
    } catch (error) {
        console.error("File upload error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
            },
            { status: 500 }
        );
    }
}
