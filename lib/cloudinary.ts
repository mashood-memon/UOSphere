import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param file - File object or Buffer
 * @param folder - Cloudinary folder to organize images (e.g., 'id-cards', 'profiles')
 * @returns Secure URL of uploaded image
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  folder: string = "uosphere"
): Promise<string> {
  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Convert buffer to base64
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `uosphere/${folder}`,
      resource_type: "image",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" }, // Max dimensions
        { quality: "auto" }, // Auto optimize quality
        { fetch_format: "auto" }, // Auto format (WebP for browsers that support it)
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
}

/**
 * Delete an image from Cloudinary
 * @param imageUrl - Full Cloudinary URL
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/uosphere/id-cards/abc123.jpg
    const matches = imageUrl.match(/\/uosphere\/([^\/]+)\/([^\.]+)/);
    if (!matches) {
      throw new Error("Invalid Cloudinary URL");
    }

    const publicId = `uosphere/${matches[1]}/${matches[2]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image");
  }
}

export { cloudinary };
