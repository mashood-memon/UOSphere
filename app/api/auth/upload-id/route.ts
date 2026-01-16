import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * Upload ID card and validate pre-extracted data
 * OCR is now done on CLIENT SIDE to avoid serverless limitations
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("idCard") as File;

    // Get pre-extracted data from client
    const extractedDataStr = formData.get("extractedData") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!extractedDataStr) {
      return NextResponse.json(
        { error: "No extracted data provided" },
        { status: 400 }
      );
    }

    // Parse extracted data
    let extractedData;
    try {
      extractedData = JSON.parse(extractedDataStr);
    } catch (err) {
      console.error("Failed to parse extracted data:", err);
      return NextResponse.json(
        { error: "Invalid extracted data format" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (4MB max for Vercel)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 4MB" },
        { status: 400 }
      );
    }

    // Server-side validation of extracted data
    const { rollNo, name, department, batch, degreeProgram } = extractedData;

    if (!rollNo || !name || !department || !batch) {
      return NextResponse.json(
        { error: "Missing required fields in extracted data" },
        { status: 400 }
      );
    }

    // Validate roll number format
    const rollNoPattern = /^2K\d{2}\/[A-Z]{2,4}\/\d+$/;
    if (!rollNoPattern.test(rollNo)) {
      return NextResponse.json(
        { error: "Invalid roll number format" },
        { status: 400 }
      );
    }

    // Validate batch year (improved logic - allow up to 6 years)
    const currentYear = new Date().getFullYear();
    const batchYearMatch = batch.match(/2K(\d{2})/);

    if (batchYearMatch) {
      const batchYear = 2000 + parseInt(batchYearMatch[1]);
      const yearsSinceBatch = currentYear - batchYear;

      if (yearsSinceBatch > 6) {
        return NextResponse.json(
          {
            error:
              "This student has likely graduated. Only current students can register.",
          },
          { status: 400 }
        );
      }

      if (batchYear > currentYear) {
        return NextResponse.json(
          { error: "Invalid batch year. Cannot register future students." },
          { status: 400 }
        );
      }
    }

    // Check for duplicate roll number in database
    const existingUser = await prisma.user.findUnique({
      where: { rollNo: rollNo },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "This roll number is already registered",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to Cloudinary
    console.log("Uploading ID card to Cloudinary...");
    const imageUrl = await uploadToCloudinary(buffer, "id-cards");
    console.log("Upload successful:", imageUrl);

    return NextResponse.json({
      success: true,
      data: {
        name,
        rollNo,
        department,
        batch,
        degreeProgram,
        imageUrl,
      },
    });
  } catch (error) {
    console.error("ID upload error:", error);
    // Better error logging for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
