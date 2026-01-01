import Tesseract from "tesseract.js";
import { createWorker } from "tesseract.js";

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
 */
export async function extractTextFromIDCard(
  imageBuffer: Buffer
): Promise<OCRResult> {
  let worker: Tesseract.Worker | null = null;

  try {
    // Create worker with proper configuration for Node.js
    worker = await createWorker("eng", 1, {
      logger: (info) => {
        // Log progress for debugging
        if (info.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
        }
      },
    });

    // Convert buffer to base64 for Tesseract
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString(
      "base64"
    )}`;

    // Run OCR
    const { data } = await worker.recognize(base64Image);

    const extractedText = data.text;
    const confidence = data.confidence;

    console.log("Extracted Text:", extractedText);
    console.log("OCR Confidence:", confidence);

    // Parse the extracted text first to get better error messages
    const parsedData = parseUOSIDCard(extractedText, confidence);

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
  } finally {
    // Always terminate the worker to free up resources
    if (worker) {
      await worker.terminate();
    }
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

    // Check if text is too short (likely not a valid card or unreadable)
    if (text.length < 20) {
      return {
        success: false,
        error:
          "Unable to read the uploaded image. Please upload a clear photo of your UOS Student ID card.",
      };
    }

    // 1. FIRST: Check if it's a UOS card (before checking quality)
    const hasUniversityHeader =
      /UNIVERSITY.*SINDH|SINDH.*UNIVERSITY|UNI.*SINDH/i.test(normalizedText);

    console.log("Has University Header:", hasUniversityHeader);

    // If it doesn't look like a UOS card at all, reject immediately
    if (!hasUniversityHeader) {
      return {
        success: false,
        error:
          "This does not appear to be a University of Sindh ID card. Please upload your valid UOS Student ID card.",
      };
    }

    // 2. NOW check image quality (only after confirming it's a UOS card)
    if (confidence < 70) {
      return {
        success: false,
        error:
          "Image quality is too low (" +
          Math.round(confidence) +
          "% confidence). Please upload a clearer photo with better lighting.",
      };
    }

    // Note: We removed the student card type check because OCR often misses the word "STUDENT"
    // Instead, we rely on the roll number pattern (2K25/CSE/87) which is unique to students

    // 3. Extract Roll Number (most critical) - MORE LENIENT
    // Pattern: 2K[YY]/[DEPT]/[NUM] or variations like 2K25-CSE-87 or 2K25 CSE 87
    let rollNoMatch = text.match(
      /2K\d{2}[\/\-\s]\s*([A-Z]{2,4})[\/\-\s]\s*(\d+)/i
    );

    // Fallback: Look for pattern without strict separators
    if (!rollNoMatch) {
      rollNoMatch = text.match(/2K(\d{2})\s*([A-Z]{2,4})\s*(\d+)/i);
    }

    if (!rollNoMatch) {
      console.log("Roll number not found in text");
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

    console.log("Extracted Roll No:", rollNo);
    console.log("Department:", department);
    console.log("Batch:", batch);

    // 4. Extract Name - IMPROVED LOGIC
    let name = "";

    // Split text into lines for better analysis
    const lines = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    console.log("All lines for name extraction:", lines);

    // Strategy 1: Look for "NAME:" or "Name:" label
    for (const line of lines) {
      const nameWithLabel = line.match(/NAME\s*:?\s*([A-Z][A-Za-z\s]{2,30})/i);
      if (nameWithLabel && nameWithLabel[1]) {
        const candidate = nameWithLabel[1].trim();
        // Make sure it's not a keyword
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
          console.log("Found name with label:", name);
          break;
        }
      }
    }

    // Strategy 2: Look for capitalized words BEFORE keywords or roll number
    if (!name || name.length < 3) {
      console.log("Strategy 2: Looking for capitalized words...");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`  Checking line ${i}: "${line}"`);

        // Skip if line contains keywords, numbers, or degree patterns
        // FIXED: Use \b word boundaries for degree keywords to prevent matching "MASHOOD" (starts with MA)
        if (
          /UNIVERSITY|SINDH|STUDENT|IDENTITY|CARD|CAMPUS|FATHER|ROLL|DEPARTMENT|BACHELOR|MASTER|DECEMBER|DIRECTOR|ADMISSIONS|2K\d{2}|^\d+$|^(BS|MS|BA|MA|BBA|MBA)\b/i.test(
            line
          )
        ) {
          console.log(`    → Skipped (contains keyword or pattern)`);
          continue;
        }

        // Look for 1-4 words (likely a name)
        const words = line.trim().split(/\s+/);
        console.log(
          `    → Words: [${words.join(", ")}], count: ${words.length}`
        );

        if (words.length >= 1 && words.length <= 4) {
          // Check if words look like names (letters only, reasonable length)
          // Accept both Pascal case (Mashood) and ALL CAPS (MASHOOD)
          const wordChecks = words.map((w) => ({
            word: w,
            matchesPattern: /^[A-Z][A-Za-z]*$/.test(w),
            lengthOk: w.length >= 2 && w.length <= 15,
          }));
          console.log(`    → Word checks:`, wordChecks);

          const looksLikeName = words.every(
            (w) => /^[A-Z][A-Za-z]*$/.test(w) && w.length >= 2 && w.length <= 15
          );

          const lineLengthOk = line.length >= 3 && line.length <= 50;
          console.log(
            `    → looksLikeName: ${looksLikeName}, lineLengthOk: ${lineLengthOk}`
          );

          if (looksLikeName && lineLengthOk) {
            name = words
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ");
            console.log(`    ✓ FOUND NAME: "${name}"`);
            break;
          }
        }
      }
    }

    // Strategy 3: Look for text immediately before roll number
    if (!name || name.length < 3) {
      const textBeforeRoll = text.split(/2K\d{2}/i)[0];
      const possibleNames = textBeforeRoll.match(
        /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})$/i
      );
      if (possibleNames && possibleNames[1]) {
        const candidate = possibleNames[1].trim();
        if (
          !/UNIVERSITY|SINDH|STUDENT|IDENTITY|CARD|DEPARTMENT|CAMPUS|FATHER|NAME|ROLL|BS|MS|BA|MA|BBA|BACHELOR/i.test(
            candidate
          ) &&
          candidate.length >= 3 &&
          candidate.length <= 50
        ) {
          name = candidate
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
          console.log("Found name before roll number:", name);
        }
      }
    }

    console.log("Extracted Name:", name || "NOT FOUND");

    // 5. Extract Degree Program - STRICT to avoid capturing names
    let degreeProgram = "";

    // Only look for lines that START with degree keywords
    for (const line of lines) {
      // Must start with a degree keyword
      if (/^(BS|MS|BA|MA|BBA|MBA|B\.S|M\.S|BACHELOR|MASTER)\b/i.test(line)) {
        // Make sure it's not just "BS" or "MS" alone
        if (line.length > 4 && line.length < 60) {
          // Make sure it doesn't contain a roll number pattern
          if (!/2K\d{2}/i.test(line)) {
            degreeProgram = line.trim().toUpperCase();
            console.log("Found degree program in line:", degreeProgram);
            break;
          }
        }
      }
    }

    // If still not found, try pattern with field of study
    if (!degreeProgram) {
      const degreeMatch = text.match(
        /\b(B\.?S\.?|M\.?S\.?|BA|MA|BBA|MBA|B\.COM|M\.COM|BACHELOR|MASTER)\s+\(?(COMPUTER SCIENCE|CS|ENGINEERING|COMMERCE|ARTS|SCIENCE|BUSINESS ADMINISTRATION|PHYSICS|CHEMISTRY|MATHEMATICS|[\w\s]+)\)?/i
      );

      if (
        degreeMatch &&
        degreeMatch[0].length > 4 &&
        degreeMatch[0].length < 80
      ) {
        degreeProgram = degreeMatch[0]
          .trim()
          .replace(/\s+/g, " ")
          .toUpperCase();
        console.log("Found degree program with pattern:", degreeProgram);
      }
    }

    // 6. Improve department name - extract full name from degree program
    let departmentFullName = department;

    // Try to extract full department name from degree program text
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

    // Check if we can extract from degree program
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

    // Fallback to mapping if still abbreviation
    if (deptMapping[department]) {
      departmentFullName = deptMapping[department];
    }

    // Default degree program if not found
    if (!degreeProgram) {
      degreeProgram = `BS (${departmentFullName})`;
    }

    // If name is still missing, return error
    if (!name || name.length < 3) {
      console.warn("Name not found");
      return {
        success: false,
        error:
          "Could not extract student name from the ID card. Please ensure the name is clearly visible and not obscured.",
      };
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
 * Validate extracted data meets all requirements
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

  // 2. Validate batch year (not graduated, not future)
  const currentYear = new Date().getFullYear();
  const batchYearMatch = data.batch.match(/2K(\d{2})/);

  if (batchYearMatch) {
    const batchYear = 2000 + parseInt(batchYearMatch[1]);
    const graduationYear = batchYear + 4; // 4-year degree

    if (graduationYear < currentYear) {
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

  // 5. Validate card type
  if (!data.cardType.includes("STUDENT")) {
    errors.push("This appears to be a staff card, not a student card");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
