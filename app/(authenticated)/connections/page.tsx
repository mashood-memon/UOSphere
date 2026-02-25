"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterestBadge } from "@/components/blocks/interest-badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Loader2,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionUser {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  batch: string;
  profilePicUrl: string | null;
  interests: { category: string; tag: string }[];
}

interface ConnectionItem {
  connectionId: string;
  status: string;
  createdAt: string;
  senderId: string;
  user: ConnectionUser;
}

type TabType = "accepted" | "pending_received" | "pending_sent";

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("accepted");
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [activeTab]);

  async function fetchConnections() {
    setLoading(true);
    try {
      let url = "/api/connections?";
      if (activeTab === "accepted") {
        url += "status=accepted&type=all";
      } else if (activeTab === "pending_received") {
        url += "status=pending&type=received";
      } else {
        url += "status=pending&type=sent";
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(connectionId: string) {
    setActionLoadingId(connectionId);
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        toast({ title: "Connection accepted!" });
        setConnections((prev) =>
          prev.filter((c) => c.connectionId !== connectionId),
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to accept.",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(connectionId: string) {
    setActionLoadingId(connectionId);
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (res.ok) {
        toast({ title: "Connection rejected" });
        setConnections((prev) =>
          prev.filter((c) => c.connectionId !== connectionId),
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject.",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRemove(connectionId: string) {
    setActionLoadingId(connectionId);
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Connection removed" });
        setConnections((prev) =>
          prev.filter((c) => c.connectionId !== connectionId),
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove.",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  const tabs = [
    {
      key: "accepted" as TabType,
      label: "My Connections",
      icon: UserCheck,
    },
    {
      key: "pending_received" as TabType,
      label: "Requests",
      icon: UserPlus,
    },
    {
      key: "pending_sent" as TabType,
      label: "Sent",
      icon: Clock,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Connections</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Connection List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => {
            const user = conn.user;
            const initials = user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={conn.connectionId}
                className="bg-white rounded-lg border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <Link href={`/profile/${user.id}`}>
                  <Avatar className="h-12 w-12">
                    {user.profilePicUrl ? (
                      <AvatarImage src={user.profilePicUrl} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${user.id}`}
                    className="font-semibold hover:text-blue-600 transition-colors"
                  >
                    {user.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {user.rollNo} · {user.department} · {user.batch}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {user.interests.slice(0, 3).map((i) => (
                      <InterestBadge
                        key={i.tag}
                        tag={i.tag}
                        category={i.category}
                      />
                    ))}
                    {user.interests.length > 3 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{user.interests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {activeTab === "pending_received" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(conn.connectionId)}
                        disabled={actionLoadingId === conn.connectionId}
                      >
                        {actionLoadingId === conn.connectionId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(conn.connectionId)}
                        disabled={actionLoadingId === conn.connectionId}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {activeTab === "accepted" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemove(conn.connectionId)}
                      disabled={actionLoadingId === conn.connectionId}
                    >
                      {actionLoadingId === conn.connectionId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {activeTab === "pending_sent" && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">
            {activeTab === "accepted"
              ? "No connections yet"
              : activeTab === "pending_received"
                ? "No pending requests"
                : "No sent requests"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === "accepted"
              ? "Start discovering and connecting with fellow students!"
              : activeTab === "pending_received"
                ? "When someone sends you a connection request, it'll appear here."
                : "Connection requests you've sent will appear here."}
          </p>
          {activeTab === "accepted" && (
            <Link href="/discover">
              <Button>Discover Students</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
