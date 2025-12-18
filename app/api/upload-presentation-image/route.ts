import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/cloudinary";
import dbConnect from "@/lib/mongodb";
import PresentationWorkspace from "@/models/PresentationWorkspace";

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const workspaceId = formData.get("workspaceId") as string;
        const slideIndex = formData.get("slideIndex") as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File type ${file.type} not supported. Allowed types: JPEG, PNG, GIF, WebP`,
                },
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

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`Uploading presentation image: ${file.name}, Size: ${file.size}`);

        // Upload to Cloudinary with presentation-specific folder
        const result = await uploadFile(buffer, `presentations/${workspaceId || 'uploads'}`, 'image');

        console.log("Cloudinary upload result:", result);

        // If workspaceId and slideIndex are provided, update the workspace
        if (workspaceId && slideIndex !== null && slideIndex !== undefined) {
            await dbConnect();

            const workspace = await PresentationWorkspace.findById(workspaceId);

            if (workspace && workspace.presentation?.slides) {
                const idx = parseInt(slideIndex);
                if (workspace.presentation.slides[idx]) {
                    // Update the slide with the uploaded image
                    workspace.presentation.slides[idx].imageUrl = result.secure_url;
                    workspace.presentation.slides[idx].imagePublicId = result.public_id;
                    workspace.presentation.slides[idx].imageSource = 'upload';
                    workspace.presentation.slides[idx].hasImage = true;

                    await workspace.save();
                    console.log(`Updated workspace ${workspaceId} slide ${idx} with uploaded image`);
                }
            }
        }

        // Return file info
        return NextResponse.json({
            success: true,
            image: {
                url: result.secure_url,
                publicId: result.public_id,
                filename: file.name,
                size: file.size,
                width: result.width,
                height: result.height,
                format: result.format,
            },
        });
    } catch (error) {
        console.error("Presentation image upload error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
            },
            { status: 500 }
        );
    }
}
