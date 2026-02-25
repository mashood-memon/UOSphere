export const interestCategories: Record<string, string[]> = {
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

export const lookingForOptions = [
  { id: "study_partner", label: "Study partner for specific courses" },
  { id: "project_collab", label: "Project collaboration" },
  { id: "hobby_buddy", label: "Hobby buddy" },
  { id: "mentorship", label: "Mentorship (give or receive)" },
  { id: "competition_team", label: "Competition team members" },
  { id: "event_partner", label: "Event/club partners" },
  { id: "friends", label: "Just looking to make friends" },
];

export const categoryColors: Record<string, string> = {
  academic: "bg-blue-100 text-blue-800 border-blue-200",
  languages: "bg-purple-100 text-purple-800 border-purple-200",
  hobbies: "bg-green-100 text-green-800 border-green-200",
  sports: "bg-orange-100 text-orange-800 border-orange-200",
  activities: "bg-pink-100 text-pink-800 border-pink-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
  custom: "bg-violet-100 text-violet-800 border-violet-300",
};

export const categoryLabels: Record<string, string> = {
  academic: "Academic",
  languages: "Languages",
  hobbies: "Hobbies",
  sports: "Sports",
  activities: "Activities",
  other: "Other",
  custom: "Custom",
};

// Suggested course help tags for autocomplete hints
export const suggestedCourseHelp = [
  "Calculus",
  "Linear Algebra",
  "Data Structures",
  "Algorithms",
  "OOP",
  "Database Systems",
  "Operating Systems",
  "Computer Networks",
  "Discrete Mathematics",
  "Statistics",
  "Digital Logic Design",
  "Software Engineering",
  "Web Development",
  "Machine Learning",
  "Artificial Intelligence",
  "Physics",
  "English",
  "Technical Writing",
  "Probability",
  "Compiler Design",
];

// Get category for a given interest tag
export function getCategoryForTag(tag: string): string {
  for (const [category, tags] of Object.entries(interestCategories)) {
    if (tags.includes(tag)) return category;
  }
  return "custom";
}
