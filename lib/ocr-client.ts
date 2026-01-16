"use client";

import Tesseract from "tesseract.js";

export interface OCRResult {
  success: boolean;
  confidence: number;
  extractedData?: {
    name: string;
    rollNo: string;
    department: string;
    batch: string;
    degreeProgram: string;
    universityHeader: string;
    cardType: string;
  };
  error?: string;
}

/**
 * Extract text from UOS Student ID Card using Tesseract.js
 * This runs on the CLIENT SIDE (browser) to avoid serverless limitations
 */
export async function extractTextFromIDCard(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    // Run OCR with progress callback
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(imageFile, "eng", {
      logger: (info) => {
        if (info.status === "recognizing text" && onProgress) {
          onProgress(Math.round(info.progress * 100));
        }
      },
    });

    console.log("Extracted Text:", text);
    console.log("OCR Confidence:", confidence);

    // Parse the extracted text
    const parsedData = parseUOSIDCard(text, confidence);

    if (!parsedData.success) {
      return {
        success: false,
        confidence,
        error:
          parsedData.error ||
          "Could not extract required information from ID card.",
      };
    }

    return {
      success: true,
      confidence,
      extractedData: parsedData.data,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      success: false,
      confidence: 0,
      error: "Failed to process image. Please try again.",
    };
  }
}

/**
 * Parse extracted text to identify UOS ID card fields
 */
function parseUOSIDCard(
  text: string,
  confidence: number
): { success: boolean; data?: OCRResult["extractedData"]; error?: string } {
  try {
    console.log("=== Starting OCR Parsing ===");
    console.log("Raw extracted text:", text);
    console.log("OCR Confidence:", Math.round(confidence) + "%");

    // Normalize text: uppercase, clean whitespace
    const normalizedText = text.toUpperCase().replace(/\s+/g, " ").trim();

    // Check if text is too short
    if (text.length < 20) {
      return {
        success: false,
        error:
          "Unable to read the uploaded image. Please upload a clear photo of your UOS Student ID card.",
      };
    }

    // 1. Check if it's a UOS card
    const hasUniversityHeader =
      /UNIVERSITY.*SINDH|SINDH.*UNIVERSITY|UNI.*SINDH/i.test(normalizedText);

    if (!hasUniversityHeader) {
      return {
        success: false,
        error:
          "This does not appear to be a University of Sindh ID card. Please upload your valid UOS Student ID card.",
      };
    }

    // 2. Check image quality
    if (confidence < 70) {
      return {
        success: false,
        error:
          "Image quality is too low (" +
          Math.round(confidence) +
          "% confidence). Please upload a clearer photo with better lighting.",
      };
    }

    // 3. Extract Roll Number
    let rollNoMatch = text.match(
      /2K\d{2}[\/\-\s]\s*([A-Z]{2,4})[\/\-\s]\s*(\d+)/i
    );

    if (!rollNoMatch) {
      rollNoMatch = text.match(/2K(\d{2})\s*([A-Z]{2,4})\s*(\d+)/i);
    }

    if (!rollNoMatch) {
      return {
        success: false,
        error:
          "Could not find a valid student roll number on this card. Please ensure the roll number is clearly visible.",
      };
    }

    const rollNo = rollNoMatch[0]
      .replace(/\s+/g, "")
      .replace(/-/g, "/")
      .toUpperCase();
    const department = rollNoMatch[1].toUpperCase();
    const batchMatch = rollNo.match(/2K(\d{2})/);
    const batch = batchMatch ? `2K${batchMatch[1]}` : "";

    // 4. Extract Name
    let name = "";
    const lines = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Strategy 1: Look for "NAME:" label
    for (const line of lines) {
      const nameWithLabel = line.match(/NAME\s*:?\s*([A-Z][A-Za-z\s]{2,30})/i);
      if (nameWithLabel && nameWithLabel[1]) {
        const candidate = nameWithLabel[1].trim();
        if (
          !/UNIVERSITY|SINDH|STUDENT|IDENTITY|CARD|DEPARTMENT|CAMPUS|FATHER/i.test(
            candidate
          )
        ) {
          name = candidate
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
          break;
        }
      }
    }

    // Strategy 2: Look for capitalized words
    if (!name || name.length < 3) {
      for (const line of lines) {
        if (
          /UNIVERSITY|SINDH|STUDENT|IDENTITY|CARD|CAMPUS|FATHER|ROLL|DEPARTMENT|BACHELOR|MASTER|DECEMBER|DIRECTOR|ADMISSIONS|2K\d{2}|^\d+$|^(BS|MS|BA|MA|BBA|MBA)\b/i.test(
            line
          )
        ) {
          continue;
        }

        const words = line.trim().split(/\s+/);
        if (words.length >= 1 && words.length <= 4) {
          const looksLikeName = words.every(
            (w) => /^[A-Z][A-Za-z]*$/.test(w) && w.length >= 2 && w.length <= 15
          );
          const lineLengthOk = line.length >= 3 && line.length <= 50;

          if (looksLikeName && lineLengthOk) {
            name = words
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ");
            break;
          }
        }
      }
    }

    if (!name || name.length < 3) {
      return {
        success: false,
        error:
          "Could not extract student name from the ID card. Please ensure the name is clearly visible and not obscured.",
      };
    }

    // 5. Extract Degree Program
    let degreeProgram = "";
    for (const line of lines) {
      if (/^(BS|MS|BA|MA|BBA|MBA|B\.S|M\.S|BACHELOR|MASTER)\b/i.test(line)) {
        if (line.length > 4 && line.length < 60 && !/2K\d{2}/i.test(line)) {
          degreeProgram = line.trim().toUpperCase();
          break;
        }
      }
    }

    if (!degreeProgram) {
      const degreeMatch = text.match(
        /\b(B\.?S\.?|M\.?S\.?|BA|MA|BBA|MBA|BACHELOR|MASTER)\s+\(?(COMPUTER SCIENCE|CS|ENGINEERING|COMMERCE|ARTS|SCIENCE|BUSINESS ADMINISTRATION|[\w\s]+)\)?/i
      );
      if (degreeMatch && degreeMatch[0].length > 4) {
        degreeProgram = degreeMatch[0]
          .trim()
          .replace(/\s+/g, " ")
          .toUpperCase();
      }
    }

    // 6. Improve department name
    let departmentFullName = department;
    const deptMapping: Record<string, string> = {
      CSE: "Computer Science",
      CSM: "Computer Science",
      CS: "Computer Science",
      EE: "Electrical Engineering",
      ME: "Mechanical Engineering",
      CE: "Civil Engineering",
      BBA: "Business Administration",
      MBA: "Business Administration",
      ECON: "Economics",
      MATH: "Mathematics",
      PHYSICS: "Physics",
      CHEM: "Chemistry",
      BIO: "Biology",
    };

    if (degreeProgram) {
      const deptInDegree = degreeProgram.match(
        /\((.*?)\)|\b(COMPUTER SCIENCE|ELECTRICAL ENGINEERING|MECHANICAL ENGINEERING|CIVIL ENGINEERING|BUSINESS ADMINISTRATION|ECONOMICS|MATHEMATICS|PHYSICS|CHEMISTRY|BIOLOGY|ENGINEERING)\b/i
      );
      if (deptInDegree) {
        const extracted = deptInDegree[1] || deptInDegree[2];
        if (extracted && extracted.length > 2) {
          departmentFullName = extracted.trim();
        }
      }
    }

    if (deptMapping[department]) {
      departmentFullName = deptMapping[department];
    }

    if (!degreeProgram) {
      degreeProgram = `BS (${departmentFullName})`;
    }

    console.log("=== Parsing Complete ===");
    console.log("Final extracted data:", {
      name,
      rollNo,
      department: departmentFullName,
      batch,
      degreeProgram,
    });

    return {
      success: true,
      data: {
        name,
        rollNo,
        department: departmentFullName,
        batch,
        degreeProgram,
        universityHeader: "UNIVERSITY OF SINDH",
        cardType: "STUDENT IDENTITY CARD",
      },
    };
  } catch (error) {
    console.error("Parse error:", error);
    return {
      success: false,
      error:
        "An error occurred while processing the ID card. Please try again with a clearer image.",
    };
  }
}

/**
 * Client-side validation of extracted data
 */
export function validateExtractedData(data: OCRResult["extractedData"]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    return { valid: false, errors: ["No data extracted"] };
  }

  // 1. Validate roll number format
  const rollNoPattern = /^2K\d{2}\/[A-Z]{2,4}\/\d+$/;
  if (!rollNoPattern.test(data.rollNo)) {
    errors.push("Invalid roll number format. Expected format: 2K25/CSE/87");
  }

  // 2. Validate batch year (improved logic - allow up to 6 years for extensions)
  const currentYear = new Date().getFullYear();
  const batchYearMatch = data.batch.match(/2K(\d{2})/);

  if (batchYearMatch) {
    const batchYear = 2000 + parseInt(batchYearMatch[1]);
    const yearsSinceBatch = currentYear - batchYear;

    // Allow up to 6 years (for students who took breaks or extensions)
    if (yearsSinceBatch > 6) {
      errors.push(
        "This student has likely graduated. Only current students can register."
      );
    }

    if (batchYear > currentYear) {
      errors.push("Invalid batch year. Cannot register future students.");
    }
  }

  // 3. Validate name
  if (!data.name || data.name.length < 3) {
    errors.push("Student name is required");
  }

  // 4. Validate university header
  if (!data.universityHeader.includes("UNIVERSITY OF SINDH")) {
    errors.push("This does not appear to be a University of Sindh ID card");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
