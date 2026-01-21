"use client";

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

export async function extractTextFromIDCard(
  imageFile: File,
  onProgress?: (progress: number) => void,
): Promise<OCRResult> {
  try {
    // Update progress to show we're starting
    if (onProgress) {
      onProgress(10);
    }

    // Convert file to base64 for sending to API
    const base64Image = await fileToBase64(imageFile);

    if (onProgress) {
      onProgress(30);
    }

    // Call our server-side API endpoint that uses Azure Document Intelligence
    const response = await fetch("/api/ocr/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (onProgress) {
      onProgress(70);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze document");
    }

    const { text, confidence } = await response.json();

    if (onProgress) {
      onProgress(90);
    }

    console.log("=== OCR Raw Output ===");
    console.log("Extracted Text:", text);
    console.log("OCR Confidence:", confidence);

    const parsedData = parseUOSIDCard(text, confidence);

    if (!parsedData.success) {
      if (onProgress) {
        onProgress(100);
      }
      return {
        success: false,
        confidence,
        error:
          parsedData.error ||
          "Could not extract required information from ID card.",
      };
    }

    if (onProgress) {
      onProgress(100);
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to process image. Please try again.",
    };
  }
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

function parseUOSIDCard(
  text: string,
  confidence: number,
): { success: boolean; data?: OCRResult["extractedData"]; error?: string } {
  try {
    console.log("=== Starting OCR Parsing ===");

    const normalizedText = text.toUpperCase().replace(/\s+/g, " ").trim();
    const lines = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    console.log("Normalized text:", normalizedText);
    console.log("Lines:", lines);

    if (text.length < 50) {
      return {
        success: false,
        error:
          "Unable to read the uploaded image. Please upload a clear photo of your UOS Student ID card.",
      };
    }

    const hasUniversity = /UNIVERSITY/i.test(normalizedText);
    const hasSindh = /SINDH/i.test(normalizedText);
    const hasJamshoro = /JAMSHORO/i.test(normalizedText);
    const hasStudentOrIdentity = /STUDENT|IDENTITY/i.test(normalizedText);
    const hasRollNoPattern = /2K\d{2}[\/\s]?[A-Z]{2,4}[\/\s]?\d+/i.test(
      normalizedText,
    );

    console.log("Validation checks:", {
      hasUniversity,
      hasSindh,
      hasJamshoro,
      hasStudentOrIdentity,
      hasRollNoPattern,
    });

    const isValidUOSCard =
      (hasUniversity || hasSindh || hasJamshoro) && hasRollNoPattern;

    if (!isValidUOSCard) {
      return {
        success: false,
        error:
          "This does not appear to be a University of Sindh ID card. Please upload your valid UOS Student ID card.",
      };
    }

    if (confidence < 50) {
      return {
        success: false,
        error:
          "Image quality is too low (" +
          Math.round(confidence) +
          "% confidence). Please upload a clearer photo with better lighting.",
      };
    }

    let rollNo = "";
    let department = "";
    let batch = "";

    const rollNoPatterns = [
      /2K(\d{2})[\/\-\s]*([A-Z]{2,4})[\/\-\s]*(\d+)/i,
      /2K(\d{2})([A-Z]{2,4})(\d+)/i,
    ];

    for (const pattern of rollNoPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const year = match[1];
        department = match[2].toUpperCase();
        const num = match[3];
        rollNo = `2K${year}/${department}/${num}`;
        batch = `2K${year}`;
        console.log("Extracted Roll No:", rollNo);
        break;
      }
    }

    if (!rollNo) {
      return {
        success: false,
        error:
          "Could not find a valid student roll number. Please ensure the roll number (e.g., 2K25/CSE/111) is clearly visible.",
      };
    }

    const currentYear = new Date().getFullYear();
    const batchYearMatch = batch.match(/2K(\d{2})/);

    if (batchYearMatch) {
      const batchYear = 2000 + parseInt(batchYearMatch[1]);
      const yearsSinceBatch = currentYear - batchYear;

      if (yearsSinceBatch > 5) {
        return {
          success: false,
          error:
            "This student appears to have graduated. Only current students (batch 2K" +
            (currentYear - 5).toString().slice(-2) +
            " onwards) can register.",
        };
      }

      if (batchYear > currentYear) {
        return {
          success: false,
          error: "Invalid batch year. Cannot register future students.",
        };
      }
    }

    let name = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line contains "Name" (OCR might miss first letter)
      if (/[Nn]?ame\s*[:;]/i.test(line)) {
        // Extract name from same line after the label
        const nameMatch = line.match(/[Nn]?ame\s*[:;]\s*(.+)/i);
        if (nameMatch && nameMatch[1]) {
          const candidate = nameMatch[1].trim();
          // Filter out non-name content (ID numbers, etc.)
          if (
            candidate.length >= 3 &&
            !/^(ID|#|\d)/.test(candidate) &&
            !isKeywordLine(candidate)
          ) {
            name = formatName(candidate);
            console.log("Found name from label (same line):", name);
            break;
          }
        }

        // If name not on same line, check next line
        if (!name && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.length >= 3 && isValidName(nextLine)) {
            name = formatName(nextLine);
            console.log("Found name from label (next line):", name);
            break;
          }
        }
      }
    }

    // Strategy 2: Look for ALL CAPS name lines (common on ID cards)
    if (!name || name.length < 3) {
      for (const line of lines) {
        if (isKeywordLine(line)) continue;

        // Clean the line and check if it looks like a name
        const cleanLine = line.replace(/[^A-Za-z\s]/g, "").trim();
        const words = cleanLine.split(/\s+/).filter((w) => w.length >= 2);

        if (words.length >= 1 && words.length <= 4) {
          const allWordsValid = words.every(
            (w) =>
              /^[A-Z][A-Za-z]*$/i.test(w) && w.length >= 2 && w.length <= 15,
          );

          if (
            allWordsValid &&
            cleanLine.length >= 3 &&
            cleanLine.length <= 40
          ) {
            name = formatName(cleanLine);
            console.log("Found name from caps line:", name);
            break;
          }
        }
      }
    }

    if (!name || name.length < 3) {
      return {
        success: false,
        error:
          "Could not extract student name from the ID card. Please ensure the name is clearly visible.",
      };
    }

    let degreeProgram = "";
    let departmentFullName = "";

    for (const line of lines) {
      const upperLine = line.toUpperCase();

      // Match degree patterns
      if (
        /^(BS|MS|BA|MA|BBA|MBA|B\.?COM|M\.?COM|BACHELOR|MASTER)/i.test(
          upperLine,
        )
      ) {
        // Skip if this line contains roll number
        if (/2K\d{2}/i.test(upperLine)) continue;

        degreeProgram = upperLine.trim();
        console.log("Found degree program:", degreeProgram);

        // Extract department name from parentheses
        const deptMatch = degreeProgram.match(/\(([^)]+)\)/);
        if (deptMatch) {
          departmentFullName = formatName(deptMatch[1]);
        } else {
          // Try to extract department after BS/MS etc.
          const afterDegree = degreeProgram.match(
            /^(BS|MS|BA|MA|BBA|MBA)\s+(.+)/i,
          );
          if (afterDegree && afterDegree[2]) {
            // Remove PRE-ENGINEERING, POST etc. suffixes
            departmentFullName = formatName(
              afterDegree[2].split(/\s+PRE|\s+POST|\s+FIRST|\s+SECOND/i)[0],
            );
          }
        }
        break;
      }
    }

    // If no degree program found, use department abbreviation
    if (!degreeProgram && department) {
      degreeProgram = `BS (${department})`;
    }

    // If department full name not extracted, use the abbreviation
    if (!departmentFullName) {
      departmentFullName = department;
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

function isKeywordLine(line: string): boolean {
  const keywords = [
    "UNIVERSITY",
    "SINDH",
    "JAMSHORO",
    "PAKISTAN",
    "STUDENT",
    "IDENTITY",
    "CARD",
    "CAMPUS",
    "ROLL",
    "DEPARTMENT",
    "BACHELOR",
    "MASTER",
    "DECEMBER",
    "JANUARY",
    "DIRECTOR",
    "ADMISSIONS",
    "VALID",
    "UPTO",
    "2K",
    "PRE-ENGINEERING",
    "FIRST YEAR",
    "SECOND YEAR",
    "ACADEMIC",
    "ALLAMA",
    "KAZI",
  ];

  const upperLine = line.toUpperCase();
  return (
    keywords.some((kw) => upperLine.includes(kw)) ||
    /^\d+$/.test(line.trim()) ||
    /^ID\s*[#:]?\s*\d+/i.test(line)
  );
}

function isValidName(str: string): boolean {
  const clean = str.replace(/[^A-Za-z\s]/g, "").trim();
  if (clean.length < 3 || clean.length > 40) return false;
  if (isKeywordLine(str)) return false;

  const words = clean.split(/\s+/);
  return (
    words.length >= 1 && words.length <= 4 && words.every((w) => w.length >= 2)
  );
}

function formatName(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function validateExtractedData(data: OCRResult["extractedData"]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    return { valid: false, errors: ["No data extracted"] };
  }

  const rollNoPattern = /^2K\d{2}\/[A-Z]{2,4}\/\d+$/;
  if (!rollNoPattern.test(data.rollNo)) {
    errors.push("Invalid roll number format. Expected format: 2K25/CSE/87");
  }

  const currentYear = new Date().getFullYear();
  const batchYearMatch = data.batch.match(/2K(\d{2})/);

  if (batchYearMatch) {
    const batchYear = 2000 + parseInt(batchYearMatch[1]);
    const yearsSinceBatch = currentYear - batchYear;

    if (yearsSinceBatch > 5) {
      errors.push(
        "This student has likely graduated. Only current students can register.",
      );
    }

    if (batchYear > currentYear) {
      errors.push("Invalid batch year. Cannot register future students.");
    }
  }

  if (!data.name || data.name.length < 3) {
    errors.push("Student name is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
