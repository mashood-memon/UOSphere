# UOSphere - University of Sindh Social Platform

## 🎯 Project Vision

UOSphere is an exclusive social networking platform designed for University of Sindh students to discover peers with shared interests, form study groups, collaborate on projects, and build meaningful connections within the university community. Whether you're looking for a project partner, study buddy, or someone who shares your hobbies, UOSphere helps you find your tribe on campus.

## 🌟 Core Purpose

- Connect students across different departments and batches
- Help students find peers with similar academic interests and hobbies
- Facilitate study groups and project collaborations
- Build a stronger, more connected university community
- Create opportunities for mentorship between seniors and juniors

## 👥 Target Audience

**Current students** of University of Sindh, Jamshoro across all departments and campuses including:

- Computer Science (CSE, CSM, etc.)
- Engineering departments
- Sciences, Arts, Commerce, and other faculties
- All batches from freshmen to final year

## 🔐 Automated Verification System

### ID Card Information to Extract:

From the UOS Student Identity Card, we extract these key fields:

1. **University Header** - "UNIVERSITY OF SINDH"
2. **Card Type** - "STUDENT IDENTITY CARD"
3. **Student Name** - From "Name:" field
4. **Roll Number** - Format: `2K25/CSE/87`
5. **Degree Program** - Bottom section (e.g., "BS (COMPUTER SCIENCE) PRE-ENGINEERING")
6. **Campus Name** - (e.g., "ALLAMA I.I. KAZI CAMPUS")

### Core Validation Criteria (Must Pass All):

**1. Roll Number Validation (MOST IMPORTANT)**

- **Pattern**: `2K[YY]/[DEPT]/[NUM]`
- **Examples**:
  - ✅ `2K25/CSE/87`
  - ✅ `2K24/BBA/156`
  - ✅ `2K23/ENG/42`
  - ✅ `2K22/CSM/15`
  - ❌ `2025/CSE/87` (wrong format)
  - ❌ `2K28/CSE/87` (future batch, suspicious)
- **Batch Year Check**: Extract year from roll number (e.g., `25` from `2K25`)
  - Current year is 2025, so valid batches: 2K22, 2K23, 2K24, 2K25
  - Formula: `currentYear - batchYear <= 4` (4-year degree programs)
  - If someone tries with `2K19` or older → Reject (likely graduated)
  - If someone tries with `2K26` or newer → Reject (suspicious/fake)
- **Uniqueness**: Check if roll number already exists in database
  - If exists → Reject with message "This roll number is already registered"

**2. University Header Text**

- Must contain: `UNIVERSITY OF SINDH`
- Case-insensitive match
- Confirms authenticity of UOS card

**3. Card Type Text**

- Must contain: `STUDENT IDENTITY CARD`
- Distinguishes from faculty/staff cards
- Case-insensitive match

**4. Student Name**

- Must be extracted and not empty
- Should contain only alphabets and spaces
- Used for profile display

**5. Degree Program**

- Should contain degree keywords: `BS`, `MS`, `BA`, `BBA`, `MA`, `B.COM`, `BBA`, `MBA`, etc.
- Helps categorize students by degree type
- Not a hard rejection, but flags for review if missing

### Validation Logic Summary:

```javascript
const isValidStudent = (extractedData) => {
  // 1. Roll number format check
  const rollNoPattern = /^2K(\d{2})\/([A-Z]{2,4})\/(\d+)$/i;
  if (!rollNoPattern.test(extractedData.rollNo)) return false;

  // 2. Batch year check (within 4 years)
  const batchYear = 2000 + parseInt(extractedData.rollNo.match(/2K(\d{2})/)[1]);
  const currentYear = new Date().getFullYear();
  if (currentYear - batchYear > 4 || batchYear > currentYear) return false;

  // 3. Duplicate roll number check
  if (await isDuplicateRollNo(extractedData.rollNo)) return false;

  // 4. University header check
  if (!extractedData.text.includes("UNIVERSITY OF SINDH")) return false;

  // 5. Card type check
  if (!extractedData.text.includes("STUDENT IDENTITY CARD")) return false;

  // 6. Name validation
  if (!extractedData.name || extractedData.name.trim().length === 0) return false;

  return true;
};
```

### Why This Approach Works:

✅ **Roll number is the golden key** - It encodes batch year AND uniqueness
✅ **No need for expiry date** - Roll number year tells us if they're active
✅ **Simple but effective** - 6 validation points that are hard to fake
✅ **Duplicate prevention** - Database check ensures no repeated registrations

### Rejection Scenarios:

❌ **Graduated Students**: Roll number from 2K21 or earlier (in 2025)
❌ **Fake Cards**: Missing "UNIVERSITY OF SINDH" text
❌ **Staff Cards**: Missing "STUDENT IDENTITY CARD" text
❌ **Already Registered**: Roll number exists in database
❌ **Invalid Format**: Roll number doesn't match pattern
❌ **Poor Image Quality**: OCR confidence < 70%

## 🎨 User Journey & Features

### Phase 1: Onboarding (Sign Up & Verification)

**Step 1: Upload ID Card**

- User uploads front side of UOS ID card
- Real-time image quality check
- OCR extraction begins automatically
- Progress indicator shows extraction status

**Step 2: Auto-fill Verification**

- System extracts and displays:
  - Name
  - Roll Number
  - Department (from roll number)
  - Batch/Year (from roll number)
- User confirms or corrects extracted data
- Validation runs automatically
- Real-time feedback on validation status

**Step 3: Account Setup**

- Email and phone number (for account recovery)
- Password creation (minimum 8 characters)
- Profile picture upload (optional, can use ID photo)
- Short bio (150 characters max)

**Step 4: Interest Selection**

- Multi-select interest tags (minimum 3, maximum 10):
  - **Academic**: Web Dev, AI/ML, Data Science, Mobile Dev, Game Dev, Cybersecurity, UI/UX Design, Algorithms, Databases, Cloud Computing
  - **Languages**: Python, JavaScript, C++, Java, SQL, Go, Rust, PHP, etc.
  - **Hobbies**: Gaming, Photography, Music, Sports, Reading, Writing, Art, Cooking
  - **Sports**: Cricket, Football, Basketball, Badminton, Chess, Table Tennis
  - **Activities**: Debate, Public Speaking, Event Management, Volunteering, Drama
  - **Other**: Startups, Freelancing, Content Creation, Blogging, YouTube

**Step 5: What You're Looking For**

- Checkboxes (select multiple):
  - 📚 Study partner for specific courses
  - 💻 Project collaboration
  - 🎯 Hobby buddy
  - 🎓 Mentorship (give or receive)
  - 🏆 Competition team members
  - 🎪 Event/club partners
  - 💬 Just looking to make friends

**Step 6: Course Help (Optional)**

- Select courses you're struggling with
- Select courses you can help others with
- Displayed as "Can Help With" and "Looking for Help In" on profile

### Phase 2: Discovery & Connection

**Home Feed**

- Personalized feed showing:
  - Suggested connections based on interests (match percentage shown)
  - Recent posts from communities you've joined
  - People from your department
  - Students looking for help in subjects you're good at
  - Seniors from your department (for mentorship)

**Discover Page**

- **Filter Options:**
  - Department (CSE, CSM, BBA, Engineering, etc.)
  - Batch (2K25, 2K24, 2K23, 2K22)
  - Interests (tags)
  - Year (First Year, Second Year, Third Year, Final Year)
  - Looking For (Study Partner, Project Collab, Mentorship, etc.)
- **Search:**

  - Search by name
  - Search by roll number
  - Search by interests

- **Sort Options:**
  - Most compatible (interest match %)
  - Recently joined
  - Same department
  - Same batch
  - Same campus

**User Profiles**

- Public information:
  - Name, Roll No, Department, Batch, Campus
  - Bio
  - Interests (displayed as colorful tags)
  - What they're looking for
  - Courses they can help with
  - Courses they need help in
  - Communities they're part of
  - Recent posts/activity
  - Number of connections
- Connection button:
  - "Connect" button sends connection request
  - Once connected, can send direct messages
  - Shows mutual connections
  - Shows interest match percentage

### Phase 3: Communities & Groups

**Community Types:**

- **Department Communities** (auto-join based on your dept)
  - CS Department
  - Engineering Department
  - BBA Department
  - etc.
- **Interest-based Communities**
  - Web Dev Club
  - AI/ML Enthusiasts
  - Gaming Squad
  - Photography Club
  - etc.
- **Course-specific Communities**
  - Data Structures 2025
  - Calculus Help Group
  - Database Systems Study Group
  - etc.
- **Batch Communities**
  - Batch 2K25
  - Batch 2K24
  - etc.
- **Campus Communities**
  - Allama I.I. Kazi Campus
  - Main Campus
  - etc.

**Community Features:**

- Create and join communities (public or request-to-join)
- Post text, images, or polls
- Comment and react to posts (like, love, celebrate)
- Pin important announcements
- Community rules and description
- Member list with roles (admin, moderator, member)
- Search within community

**Post Types:**

- **Text posts** - Share thoughts, questions, updates
- **Image posts** - Share photos, screenshots, memes
- **Poll posts** - Create polls for community voting
- **Looking for posts** - "Looking for study partner for DSA"
- **Event announcements** - Hackathons, meetups, competitions
- **Resource sharing** - Notes, links, useful resources

### Phase 4: Direct Messaging

**Prerequisites to DM:**

- Must be connected (accepted connection request)
- OR both members of same community

**Messaging Features:**

- One-on-one chat
- Send text messages
- Send images
- Share user profiles
- Message reactions (emoji)
- Delete messages
- Block/report users
- Typing indicators
- Message status (sent/delivered/seen)
- Online/offline status
- Last seen timestamp

### Phase 5: Additional Features

**Notifications:**

- Connection requests received
- Connection requests accepted
- New messages
- Post likes and comments
- Mentions in posts/comments
- Community invites
- New posts in joined communities

**Privacy Settings:**

- Who can send connection requests:
  - Everyone
  - Same Department Only
  - Same Batch and Department Only
  - No One
- Who can see your posts:
  - Everyone
  - Connections Only
  - Specific Communities Only
- Profile visibility:
  - Public (searchable)
  - Connections Only
  - Private (hidden from search)
- Show/hide online status
- Show/hide last seen

**Safety & Moderation:**

- Report users for:
  - Harassment
  - Spam
  - Inappropriate content
  - Fake profile
  - Other
- Block users (they can't see your profile or contact you)
- Community moderators can:
  - Remove posts
  - Ban members
  - Pin announcements
- Admin review system for reported content
- Community guidelines page

## 🛠️ Technical Architecture

### Updated Tech Stack (Next.js Based)

**Framework:**

- **Next.js 15** (App Router) - Full-stack React framework with enhanced performance
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful pre-built components

**Database:**

- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database access
- **Hosting**: Neon or Supabase (generous free tiers)

**Authentication:**

- **NextAuth.js v5** - Built for Next.js, supports JWT
- **bcryptjs** - Password hashing

**File Storage:**

- **Cloudinary** - Image hosting and optimization
  - Free tier: 25GB storage, 25GB bandwidth
  - Automatic image resizing and optimization

**OCR Services:**

- **Primary**: Tesseract.js (free, open-source)
  - Runs in browser
  - Good for clear, well-lit images
  - 70-85% accuracy
- **Fallback**: Azure Computer Vision API
  - Free tier: 5,000 calls/month
  - 95%+ accuracy
  - Use when Tesseract confidence < 80%

**Real-time Features:**

- **Pusher** - Real-time messaging and notifications
  - Free tier: 200 concurrent connections, 200k messages/day
  - OR **Socket.io** if you prefer self-hosted

**Deployment:**

- **Vercel** - Perfect for Next.js (free tier)
- **Environment**: Production + Preview branches
- **CI/CD**: Automatic deployments via GitHub

### Why Next.js Over React + Vite?

**1. Built-in API Routes**

```typescript
// app/api/auth/register/route.ts
export async function POST(request: Request) {
  // Handle registration directly in Next.js
  // No separate backend server needed
}
```

**2. Server-Side Rendering (SSR)**

- User profiles are SEO-friendly
- Google can index community posts
- Faster initial page loads

**3. Server Components**

- OCR processing can run on server
- Reduced client-side JavaScript
- Better performance

**4. Image Optimization**

```tsx
import Image from "next/image";

<Image
  src={profilePic}
  width={100}
  height={100}
  alt="Profile"
  // Automatically optimized!
/>;
```

**5. File-based Routing**

```
app/
  ├── page.tsx              → /
  ├── discover/
  │   └── page.tsx          → /discover
  ├── profile/
  │   └── [id]/
  │       └── page.tsx      → /profile/[id]
  └── communities/
      └── [id]/
          └── page.tsx      → /communities/[id]
```

**6. Single Deployment**

- One app = frontend + backend
- Easier to manage
- Lower hosting costs

**7. TypeScript by Default**

- Better type safety
- Fewer runtime errors
- Better autocomplete

### Database Schema (Prisma)

```prisma
// schema.prisma

model User {
  id                String          @id @default(uuid())
  rollNo            String          @unique
  name              String
  email             String?         @unique
  phone             String?
  passwordHash      String
  department        String          // Extracted from roll no
  batch             String          // Extracted from roll no (2K25)
  batchYear         Int             // Numeric year (2025)
  degreeProgram     String?
  campus            String?
  bio               String?
  profilePicUrl     String?
  idCardImageUrl    String          // For verification records
  isVerified        Boolean         @default(true) // Auto-verified via OCR
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  // Relations
  interests         Interest[]
  lookingFor        LookingFor[]
  coursesCanHelp    CourseHelp[]    @relation("CanHelp")
  coursesNeedHelp   CourseHelp[]    @relation("NeedHelp")
  posts             Post[]
  comments          Comment[]
  reactions         Reaction[]
  communities       CommunityMember[]
  sentConnections   Connection[]    @relation("Sender")
  receivedConnections Connection[]  @relation("Receiver")
  sentMessages      Message[]       @relation("Sender")
  receivedMessages  Message[]       @relation("Receiver")
  notifications     Notification[]
}

model Interest {
  id        String   @id @default(uuid())
  userId    String
  category  String   // academic, language, hobby, sport, activity, other
  tag       String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, tag])
}

model LookingFor {
  id        String   @id @default(uuid())
  userId    String
  type      String   // study_partner, project_collab, hobby_buddy, mentorship, competition_team, event_partner, friends
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type])
}

model CourseHelp {
  id        String   @id @default(uuid())
  courseName String
  canHelpUsers  User[] @relation("CanHelp")
  needHelpUsers User[] @relation("NeedHelp")
}

model Connection {
  id         String   @id @default(uuid())
  senderId   String
  receiverId String
  status     String   @default("pending") // pending, accepted, rejected
  createdAt  DateTime @default(now())

  sender     User     @relation("Sender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver   User     @relation("Receiver", fields: [receiverId], references: [id], onDelete: Cascade)

  @@unique([senderId, receiverId])
  @@index([senderId])
  @@index([receiverId])
}

model Community {
  id          String    @id @default(uuid())
  name        String
  description String?
  type        String    // department, interest, course, hobby, batch, campus
  isPublic    Boolean   @default(true)
  coverImage  String?
  createdById String
  createdAt   DateTime  @default(now())

  members     CommunityMember[]
  posts       Post[]

  @@index([type])
}

model CommunityMember {
  id          String    @id @default(uuid())
  userId      String
  communityId String
  role        String    @default("member") // member, moderator, admin
  joinedAt    DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@unique([userId, communityId])
  @@index([communityId])
}

model Post {
  id          String    @id @default(uuid())
  userId      String
  communityId String?
  content     String    @db.Text
  imageUrls   String[]
  postType    String    @default("text") // text, image, poll, looking_for, event
  isPinned    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  community   Community? @relation(fields: [communityId], references: [id], onDelete: Cascade)
  comments    Comment[]
  reactions   Reaction[]

  @@index([communityId])
  @@index([userId])
  @@index([createdAt])
}

model Comment {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([postId])
}

model Reaction {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  type      String   // like, love, celebrate
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId])
}

model Message {
  id         String   @id @default(uuid())
  senderId   String
  receiverId String
  content    String   @db.Text
  imageUrl   String?
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  sender     User     @relation("Sender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver   User     @relation("Receiver", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([senderId, receiverId])
  @@index([createdAt])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // connection_request, connection_accepted, new_message, post_reaction, post_comment, mention
  title     String
  message   String
  linkUrl   String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
}
```

### API Routes (Next.js App Router)

**Authentication:**

```
POST   /api/auth/upload-id          # Upload ID, extract with OCR
POST   /api/auth/register            # Complete registration
POST   /api/auth/login               # Login
POST   /api/auth/logout              # Logout
GET    /api/auth/session             # Get current session
```

**Users:**

```
GET    /api/users/me                 # Get current user
PUT    /api/users/me                 # Update profile
GET    /api/users/[id]               # Get user by ID
GET    /api/users/search             # Search users (with filters)
GET    /api/users/suggestions        # Get suggested connections
```

**Connections:**

```
POST   /api/connections              # Send connection request
PUT    /api/connections/[id]/accept  # Accept request
PUT    /api/connections/[id]/reject  # Reject request
GET    /api/connections/pending      # Pending requests
GET    /api/connections              # All connections
DELETE /api/connections/[id]         # Remove connection
```

**Communities:**

```
GET    /api/communities              # List all
POST   /api/communities              # Create new
GET    /api/communities/[id]         # Get details
POST   /api/communities/[id]/join    # Join community
DELETE /api/communities/[id]/leave   # Leave community
GET    /api/communities/[id]/members # Get members
PUT    /api/communities/[id]         # Update (admin only)
```

**Posts:**

```
GET    /api/posts/feed               # Personalized feed
GET    /api/posts/community/[id]     # Community posts
POST   /api/posts                    # Create post
PUT    /api/posts/[id]               # Update post
DELETE /api/posts/[id]               # Delete post
POST   /api/posts/[id]/react         # React to post
POST   /api/posts/[id]/comment       # Comment on post
DELETE /api/posts/[id]/pin           # Toggle pin (moderator)
```

**Messages:**

```
GET    /api/messages/conversations   # List all conversations
GET    /api/messages/[userId]        # Get conversation with user
POST   /api/messages                 # Send message
PUT    /api/messages/[id]/read       # Mark as read
```

**Notifications:**

```
GET    /api/notifications            # Get all notifications
PUT    /api/notifications/[id]/read  # Mark as read
PUT    /api/notifications/read-all   # Mark all as read
```

### OCR Extraction Flow

**Client-Side (Tesseract.js):**

```typescript
// lib/ocr/tesseract.ts

import Tesseract from "tesseract.js";

export async function extractTextFromImage(imageFile: File) {
  const {
    data: { text, confidence },
  } = await Tesseract.recognize(imageFile, "eng", {
    logger: (m) => console.log(m), // Progress logging
  });

  return {
    text,
    confidence,
    extractedData: parseUOSCard(text),
  };
}

function parseUOSCard(text: string) {
  // Extract roll number
  const rollNoMatch = text.match(/2K\d{2}\/[A-Z]{2,4}\/\d+/i);

  // Extract name (appears after "Name:")
  const nameMatch = text.match(/Name\s*:\s*([A-Z\s]+)/i);

  // Extract degree program
  const degreeMatch = text.match(/(BS|MS|BA|BBA|MA|B\.COM|MBA)\s*\([^)]+\)/i);

  return {
    rollNo: rollNoMatch?.[0] || null,
    name: nameMatch?.[1]?.trim() || null,
    degreeProgram: degreeMatch?.[0] || null,
    hasUniversityHeader: text.includes("UNIVERSITY OF SINDH"),
    hasStudentCardText: text.includes("STUDENT IDENTITY CARD"),
  };
}
```

**Server-Side Validation (Next.js API):**

```typescript
// app/api/auth/upload-id/route.ts

import { extractTextFromImage } from "@/lib/ocr/tesseract";
import { validateUOSCard } from "@/lib/validation/card-validator";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("idCard") as File;

  // 1. Extract text using Tesseract
  const { text, confidence, extractedData } = await extractTextFromImage(file);

  // 2. If confidence is low, use Azure Computer Vision as fallback
  if (confidence < 80) {
    // Fallback to Azure API
    const azureData = await extractWithAzure(file);
    extractedData = parseUOSCard(azureData.text);
  }

  // 3. Validate extracted data
  const validation = await validateUOSCard(extractedData);

  if (!validation.isValid) {
    return Response.json(
      {
        success: false,
        errors: validation.errors,
      },
      { status: 400 }
    );
  }

  // 4. Upload to Cloudinary
  const imageUrl = await uploadToCloudinary(file);

  // 5. Return extracted and validated data
  return Response.json({
    success: true,
    data: {
      ...extractedData,
      imageUrl,
      confidence,
    },
  });
}
```

**Validation Logic:**

```typescript
// lib/validation/card-validator.ts

export async function validateUOSCard(data: ExtractedData) {
  const errors: string[] = [];

  // 1. Roll number format
  const rollNoPattern = /^2K(\d{2})\/([A-Z]{2,4})\/(\d+)$/i;
  if (!rollNoPattern.test(data.rollNo)) {
    errors.push("Invalid roll number format");
  }

  // 2. Batch year validation
  const match = data.rollNo.match(/2K(\d{2})/);
  if (match) {
    const batchYear = 2000 + parseInt(match[1]);
    const currentYear = new Date().getFullYear();

    // Check if within 4 years
    if (currentYear - batchYear > 4) {
      errors.push("This card is for a graduated student");
    }

    if (batchYear > currentYear) {
      errors.push("Invalid batch year (future date)");
    }
  }

  // 3. Check for duplicate roll number
  const existingUser = await prisma.user.findUnique({
    where: { rollNo: data.rollNo },
  });

  if (existingUser) {
    errors.push("This roll number is already registered");
  }

  // 4. University header check
  if (!data.hasUniversityHeader) {
    errors.push("Not a valid University of Sindh card");
  }

  // 5. Student card text check
  if (!data.hasStudentCardText) {
    errors.push("Not a student identity card");
  }

  // 6. Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Could not extract student name");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

## 📱 User Interface Design

**Design System:**

- **Colors:**
  - Primary: University Blue (#3B82F6)
  - Secondary: Slate Gray (#64748B)
  - Accent: Orange (#F97316)
  - Success: Green (#10B981)
  - Error: Red (#EF4444)
- **Typography:**

  - Headings: Inter (bold)
  - Body: Inter (regular)
  - Monospace: JetBrains Mono (for roll numbers)

- **Components (shadcn/ui):**
  - Button, Card, Dialog, Dropdown
  - Input, Textarea, Select
  - Avatar, Badge, Tabs
  - Toast notifications

**Key Pages:**

1. **Landing Page** (`/`)

   - Hero section with app tagline
   - Feature highlights
   - Student testimonials
   - CTA: "Get Started"

2. **Sign Up** (`/signup`)

   - Step 1: Upload ID card
   - Step 2: Confirm extracted data
   - Step 3: Create account
   - Step 4: Select interests
   - Step 5: What you're looking for

3. **Home Feed** (`/home`)

   - Left sidebar: Suggestions
   - Center: Posts feed
   - Right sidebar: Communities, Notifications

4. **Discover** (`/discover`)

   - Filter sidebar
   - User grid/list view
   - Search bar

5. **Profile** (`/profile/[id]`)

   - Cover photo
   - Profile info card
   - Interests tags
   - Recent posts
   - Connection button

6. **Communities** (`/communities`)

   - List of joined communities
   - Discover new communities
   - Create community button

7. **Community Page** (`/communities/[id]`)

   - Cover image
   - Description
   - Posts feed
   - Members list
   - Join/Leave button

8. **Messages** (`/messages`)
   - Conversation list (left)
   - Chat window (right)
   - Mobile: Stack views

## 🚀 Development Roadmap

### Week 1-2: Project Setup & Authentication

- [x] Initialize Next.js 15 project with TypeScript
- [x] Set up Tailwind CSS and shadcn/ui
- [x] Configure Prisma with PostgreSQL
- [x] Set up Cloudinary integration
- [x] Implement NextAuth.js
- [ ] Build ID upload page
- [ ] Integrate Tesseract.js OCR
- [ ] Create validation logic
- [ ] Build registration flow

### Week 3-4: User Profiles & Discovery

- [ ] Create user profile pages
- [ ] Build profile edit functionality
- [ ] Implement interest tags and display
- [ ] Build discover page with filters
- [ ] Create search functionality (name, roll number, interests)
- [ ] Implement connection system (send/accept/reject)
- [ ] Show interest match percentage
- [ ] Display suggested connections algorithm

### Week 5-6: Communities & Posts

- [ ] Create community model and database setup
- [ ] Build community creation page
- [ ] Implement join/leave community functionality
- [ ] Create community feed page
- [ ] Build post creation (text, image, poll)
- [ ] Implement reactions (like, love, celebrate)
- [ ] Add commenting system
- [ ] Create community moderation tools (pin, remove, ban)
- [ ] Build member management interface

### Week 7-8: Messaging & Real-time Features

- [ ] Set up Pusher for real-time communication
- [ ] Build messaging interface (conversations list)
- [ ] Implement one-on-one chat functionality
- [ ] Add message status (sent/delivered/seen)
- [ ] Create typing indicators
- [ ] Build online/offline status system
- [ ] Implement notifications system
- [ ] Add real-time notification updates
- [ ] Create notification preferences

### Week 9-10: Privacy, Safety & Polish

- [ ] Implement privacy settings
- [ ] Build report/block user functionality
- [ ] Create admin moderation dashboard
- [ ] Add content moderation tools
- [ ] Implement rate limiting
- [ ] Build community guidelines page
- [ ] Add loading states and error handling
- [ ] Optimize images and performance
- [ ] Mobile responsiveness testing
- [ ] Cross-browser compatibility testing

### Week 11-12: Testing & Deployment

- [ ] Write unit tests for critical functions
- [ ] Test OCR with various ID card images
- [ ] End-to-end testing of user flows
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Load testing with multiple users
- [ ] Set up production database (Neon/Supabase)
- [ ] Configure production environment variables
- [ ] Deploy to Vercel
- [ ] Set up monitoring and error tracking
- [ ] Create user documentation/help center

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** database (local or cloud)
- **Git** for version control
- Code editor (VS Code recommended)
- Basic knowledge of TypeScript and React

### Initial Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd social_app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Database (local PostgreSQL or Neon/Supabase)
DATABASE_URL="postgresql://username:password@localhost:5432/uos_connect"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (get free account at cloudinary.com)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Pusher (get free account at pusher.com)
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_APP_ID="your-app-id"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# Azure Computer Vision (optional, for OCR fallback)
AZURE_VISION_KEY="your-azure-key"
AZURE_VISION_ENDPOINT="your-azure-endpoint"
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed the database with sample data
npx prisma db seed
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Project Structure

```
social_app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (main)/                   # Main app routes (protected)
│   │   ├── home/
│   │   │   └── page.tsx
│   │   ├── discover/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── communities/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── messages/
│   │       ├── page.tsx
│   │       └── [userId]/
│   │           └── page.tsx
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   ├── upload-id/
│   │   │   │   └── route.ts
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── users/
│   │   │   ├── me/
│   │   │   │   └── route.ts
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   ├── search/
│   │   │   │   └── route.ts
│   │   │   └── suggestions/
│   │   │       └── route.ts
│   │   ├── connections/
│   │   │   ├── route.ts
│   │   │   ├── pending/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       ├── accept/
│   │   │       │   └── route.ts
│   │   │       └── reject/
│   │   │           └── route.ts
│   │   ├── communities/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── join/
│   │   │       │   └── route.ts
│   │   │       ├── leave/
│   │   │       │   └── route.ts
│   │   │       └── members/
│   │   │           └── route.ts
│   │   ├── posts/
│   │   │   ├── route.ts
│   │   │   ├── feed/
│   │   │   │   └── route.ts
│   │   │   ├── community/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── react/
│   │   │       │   └── route.ts
│   │   │       ├── comment/
│   │   │       │   └── route.ts
│   │   │       └── pin/
│   │   │           └── route.ts
│   │   ├── messages/
│   │   │   ├── route.ts
│   │   │   ├── conversations/
│   │   │   │   └── route.ts
│   │   │   ├── [userId]/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       └── read/
│   │   │           └── route.ts
│   │   └── notifications/
│   │       ├── route.ts
│   │       ├── [id]/
│   │       │   └── read/
│   │       │       └── route.ts
│   │       └── read-all/
│   │           └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── id-upload.tsx
│   │   ├── registration-form.tsx
│   │   └── interest-selector.tsx
│   ├── profile/
│   │   ├── profile-card.tsx
│   │   ├── profile-header.tsx
│   │   └── interest-tags.tsx
│   ├── feed/
│   │   ├── post-card.tsx
│   │   ├── post-create.tsx
│   │   └── comment-section.tsx
│   ├── communities/
│   │   ├── community-card.tsx
│   │   ├── community-list.tsx
│   │   └── member-list.tsx
│   ├── messages/
│   │   ├── conversation-list.tsx
│   │   ├── chat-window.tsx
│   │   └── message-bubble.tsx
│   └── shared/
│       ├── navbar.tsx
│       ├── sidebar.tsx
│       ├── search-bar.tsx
│       └── notification-bell.tsx
├── lib/                          # Utility functions
│   ├── prisma.ts                 # Prisma client instance
│   ├── auth.ts                   # NextAuth configuration
│   ├── cloudinary.ts             # Cloudinary helpers
│   ├── pusher.ts                 # Pusher configuration
│   ├── ocr/
│   │   ├── tesseract.ts          # Tesseract.js integration
│   │   └── azure-vision.ts       # Azure fallback
│   ├── validation/
│   │   └── card-validator.ts    # ID card validation logic
│   └── utils.ts                  # General utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding script
├── public/                       # Static assets
│   ├── images/
│   └── icons/
├── types/                        # TypeScript type definitions
│   ├── next-auth.d.ts
│   └── index.ts
├── .env.example                  # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── PROJECT.md                    # This file
```

## 🔧 Development Guidelines

### Code Style

- Use **TypeScript** for all files
- Follow **functional components** with hooks
- Use **async/await** instead of promises
- Implement **error boundaries** for error handling
- Add **loading states** for all async operations
- Write **meaningful commit messages**

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: kebab-case (`user-profile.tsx`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **API routes**: lowercase with hyphens (`/api/users/[id]`)

### Database Best Practices

- Always use **transactions** for multi-step operations
- Add **indexes** for frequently queried fields
- Use **cascading deletes** where appropriate
- Implement **soft deletes** for user data (optional)
- Run migrations in development before committing

### Security Considerations

- **Never** expose sensitive data in API responses
- **Always** validate user input on the server
- Use **bcrypt** for password hashing (12+ rounds)
- Implement **rate limiting** on authentication routes
- Sanitize user-generated content (XSS prevention)
- Use **CSRF tokens** for state-changing operations
- Validate file uploads (size, type, content)

### Performance Optimization

- Use **Server Components** where possible
- Implement **pagination** for lists (20-50 items per page)
- Add **caching** for frequently accessed data
- Optimize images with Next.js `Image` component
- Use **lazy loading** for heavy components
- Implement **debouncing** for search inputs
- Add **skeleton loaders** for better UX

## 📊 Key Metrics to Track

- **User Registrations**: Daily/weekly sign-ups
- **Verification Success Rate**: % of successful ID verifications
- **Active Users**: DAU (Daily Active Users), MAU (Monthly Active Users)
- **Connections Made**: Average connections per user
- **Communities Created**: Total and growth rate
- **Posts Published**: Daily post volume
- **Messages Sent**: Daily message volume
- **Engagement Rate**: Likes, comments, shares per post

## 🐛 Common Issues & Solutions

### OCR Not Extracting Correctly

- Ensure image is clear and well-lit
- ID card should be flat (no curves/folds)
- Try different angles if initial attempt fails
- Check Tesseract.js worker initialization
- Verify Azure fallback is configured (if enabled)

### Database Connection Issues

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database credentials
- Run `npx prisma generate` after schema changes
- Check Prisma client is initialized correctly

### Authentication Not Working

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and session storage
- Ensure middleware is protecting routes
- Check session configuration in `auth.ts`

### Image Upload Failures

- Verify Cloudinary credentials in `.env`
- Check file size limits (max 10MB recommended)
- Ensure allowed file types (jpg, png, webp)
- Check network connectivity
- Verify CORS settings if using client-side upload

### Real-time Features Not Working

- Verify Pusher credentials
- Check client-side key is prefixed with `NEXT_PUBLIC_`
- Ensure Pusher cluster matches your account
- Check browser console for connection errors
- Verify WebSocket support in browser

## 🎯 Future Enhancements

### Phase 2 Features (Post-Launch)

- **Mobile App**: React Native iOS/Android apps
- **Video Calls**: Integrate WebRTC for 1-on-1 calls
- **Events Calendar**: University events and meetups
- **Job Board**: Internship and job postings
- **Alumni Network**: Connect with graduated students
- **Skill Endorsements**: LinkedIn-style endorsements
- **Study Rooms**: Virtual study rooms with screen sharing
- **Resource Library**: Share notes, books, past papers
- **Achievement Badges**: Gamification for engagement
- **AI Recommendations**: ML-based connection suggestions

### Advanced Features

- **Multi-language Support**: Urdu and English
- **Dark Mode**: Theme switching
- **Progressive Web App**: Offline support
- **Push Notifications**: Mobile notifications
- **Analytics Dashboard**: User insights and trends
- **API for Third Parties**: Developer API access
- **Integration with LMS**: Connect with university systems

## 👥 Contributors

- **Project Lead**: [Your Name]
- **Developers**: [Team Members]
- **Designers**: [Design Team]
