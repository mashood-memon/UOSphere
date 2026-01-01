import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromIDCard, validateExtractedData } from "@/lib/ocr";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("idCard") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer for OCR processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using Tesseract.js OCR
    console.log("Starting OCR extraction...");
    const ocrResult = await extractTextFromIDCard(buffer);

    if (!ocrResult.success || !ocrResult.extractedData) {
      return NextResponse.json(
        {
          success: false,
          error: ocrResult.error || "Failed to extract data from ID card",
        },
        { status: 400 }
      );
    }

    // Validate the extracted data
    const validation = validateExtractedData(ocrResult.extractedData);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error:
            validation.errors?.join(", ") ||
            "Invalid data extracted from ID card",
        },
        { status: 400 }
      );
    }

    // Check for duplicate roll number in database
    const existingUser = await prisma.user.findUnique({
      where: { rollNo: ocrResult.extractedData.rollNo },
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

    // Upload image to Cloudinary
    console.log("Uploading ID card to Cloudinary...");
    const imageUrl = await uploadToCloudinary(buffer, "id-cards");
    console.log("Upload successful:", imageUrl);

    return NextResponse.json({
      success: true,
      data: {
        name: ocrResult.extractedData.name,
        rollNo: ocrResult.extractedData.rollNo,
        department: ocrResult.extractedData.department,
        batch: ocrResult.extractedData.batch,
        degreeProgram: ocrResult.extractedData.degreeProgram,
        imageUrl,
        confidence: ocrResult.confidence,
      },
    });
  } catch (error) {
    console.error("ID upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
