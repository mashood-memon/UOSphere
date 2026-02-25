"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  interestCategories,
  lookingForOptions,
  categoryLabels,
  categoryColors,
} from "@/lib/constants/interests";
import {
  Camera,
  Loader2,
  Save,
  ArrowLeft,
  X,
  Plus,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { TagInput } from "@/components/blocks/tag-input";

interface UserProfile {
  id: string;
  name: string;
  rollNo: string;
  email: string | null;
  department: string;
  batch: string;
  batchYear: number;
  degreeProgram: string | null;
  campus: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  interests: { category: string; tag: string; isCustom: boolean }[];
  lookingFor: { type: string }[];
  coursesCanHelp: string[];
  coursesNeedHelp: string[];
}

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Editable fields
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<
    { category: string; tag: string; isCustom: boolean }[]
  >([]);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [coursesCanHelp, setCoursesCanHelp] = useState<string[]>([]);
  const [coursesNeedHelp, setCoursesNeedHelp] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setBio(data.bio || "");
        setSelectedInterests(data.interests || []);
        setSelectedLookingFor(
          data.lookingFor?.map((lf: { type: string }) => lf.type) || [],
        );
        setProfilePicUrl(data.profilePicUrl);
        setCoursesCanHelp(data.coursesCanHelp || []);
        setCoursesNeedHelp(data.coursesNeedHelp || []);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadPic(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, and WebP are allowed.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum 5MB allowed.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/users/upload-profile-pic", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfilePicUrl(data.url);
        toast({ title: "Profile picture updated!" });
      } else {
        const data = await res.json();
        toast({
          title: "Upload failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploadingPic(false);
    }
  }

  function toggleInterest(category: string, tag: string) {
    setSelectedInterests((prev) => {
      const exists = prev.some((i) => i.tag === tag);
      if (exists) {
        return prev.filter((i) => i.tag !== tag);
      }
      if (prev.length >= 10) {
        toast({
          title: "Maximum 10 interests",
          description: "Remove one before adding another.",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, { category, tag, isCustom: false }];
    });
  }

  function addCustomInterest(tag: string) {
    setSelectedInterests((prev) => {
      if (prev.length >= 10) {
        toast({
          title: "Maximum 10 interests",
          description: "Remove one before adding another.",
          variant: "destructive",
        });
        return prev;
      }
      if (prev.some((i) => i.tag.toLowerCase() === tag.toLowerCase())) {
        toast({
          title: "Already added",
          description: `"${tag}" is already in your interests.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, { category: "custom", tag, isCustom: true }];
    });
  }

  function removeCustomInterest(tag: string) {
    setSelectedInterests((prev) => prev.filter((i) => i.tag !== tag));
  }

  function toggleLookingFor(type: string) {
    setSelectedLookingFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSave() {
    if (selectedInterests.length < 3) {
      toast({
        title: "Select at least 3 interests",
        description: "You need a minimum of 3 interests.",
        variant: "destructive",
      });
      return;
    }

    if (bio.length > 150) {
      toast({
        title: "Bio too long",
        description: "Maximum 150 characters.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          profilePicUrl,
          interests: selectedInterests,
          lookingFor: selectedLookingFor,
          coursesCanHelp,
          coursesNeedHelp,
        }),
      });

      if (res.ok) {
        toast({ title: "Profile updated!" });
        router.push(`/profile/${session?.user?.id}`);
      } else {
        const data = await res.json();
        toast({
          title: "Failed to save",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Failed to load profile.</p>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <div className="space-y-8">
        {/* Profile Picture */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {profilePicUrl ? (
                  <AvatarImage src={profilePicUrl} alt={profile.name} />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploadingPic ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleUploadPic}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-sm text-muted-foreground">
                {profile.rollNo} · {profile.department}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Bio</h2>
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              placeholder="Tell others about yourself..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/150
            </p>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Interests</h2>
            <Badge variant="outline">
              {selectedInterests.length}/10 selected (min 3)
            </Badge>
          </div>

          {/* Selected Interests */}
          {selectedInterests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
              {selectedInterests.map((i) => (
                <Badge
                  key={i.tag}
                  variant="secondary"
                  className={`gap-1 pl-2.5 ${i.isCustom ? "border-dashed border-2 border-violet-300 bg-violet-50 text-violet-800" : ""}`}
                >
                  {i.tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() =>
                      i.isCustom
                        ? removeCustomInterest(i.tag)
                        : toggleInterest(i.category, i.tag)
                    }
                  />
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(interestCategories).map(([category, tags]) => (
              <div key={category}>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryLabels[category]}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = selectedInterests.some(
                      (i) => i.tag === tag,
                    );
                    return (
                      <Badge
                        key={tag}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer hover:opacity-80 transition-opacity text-xs px-2.5 py-1 ${
                          !isSelected ? categoryColors[category] || "" : ""
                        }`}
                        onClick={() => toggleInterest(category, tag)}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Interests */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Custom Interests
              </p>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-dashed border-violet-300 text-violet-600"
              >
                Custom
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Can&apos;t find your interest above? Add your own (counts toward
              your 10 total).
            </p>
            <TagInput
              tags={selectedInterests
                .filter((i) => i.isCustom)
                .map((i) => i.tag)}
              onAdd={addCustomInterest}
              onRemove={removeCustomInterest}
              maxTags={Math.max(
                0,
                10 - selectedInterests.filter((i) => !i.isCustom).length,
              )}
              placeholder="e.g., philosophy, literature, film-making..."
              colorClass="bg-violet-100 text-violet-800 border-violet-300"
              dashed
            />
          </div>
        </div>

        {/* Looking For */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Looking For</h2>
          <div className="space-y-2">
            {lookingForOptions.map((opt) => {
              const isSelected = selectedLookingFor.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleLookingFor(opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course Help */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Course Help</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Share what you can teach and what you need help with.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Can Help With */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">
                  I Can Help With
                </p>
              </div>
              <TagInput
                tags={coursesCanHelp}
                onAdd={(tag) => setCoursesCanHelp((prev) => [...prev, tag])}
                onRemove={(tag) =>
                  setCoursesCanHelp((prev) => prev.filter((t) => t !== tag))
                }
                maxTags={10}
                placeholder="e.g., Calculus, DSA, Linear Algebra..."
                colorClass="bg-emerald-100 text-emerald-800 border-emerald-300"
              />
            </div>

            {/* Need Help With */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-700">
                  I Need Help With
                </p>
              </div>
              <TagInput
                tags={coursesNeedHelp}
                onAdd={(tag) => setCoursesNeedHelp((prev) => [...prev, tag])}
                onRemove={(tag) =>
                  setCoursesNeedHelp((prev) => prev.filter((t) => t !== tag))
                }
                maxTags={10}
                placeholder="e.g., Organic Chemistry, Statistics..."
                colorClass="bg-amber-100 text-amber-800 border-amber-300"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
