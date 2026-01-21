import { NextRequest, NextResponse } from "next/server";
import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";

const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

if (!endpoint || !apiKey) {
  console.error(
    "Azure Document Intelligence credentials not configured. Please set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY in .env",
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!endpoint || !apiKey) {
      return NextResponse.json(
        {
          error:
            "Azure Document Intelligence is not configured. Please contact the administrator.",
        },
        { status: 500 },
      );
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image, "base64");

    // Initialize Azure Document Intelligence client
    const client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(apiKey),
    );

    // Analyze the document using the "prebuilt-read" model for general text extraction
    const poller = await client.beginAnalyzeDocument(
      "prebuilt-read",
      imageBuffer,
    );

    // Wait for the operation to complete
    const result = await poller.pollUntilDone();

    if (!result.content) {
      return NextResponse.json(
        { error: "No text could be extracted from the image" },
        { status: 400 },
      );
    }

    // Calculate average confidence from all words detected
    let totalConfidence = 0;
    let wordCount = 0;

    if (result.pages) {
      for (const page of result.pages) {
        if (page.words) {
          for (const word of page.words) {
            if (word.confidence !== undefined) {
              totalConfidence += word.confidence;
              wordCount++;
            }
          }
        }
      }
    }

    const averageConfidence =
      wordCount > 0 ? (totalConfidence / wordCount) * 100 : 0;

    return NextResponse.json({
      text: result.content,
      confidence: averageConfidence,
    });
  } catch (error) {
    console.error("Azure Document Intelligence Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze document",
      },
      { status: 500 },
    );
  }
}
