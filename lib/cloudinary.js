import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} folder - The folder to upload to.
 * @param {string} resourceType - The resource type (image, video, raw, auto).
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export async function uploadFile(buffer, folder = 'ai-saas-chat', resourceType = 'auto') {
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
                } else {
                    console.log("Cloudinary Lib: Upload success:", result.secure_url);
                    resolve(result);
                }
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Deletes resources from Cloudinary.
 * @param {string[]} publicIds - Array of public IDs to delete.
 * @param {string} resourceType - The resource type (image, video, raw).
 * @returns {Promise<import('cloudinary').DeleteApiResponse>}
 */
export async function deleteResources(publicIds, resourceType = 'image') {
    if (!publicIds || publicIds.length === 0) return;
    try {
        return await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
    } catch (error) {
        console.error(`Error deleting ${resourceType} resources:`, error);
        throw error;
    }
}

/**
 * Deletes a folder from Cloudinary.
 * @param {string} folder - The folder path to delete.
 * @returns {Promise<void>}
 */
export async function deleteFolder(folder) {
    try {
        await cloudinary.api.delete_folder(folder);
    } catch (error) {
        console.error("Error deleting folder:", error);
        // Folder deletion might fail if not empty, but we usually delete resources first.
        // We won't throw here to avoid blocking other cleanup.
    }
}

export default cloudinary;
