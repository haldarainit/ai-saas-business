import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/cloudinary";
import { getAuthenticatedUser } from "@/lib/get-auth-user";

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

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary (user-specific folder when available)
        const { userId } = await getAuthenticatedUser(request);
        const folder = userId ? `ai-saas-chat/${userId}` : 'ai-saas-chat';

        // Upload to Cloudinary
        // Determine resource type for Cloudinary
        let resourceType = 'auto';
        if (category === 'image') resourceType = 'image';
        else if (category === 'video') resourceType = 'video';
        else resourceType = 'raw'; // For documents/others

        console.log(`Uploading file: ${file.name}, Size: ${file.size}, Type: ${resourceType}`);

        const result = await uploadFile(buffer, folder, resourceType);

        console.log("Cloudinary upload result:", result);

        // Return file info
        return NextResponse.json({
            success: true,
            file: {
                url: result.secure_url,
                publicId: result.public_id,
                type: category,
                filename: file.name,
                size: file.size,
                mimeType: file.type,
                format: result.format, // Cloudinary format (e.g., 'webp', 'jpg')
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
