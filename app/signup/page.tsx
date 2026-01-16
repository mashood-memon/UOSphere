"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  Upload,
} from "lucide-react";
import { extractTextFromIDCard } from "@/lib/ocr-client";

// Interest categories with tags
const interestCategories = {
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
  languages: [
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
  hobbies: [
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
  sports: [
    "Cricket",
    "Football",
    "Basketball",
    "Badminton",
    "Chess",
    "Table Tennis",
    "Volleyball",
    "Tennis",
  ],
  activities: [
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

const lookingForOptions = [
  {
    id: "study_partner",
    label: "Study partner for specific courses",
    icon: "📚",
  },
  { id: "project_collab", label: "Project collaboration", icon: "💻" },
  { id: "hobby_buddy", label: "Hobby buddy", icon: "🎯" },
  { id: "mentorship", label: "Mentorship (give or receive)", icon: "🎓" },
  { id: "competition_team", label: "Competition team members", icon: "🏆" },
  { id: "event_partner", label: "Event/club partners", icon: "🎪" },
  { id: "friends", label: "Just looking to make friends", icon: "💬" },
];

export default function SignupPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Form state
  const [formData, setFormData] = useState({
    // Step 1
    idCardImage: null as File | null,
    idCardImageUrl: "", // Cloudinary URL from OCR upload
    // Step 2
    name: "",
    rollNo: "",
    department: "",
    batch: "",
    degreeProgram: "",
    campus: "",
    // Step 3
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bio: "",
    profilePicture: null as File | null,
    // Step 4
    selectedInterests: [] as string[],
    // Step 5
    lookingFor: [] as string[],
  });

  const steps = [
    { number: 1, title: "Upload ID", description: "Verify your student ID" },
    { number: 2, title: "Verify Data", description: "Confirm extracted info" },
    { number: 3, title: "Account Setup", description: "Create your account" },
    {
      number: 4,
      title: "Select Interests",
      description: "Choose your interests",
    },
    {
      number: 5,
      title: "What You're Looking For",
      description: "Set your goals",
    },
  ];

  const handleSubmit = async () => {
    try {
      // Prepare data for registration
      const registrationData = {
        name: formData.name,
        rollNo: formData.rollNo,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        department: formData.department,
        batch: formData.batch,
        degreeProgram: formData.degreeProgram,
        campus: formData.campus,
        bio: formData.bio,
        profilePicUrl: null, // TODO: Add profile pic upload in settings
        idCardImageUrl: formData.idCardImageUrl, // From Cloudinary
        interests: formData.selectedInterests,
        lookingFor: formData.lookingFor,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration successful!",
          description: "Please log in to continue.",
        });
        window.location.href = "/login";
      } else {
        toast({
          title: "Registration failed",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">
              UOSphere
            </h1>
          </Link>
          <div className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step.number < currentStep
                        ? "bg-green-500 text-white"
                        : step.number === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center mt-2 hidden md:block">
                    <p
                      className={`text-xs font-semibold ${
                        step.number <= currentStep
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-12 md:w-20 mx-2 transition-all ${
                      step.number < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>
                Step {currentStep} of {totalSteps}
              </CardTitle>
              <CardDescription>{steps[currentStep - 1].title}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <StepOneUploadID
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {currentStep === 2 && (
                <StepTwoVerifyData
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {currentStep === 3 && (
                <StepThreeAccountSetup
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {currentStep === 4 && (
                <StepFourSelectInterests
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {currentStep === 5 && (
                <StepFiveLookingFor
                  formData={formData}
                  setFormData={setFormData}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    // Validate current step before proceeding
                    if (currentStep === 1) {
                      if (!formData.idCardImage) {
                        toast({
                          title: "ID Card Required",
                          description: "Please upload your ID card to continue",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!formData.rollNo || !formData.name) {
                        toast({
                          title: "Processing",
                          description:
                            "Please wait for ID card information to be extracted",
                          variant: "destructive",
                        });
                        return;
                      }
                    } else if (currentStep === 2) {
                      if (!formData.name?.trim()) {
                        toast({
                          title: "Name Required",
                          description: "Please enter your full name",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!formData.rollNo?.trim()) {
                        toast({
                          title: "Roll Number Required",
                          description: "Please enter your roll number",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!formData.department?.trim()) {
                        toast({
                          title: "Department Required",
                          description: "Please enter your department",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!formData.batch?.trim()) {
                        toast({
                          title: "Batch Required",
                          description: "Please enter your batch",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!formData.degreeProgram?.trim()) {
                        toast({
                          title: "Degree Program Required",
                          description: "Please enter your degree program",
                          variant: "destructive",
                        });
                        return;
                      }
                    } else if (currentStep === 3) {
                      if (!formData.email?.trim()) {
                        toast({
                          title: "Email Required",
                          description: "Please enter your email address",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                        toast({
                          title: "Invalid Email",
                          description: "Please enter a valid email address",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!formData.password) {
                        toast({
                          title: "Password Required",
                          description: "Please enter a password",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (formData.password.length < 8) {
                        toast({
                          title: "Password Too Short",
                          description:
                            "Password must be at least 8 characters long",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (formData.password !== formData.confirmPassword) {
                        toast({
                          title: "Passwords Don't Match",
                          description: "Please make sure passwords match",
                          variant: "destructive",
                        });
                        return;
                      }
                    } else if (currentStep === 4) {
                      if (formData.selectedInterests.length < 3) {
                        toast({
                          title: "Select More Interests",
                          description: "Please select at least 3 interests",
                          variant: "destructive",
                        });
                        return;
                      }
                    } else if (currentStep === 5) {
                      if (formData.lookingFor.length === 0) {
                        toast({
                          title: "Selection Required",
                          description:
                            "Please select at least one option for what you're looking for",
                          variant: "destructive",
                        });
                        return;
                      }
                    }

                    if (currentStep === totalSteps) {
                      handleSubmit();
                    } else {
                      setCurrentStep(Math.min(totalSteps, currentStep + 1));
                    }
                  }}
                >
                  {currentStep === totalSteps ? "Create Account" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Step 1: Upload ID Component
interface StepProps {
  formData: any;
  setFormData: (data: any) => void;
}

function StepOneUploadID({ formData, setFormData }: StepProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const processIDCard = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // Step 1: Extract data using CLIENT-SIDE OCR (Tesseract.js)
      toast({
        title: "Processing...",
        description: "Extracting data from ID card using OCR",
      });

      const ocrResult = await extractTextFromIDCard(file, (progress) => {
        setOcrProgress(progress);
      });

      if (!ocrResult.success || !ocrResult.extractedData) {
        toast({
          title: "Extraction Failed",
          description: ocrResult.error || "Failed to extract data from ID card",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: Upload image and validate with server
      toast({
        title: "Uploading...",
        description: "Validating and uploading ID card",
      });

      const formDataToSend = new FormData();
      formDataToSend.append("idCard", file);
      formDataToSend.append(
        "extractedData",
        JSON.stringify(ocrResult.extractedData)
      );

      const response = await fetch("/api/auth/upload-id", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        // Store both the image and extracted data
        setFormData({
          ...formData,
          idCardImage: file,
          idCardImageUrl: result.data.imageUrl, // Save Cloudinary URL
          name: result.data.name,
          rollNo: result.data.rollNo,
          department: result.data.department,
          batch: result.data.batch,
          degreeProgram: result.data.degreeProgram,
        });
        toast({
          title: "Success!",
          description: `ID card data extracted successfully (${Math.round(
            ocrResult.confidence
          )}% confidence)`,
        });
      } else {
        toast({
          title: "Validation Failed",
          description: result.error || "Failed to validate ID card data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Error",
        description: "Error processing ID card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      processIDCard(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processIDCard(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Upload Your UOS Student ID Card
        </h3>
        <p className="text-sm text-gray-600">
          Take a clear photo of the front of your student ID card
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 font-semibold">
              Processing ID card...
            </p>
            {ocrProgress > 0 && (
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Extracting text: {ocrProgress}%
                </p>
              </div>
            )}
          </div>
        ) : formData.idCardImage ? (
          <div className="space-y-4">
            <img
              src={URL.createObjectURL(formData.idCardImage)}
              alt="ID Card Preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            <p className="text-sm text-gray-600">{formData.idCardImage.name}</p>
            <Button
              variant="outline"
              onClick={() => setFormData({ ...formData, idCardImage: null })}
              size="sm"
            >
              Change Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 font-semibold hover:underline">
                  Upload a file
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
              <span className="text-gray-600"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 4MB</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">Tips for best results:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            Place card on a flat surface
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            Ensure good lighting
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            All text must be clearly visible
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            Avoid glare and shadows
          </li>
        </ul>
      </div>
    </div>
  );
}

// Step 2: Verify Data Component
function StepTwoVerifyData({ formData, setFormData }: StepProps) {
  // Data should already be extracted from Step 1
  // No need for mock data anymore

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Verify Extracted Information
        </h3>
        <p className="text-sm text-gray-600">
          Please review and confirm the information extracted from your ID card
        </p>
      </div>

      {/* Extracted Data Preview */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700 mb-2">
          <Check className="w-5 h-5" />
          <span className="font-semibold">
            Information Extracted Successfully
          </span>
        </div>
        <p className="text-sm text-green-600">Confidence: 95%</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rollNo">
              Roll Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rollNo"
              value={formData.rollNo}
              onChange={(e) =>
                setFormData({ ...formData, rollNo: e.target.value })
              }
              placeholder="2K25/CSE/87"
              className="font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">
              Department <span className="text-red-500">*</span>
            </Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder="Computer Science"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch">
              Batch <span className="text-red-500">*</span>
            </Label>
            <Input
              id="batch"
              value={formData.batch}
              onChange={(e) =>
                setFormData({ ...formData, batch: e.target.value })
              }
              placeholder="2K25"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="degreeProgram">
            Degree Program <span className="text-red-500">*</span>
          </Label>
          <Input
            id="degreeProgram"
            value={formData.degreeProgram}
            onChange={(e) =>
              setFormData({ ...formData, degreeProgram: e.target.value })
            }
            placeholder="BS (Computer Science)"
            required
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          ℹ️ If any information is incorrect, you can edit it directly in the
          fields above.
        </p>
      </div>
    </div>
  );
}

// Step 3: Account Setup Component
function StepThreeAccountSetup({ formData, setFormData }: StepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Create Your Account</h3>
        <p className="text-sm text-gray-600">
          Set up your login credentials and profile information
        </p>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="your.email@example.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="03XX-XXXXXXX"
              className="pl-10"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Min. 8 characters"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Must be at least 8 characters long
          </p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Re-enter password"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {formData.password &&
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio (Optional)</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us a bit about yourself... (150 characters max)"
            maxLength={150}
            rows={3}
          />
          <p className="text-xs text-gray-500 text-right">
            {formData.bio.length}/150
          </p>
        </div>

        {/* Profile Picture */}
        <div className="space-y-2">
          <Label htmlFor="profilePic">Profile Picture (Optional)</Label>
          <div className="flex items-center gap-4">
            {formData.profilePicture ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(formData.profilePicture)}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <button
                  onClick={() =>
                    setFormData({ ...formData, profilePicture: null })
                  }
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <label htmlFor="profilePic" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Upload Photo</span>
              </div>
              <input
                id="profilePic"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFormData({ ...formData, profilePicture: file });
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Select Interests Component
function StepFourSelectInterests({ formData, setFormData }: StepProps) {
  const toggleInterest = (interest: string) => {
    const currentInterests = formData.selectedInterests;
    if (currentInterests.includes(interest)) {
      setFormData({
        ...formData,
        selectedInterests: currentInterests.filter(
          (i: string) => i !== interest
        ),
      });
    } else {
      if (currentInterests.length < 10) {
        setFormData({
          ...formData,
          selectedInterests: [...currentInterests, interest],
        });
      }
    }
  };

  const selectedCount = formData.selectedInterests.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Your Interests</h3>
        <p className="text-sm text-gray-600">
          Choose at least 3 and up to 10 interests to help us match you with
          like-minded peers
        </p>
        <div className="mt-2">
          <span
            className={`text-sm font-semibold ${
              selectedCount < 3
                ? "text-red-500"
                : selectedCount >= 10
                ? "text-orange-500"
                : "text-green-600"
            }`}
          >
            {selectedCount}/10 selected
            {selectedCount < 3 && (
              <span className="ml-2 text-red-500">(minimum 3 required)</span>
            )}
          </span>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-6 pr-2">
        {Object.entries(interestCategories).map(([category, tags]) => (
          <div key={category}>
            <h4 className="font-semibold text-sm capitalize mb-3 text-gray-700">
              {category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = formData.selectedInterests.includes(tag);
                const isDisabled = !isSelected && selectedCount >= 10;
                return (
                  <button
                    key={tag}
                    onClick={() => !isDisabled && toggleInterest(tag)}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tag} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedCount >= 3 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            ✓ Great! You've selected {selectedCount} interest
            {selectedCount > 1 ? "s" : ""}. This will help us find your perfect
            matches!
          </p>
        </div>
      )}
    </div>
  );
}

// Step 5: Looking For Component
function StepFiveLookingFor({ formData, setFormData }: StepProps) {
  const toggleLookingFor = (id: string) => {
    const current = formData.lookingFor;
    if (current.includes(id)) {
      setFormData({
        ...formData,
        lookingFor: current.filter((item: string) => item !== id),
      });
    } else {
      setFormData({
        ...formData,
        lookingFor: [...current, id],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          What Are You Looking For?
        </h3>
        <p className="text-sm text-gray-600">
          Select at least one option to help us connect you with the right
          people
        </p>
        {formData.lookingFor.length === 0 && (
          <p className="text-sm text-red-500 mt-2 font-medium">
            * Please select at least one option
          </p>
        )}
      </div>

      <div className="space-y-3">
        {lookingForOptions.map((option) => {
          const isSelected = formData.lookingFor.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleLookingFor(option.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-2xl">{option.icon}</span>
                <span
                  className={`font-medium ${
                    isSelected ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {formData.lookingFor.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            You're looking for: {formData.lookingFor.length} thing
            {formData.lookingFor.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700 font-semibold mb-2">
          🎉 Almost Done!
        </p>
        <p className="text-sm text-green-600">
          Click "Create Account" to join UOSphere and start connecting with your
          peers!
        </p>
      </div>
    </div>
  );
}
