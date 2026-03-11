"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterestBadge } from "@/components/blocks/interest-badge";
import { MatchBadge } from "@/components/blocks/match-badge";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Settings,
  Loader2,
  ArrowLeft,
  IdCard,
  HelpCircle,
} from "lucide-react";
import { categoryLabels, lookingForOptions } from "@/lib/constants/interests";

interface UserProfile {
  id: string;
  name: string;
  rollNo: string;
  email?: string;
  department: string;
  batch: string;
  batchYear: number;
  degreeProgram?: string | null;
  bio?: string | null;
  profilePicUrl?: string | null;
  createdAt: string;
  interests: { category: string; tag: string; isCustom: boolean }[];
  coursesCanHelp: string[];
  coursesNeedHelp: string[];
  lookingFor: { type: string }[];
  connectionsCount: number;
  connectionStatus: string | null;
  connectionId: string | null;
  matchPercentage: number;
  matchLabel: string | null;
  sharedInterests: string[];
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { data: session } = useSession();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        toast({
          title: "User not found",
          description: "This profile doesn't exist.",
          variant: "destructive",
        });
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

  async function handleConnect() {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: profile.id }),
      });

      if (res.ok) {
        toast({
          title: "Connection request sent!",
          description: `${profile.name} will be notified.`,
        });
        setProfile((prev) =>
          prev ? { ...prev, connectionStatus: "pending_sent" } : null,
        );
      } else {
        const data = await res.json();
        toast({
          title: "Could not send request",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    if (!profile?.connectionId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/connections/${profile.connectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        toast({ title: "Connection accepted!" });
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                connectionStatus: "connected",
                connectionsCount: prev.connectionsCount + 1,
              }
            : null,
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to accept request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!profile?.connectionId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/connections/${profile.connectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (res.ok) {
        toast({ title: "Connection rejected" });
        setProfile((prev) =>
          prev ? { ...prev, connectionStatus: null, connectionId: null } : null,
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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
        <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4">
          This user doesn&apos;t exist or has been removed.
        </p>
        <Link href="/discover">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Group interests by category
  const interestsByCategory: Record<
    string,
    { tag: string; isCustom: boolean }[]
  > = {};
  profile.interests.forEach((i) => {
    if (!interestsByCategory[i.category]) {
      interestsByCategory[i.category] = [];
    }
    interestsByCategory[i.category].push({ tag: i.tag, isCustom: i.isCustom });
  });

  const lookingForLabels = profile.lookingFor.map((lf) => {
    const option = lookingForOptions.find((o) => o.id === lf.type);
    return option?.label || lf.type;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Cover / Top Bar */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400" />

        <div className="px-6 pb-6">
          {/* Avatar + Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
              {profile.profilePicUrl ? (
                <AvatarImage src={profile.profilePicUrl} alt={profile.name} />
              ) : null}
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 sm:mb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                {!isOwnProfile && profile.matchPercentage >= 20 && (
                  <MatchBadge
                    percentage={profile.matchPercentage}
                    label={profile.matchLabel}
                    size="md"
                  />
                )}
              </div>
              <p className="text-muted-foreground">{profile.rollNo}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:mb-1">
              {isOwnProfile ? (
                <Link href="/profile/edit">
                  <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </Link>
              ) : profile.connectionStatus === "connected" ? (
                <Button variant="secondary" className="gap-2" disabled>
                  <UserCheck className="w-4 h-4" />
                  Connected
                </Button>
              ) : profile.connectionStatus === "pending_sent" ? (
                <Button variant="outline" className="gap-2" disabled>
                  <Clock className="w-4 h-4" />
                  Request Sent
                </Button>
              ) : profile.connectionStatus === "pending_received" ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-muted-foreground">{profile.bio}</p>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>{profile.department}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>{profile.batch}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{profile.connectionsCount} connections</span>
            </div>
            {profile.degreeProgram && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <IdCard className="w-4 h-4 text-blue-600" />
                <span>{profile.degreeProgram}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>
                Joined{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interests Section */}
      {Object.keys(interestsByCategory).length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm mt-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Interests</h2>
          <div className="space-y-4">
            {Object.entries(interestsByCategory).map(([category, tags]) => (
              <div key={category}>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryLabels[category] || category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((item) => (
                    <InterestBadge
                      key={item.tag}
                      tag={item.tag}
                      category={category}
                      size="md"
                      isCustom={item.isCustom}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Looking For Section */}
      {lookingForLabels.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm mt-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Looking For</h2>
          <div className="flex flex-wrap gap-2">
            {lookingForLabels.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="px-3 py-1.5 text-sm"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Course Help Section */}
      {(profile.coursesCanHelp?.length > 0 ||
        profile.coursesNeedHelp?.length > 0) && (
        <div className="bg-white rounded-xl border shadow-sm mt-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Course Help</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {profile.coursesCanHelp?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700">
                    Can Help With
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.coursesCanHelp.map((course) => (
                    <Badge
                      key={course}
                      variant="outline"
                      className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-800 border-emerald-300"
                    >
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.coursesNeedHelp?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-700">
                    Needs Help With
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.coursesNeedHelp.map((course) => (
                    <Badge
                      key={course}
                      variant="outline"
                      className="px-3 py-1.5 text-sm bg-amber-50 text-amber-800 border-amber-300"
                    >
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
