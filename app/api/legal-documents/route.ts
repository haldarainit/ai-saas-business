import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LegalDocument from "@/models/LegalDocument";
import { getAuthenticatedUser } from "@/lib/get-auth-user";
import { uploadFile, deleteResources } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB for legal docs

const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
];

// GET - List all legal documents for user (optionally filtered by companyProfileId or category)
export async function GET(request: NextRequest) {
    try {
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const companyProfileId = searchParams.get("companyProfileId");
        const category = searchParams.get("category");

        const filter: Record<string, any> = { userId };
        if (companyProfileId) filter.companyProfileId = companyProfileId;
        if (category) filter.category = category;

        const documents = await LegalDocument.find(filter).sort({ category: 1, createdAt: -1 }).lean();

        return NextResponse.json({ success: true, documents });
    } catch (error) {
        console.error("Error fetching legal documents:", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

// POST - Upload a new legal document
export async function POST(request: NextRequest) {
    try {
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const category = formData.get("category") as string;
        const documentName = formData.get("documentName") as string;
        const description = formData.get("description") as string | null;
        const companyProfileId = formData.get("companyProfileId") as string | null;
        const tags = formData.get("tags") as string | null;

        if (!file || !category || !documentName) {
            return NextResponse.json({ error: "File, category, and document name are required" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: `File type ${file.type} not supported. Allowed: PDF, images, Word, Excel, text.` }, { status: 400 });
        }

        // Upload to Cloudinary in a user-specific legal-docs folder
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const folder = `legal-docs/${userId}`;
        const resourceType = file.type.startsWith("image/") ? "image" : "raw";

        const result = await uploadFile(buffer, folder, resourceType);

        await dbConnect();

        const doc = await LegalDocument.create({
            userId,
            companyProfileId: companyProfileId || undefined,
            category,
            documentName,
            description: description || undefined,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        });

        return NextResponse.json({ success: true, document: doc });
    } catch (error) {
        console.error("Error uploading legal document:", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}

// DELETE - Delete a legal document by ID (passed as query param)
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await getAuthenticatedUser(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const docId = searchParams.get("id");
        if (!docId) {
            return NextResponse.json({ error: "Document ID required" }, { status: 400 });
        }

        await dbConnect();

        const doc = await LegalDocument.findOne({ _id: docId, userId });
        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Delete from Cloudinary
        const resourceType = doc.mimeType.startsWith("image/") ? "image" : "raw";
        try {
            await deleteResources([doc.publicId], resourceType);
        } catch (err) {
            console.warn("Cloudinary delete failed (continuing):", err);
        }

        await LegalDocument.deleteOne({ _id: docId, userId });

        return NextResponse.json({ success: true, message: "Document deleted" });
    } catch (error) {
        console.error("Error deleting legal document:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
