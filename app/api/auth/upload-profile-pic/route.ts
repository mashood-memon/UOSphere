import { uploadToCloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

// POST /api/auth/upload-profile-pic - Upload profile picture during signup (no auth required)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file, "profiles");

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
