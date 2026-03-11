"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterestBadge } from "@/components/blocks/interest-badge";
import { MatchBadge } from "@/components/blocks/match-badge";
import {
  GraduationCap,
  BookOpen,
  UserPlus,
  Clock,
  UserCheck,
  HelpCircle,
} from "lucide-react";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    rollNo: string;
    department: string;
    batch: string;
    bio?: string | null;
    profilePicUrl?: string | null;
    interests: { category: string; tag: string }[];
    matchPercentage?: number;
    matchLabel?: string | null;
    sharedInterests?: string[];
    connectionsCount?: number;
    coursesCanHelp?: string[];
    coursesNeedHelp?: string[];
  };
  connectionStatus?: string | null;
  onConnect?: (userId: string) => void;
  isConnecting?: boolean;
  currentUserId?: string;
}

export function UserCard({
  user,
  connectionStatus,
  onConnect,
  isConnecting,
  currentUserId,
}: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOwnProfile = currentUserId === user.id;
  const visibleInterests = user.interests.slice(0, 4);
  const remainingCount = user.interests.length - 4;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/profile/${user.id}`}>
            <Avatar className="h-14 w-14 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
              {user.profilePicUrl ? (
                <AvatarImage src={user.profilePicUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/profile/${user.id}`}
                  className="font-semibold text-base hover:text-blue-600 transition-colors line-clamp-1"
                >
                  {user.name}
                </Link>
                <p className="text-sm text-muted-foreground">{user.rollNo}</p>
              </div>
              {user.matchPercentage !== undefined &&
                user.matchPercentage >= 20 &&
                !isOwnProfile && (
                  <MatchBadge
                    percentage={user.matchPercentage}
                    label={user.matchLabel}
                  />
                )}
            </div>

            {/* Department & Batch */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {user.department}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {user.batch}
              </span>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Interests */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {visibleInterests.map((interest) => (
                <InterestBadge
                  key={interest.tag}
                  tag={interest.tag}
                  category={interest.category}
                />
              ))}
              {remainingCount > 0 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{remainingCount} more
                </span>
              )}
            </div>

            {/* Shared Interests */}
            {user.sharedInterests && user.sharedInterests.length > 0 && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                {user.sharedInterests.length} shared interest
                {user.sharedInterests.length > 1 ? "s" : ""}:{" "}
                {user.sharedInterests.slice(0, 3).join(", ")}
                {user.sharedInterests.length > 3 ? "..." : ""}
              </p>
            )}

            {/* Course Help Tags */}
            {((user.coursesCanHelp && user.coursesCanHelp.length > 0) ||
              (user.coursesNeedHelp && user.coursesNeedHelp.length > 0)) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                {user.coursesCanHelp?.slice(0, 2).map((course) => (
                  <span
                    key={course}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    Can help: {course}
                  </span>
                ))}
                {user.coursesNeedHelp?.slice(0, 2).map((course) => (
                  <span
                    key={course}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    Needs: {course}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="mt-4 flex gap-2">
            {connectionStatus === "connected" ? (
              <Button variant="secondary" size="sm" className="w-full" asChild>
                <Link href={`/profile/${user.id}`}>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Connected
                </Link>
              </Button>
            ) : connectionStatus === "pending_sent" ? (
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Button>
            ) : connectionStatus === "pending_received" ? (
              <Button variant="default" size="sm" className="w-full" asChild>
                <Link href={`/profile/${user.id}`}>View Request</Link>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => onConnect?.(user.id)}
                disabled={isConnecting}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                {isConnecting ? "Sending..." : "Connect"}
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/profile/${user.id}`}>View</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
