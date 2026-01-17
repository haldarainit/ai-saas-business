import { v2 as cloudinary, UploadApiResponse, DeleteApiResponse } from 'cloudinary';

// Type definitions for resource types
type ResourceType = 'image' | 'video' | 'raw' | 'auto';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary.
 * @param buffer - The file buffer.
 * @param folder - The folder to upload to.
 * @param resourceType - The resource type (image, video, raw, auto).
 * @returns Promise<UploadApiResponse>
 */
export async function uploadFile(
    buffer: Buffer,
    folder: string = 'ai-saas-chat',
    resourceType: ResourceType = 'auto'
): Promise<UploadApiResponse> {
    console.log(`Cloudinary Lib: Starting upload to folder ${folder} with resourceType ${resourceType}`);
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Lib: Upload error:", error);
                    reject(error);
                } else if (result) {
                    console.log("Cloudinary Lib: Upload success:", result.secure_url);
                    resolve(result);
                } else {
                    reject(new Error("Upload failed: no result returned"));
                }
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Deletes resources from Cloudinary.
 * @param publicIds - Array of public IDs to delete.
 * @param resourceType - The resource type (image, video, raw).
 * @returns Promise<DeleteApiResponse | undefined>
 */
export async function deleteResources(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<DeleteApiResponse | undefined> {
    if (!publicIds || publicIds.length === 0) return undefined;
    try {
        return await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
    } catch (error) {
        console.error(`Error deleting ${resourceType} resources:`, error);
        throw error;
    }
}

/**
 * Deletes a folder from Cloudinary.
 * @param folder - The folder path to delete.
 * @returns Promise<void>
 */
export async function deleteFolder(folder: string): Promise<void> {
    try {
        await cloudinary.api.delete_folder(folder);
    } catch (error) {
        console.error("Error deleting folder:", error);
        // Folder deletion might fail if not empty, but we usually delete resources first.
        // We won't throw here to avoid blocking other cleanup.
    }
}

export default cloudinary;
