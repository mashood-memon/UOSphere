"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCard } from "@/components/blocks/user-card";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserSuggestion {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  batch: string;
  batchYear: number;
  campus: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  interests: { category: string; tag: string }[];
  lookingFor: { type: string }[];
  connectionsCount: number;
  matchPercentage: number;
  sharedInterests: string[];
}

export default function HomePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const res = await fetch("/api/users/suggestions?limit=6");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(userId: string) {
    setConnectingId(userId);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (res.ok) {
        toast({
          title: "Connection request sent!",
          description: "They'll be notified of your request.",
        });
        // Remove from suggestions
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
      } else {
        const data = await res.json();
        toast({
          title: "Could not send request",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    } finally {
      setConnectingId(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover peers, build connections, and grow your network at University
          of Sindh.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/discover">
          <div className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Compass className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Discover Peers</p>
                <p className="text-sm text-muted-foreground">
                  Find students with shared interests
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/connections">
          <div className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">My Connections</p>
                <p className="text-sm text-muted-foreground">
                  View your network
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href={`/profile/${session?.user?.id}`}>
          <div className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">My Profile</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.department} · {session?.user?.batch}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Suggested Connections */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Suggested Connections</h2>
          </div>
          <Link href="/discover">
            <Button variant="ghost" size="sm" className="gap-1">
              See All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">
              Finding your best matches...
            </span>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onConnect={handleConnect}
                isConnecting={connectingId === user.id}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No suggestions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              As more students join UOSphere, you&apos;ll see personalized
              suggestions here.
            </p>
            <Link href="/discover">
              <Button>Browse All Students</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
