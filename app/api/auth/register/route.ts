import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      rollNo,
      email,
      password,
      phone,
      department,
      batch,
      degreeProgram,
      campus,
      bio,
      profilePicUrl,
      idCardImageUrl,
      interests,
      lookingFor,
    } = body;

    // Validation
    if (!name || !rollNo || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { rollNo: rollNo }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or roll number already exists" },
        { status: 409 }
      );
    }

    // Extract batch year from roll number (2K25 -> 2025)
    const rollNoMatch = rollNo.match(/2K(\d{2})/);
    const batchYear = rollNoMatch ? 2000 + parseInt(rollNoMatch[1]) : null;

    if (!batchYear) {
      return NextResponse.json(
        { error: "Invalid roll number format" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Use transaction to ensure atomicity - either everything succeeds or nothing does
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name,
          rollNo,
          email,
          phone: phone || null,
          passwordHash,
          department,
          batch,
          batchYear,
          degreeProgram: degreeProgram || null,
          campus: campus || null,
          bio: bio || null,
          profilePicUrl: profilePicUrl || null,
          idCardImageUrl: idCardImageUrl || "",
          isVerified: true, // Auto-verified via OCR
        },
      });

      // Create interests
      if (interests && Array.isArray(interests) && interests.length > 0) {
        const interestData = interests.map((tag: string) => ({
          userId: newUser.id,
          category: getCategoryForTag(tag),
          tag: tag,
        }));

        await tx.interest.createMany({
          data: interestData,
        });
      }

      // Create lookingFor entries
      if (lookingFor && Array.isArray(lookingFor) && lookingFor.length > 0) {
        const lookingForData = lookingFor.map((type: string) => ({
          userId: newUser.id,
          type: type,
        }));

        await tx.lookingFor.createMany({
          data: lookingForData,
        });
      }

      return newUser;
    });

    // Return success (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
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

// Helper function to determine category for interest tag
function getCategoryForTag(tag: string): string {
  const categories: { [key: string]: string[] } = {
    academic: [
      "Web Dev",
      "AI/ML",
      "Data Science",
      "Mobile Dev",
      "Game Dev",
      "Cybersecurity",
      "UI/UX Design",
      "Algorithms",
      "Databases",
      "Cloud Computing",
    ],
    language: [
      "Python",
      "JavaScript",
      "C++",
      "Java",
      "SQL",
      "Go",
      "Rust",
      "PHP",
      "TypeScript",
      "Kotlin",
    ],
    hobby: [
      "Gaming",
      "Photography",
      "Music",
      "Sports",
      "Reading",
      "Writing",
      "Art",
      "Cooking",
      "Travel",
      "Fitness",
    ],
    sport: [
      "Cricket",
      "Football",
      "Basketball",
      "Badminton",
      "Chess",
      "Table Tennis",
      "Volleyball",
      "Tennis",
    ],
    activity: [
      "Debate",
      "Public Speaking",
      "Event Management",
      "Volunteering",
      "Drama",
      "Student Council",
    ],
    other: [
      "Startups",
      "Freelancing",
      "Content Creation",
      "Blogging",
      "YouTube",
      "Podcasting",
    ],
  };

  for (const [category, tags] of Object.entries(categories)) {
    if (tags.includes(tag)) {
      return category;
    }
  }

  return "other";
}
