"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserCard } from "@/components/blocks/user-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  interestCategories,
  lookingForOptions,
  categoryLabels,
  categoryColors,
} from "@/lib/constants/interests";

interface UserResult {
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

const departments = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Data Science",
  "Artificial Intelligence",
  "Electronic Engineering",
  "Telecommunication Engineering",
  "Mathematics",
  "Statistics",
  "Accounting & Finance",
  "Banking & Finance",
  "Business Administration (BBA / MBA)",
  "Commerce",
  "Economics",
  "Economics & Finance",
  "LLB",
  "LLM",
  "Doctor of Pharmacy (Pharm-D)",
  "Biotechnology",
  "Biochemistry",
  "Microbiology",
  "Genetics",
  "Public Health",
  "Nutrition & Food Sciences",
  "Medical Laboratory Technology",
  "Environmental Science",
  "Physics",
  "Chemistry",
  "Zoology",
  "Communication Design",
  "Textile Design",
  "Fine Arts",
  "Media & Communication Studies",
  "English Language and Literature",
];

const batches = ["2K22", "2K23", "2K24", "2K25", "2K26"];

const sortOptions = [
  { value: "compatible", label: "Most Compatible" },
  { value: "recent", label: "Recently Joined" },
  { value: "name", label: "Name (A-Z)" },
];

export default function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();

  // Filter state from URL
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [department, setDepartment] = useState(
    searchParams.get("department") || "",
  );
  const [batch, setBatch] = useState(searchParams.get("batch") || "");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    searchParams.get("interests")?.split(",").filter(Boolean) || [],
  );
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(
    searchParams.get("lookingFor")?.split(",").filter(Boolean) || [],
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "compatible");

  // UI state
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildSearchUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (department) params.set("department", department);
    if (batch) params.set("batch", batch);
    if (selectedInterests.length > 0)
      params.set("interests", selectedInterests.join(","));
    if (selectedLookingFor.length > 0)
      params.set("lookingFor", selectedLookingFor.join(","));
    if (sort !== "compatible") params.set("sort", sort);
    return params.toString();
  }, [query, department, batch, selectedInterests, selectedLookingFor, sort]);

  const fetchUsers = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (department) params.set("department", department);
        if (batch) params.set("batch", batch);
        if (selectedInterests.length > 0)
          params.set("interests", selectedInterests.join(","));
        if (selectedLookingFor.length > 0)
          params.set("lookingFor", selectedLookingFor.join(","));
        params.set("sort", sort);
        params.set("page", pageNum.toString());

        const res = await fetch(`/api/users/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setUsers((prev) => [...prev, ...data.users]);
          } else {
            setUsers(data.users);
          }
          setHasMore(data.pagination.hasMore);
          setTotalCount(data.pagination.totalCount);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, department, batch, selectedInterests, selectedLookingFor, sort],
  );

  // Run search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
      // Update URL without triggering navigation
      const searchStr = buildSearchUrl();
      router.replace(`/discover${searchStr ? `?${searchStr}` : ""}`, {
        scroll: false,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, department, batch, selectedInterests, selectedLookingFor, sort]);

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
        // Remove from list
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotalCount((prev) => prev - 1);
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
        description: "Failed to send connection request.",
        variant: "destructive",
      });
    } finally {
      setConnectingId(null);
    }
  }

  function toggleInterest(tag: string) {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function toggleLookingFor(type: string) {
    setSelectedLookingFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function clearFilters() {
    setQuery("");
    setDepartment("");
    setBatch("");
    setSelectedInterests([]);
    setSelectedLookingFor([]);
    setSort("compatible");
  }

  const hasActiveFilters =
    query ||
    department ||
    batch ||
    selectedInterests.length > 0 ||
    selectedLookingFor.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-muted-foreground mt-1">
          Find students who share your interests and goals
        </p>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant={filtersOpen ? "secondary" : "outline"}
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                !
              </Badge>
            )}
            {filtersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 space-y-5">
          {/* Department & Batch Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Looking For */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Looking For
            </label>
            <div className="flex flex-wrap gap-2">
              {lookingForOptions.map((opt) => (
                <Badge
                  key={opt.id}
                  variant={
                    selectedLookingFor.includes(opt.id) ? "default" : "outline"
                  }
                  className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1"
                  onClick={() => toggleLookingFor(opt.id)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-medium mb-2 block">Interests</label>
            <div className="space-y-3">
              {Object.entries(interestCategories).map(([category, tags]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {categoryLabels[category]}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedInterests.includes(tag)
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer hover:opacity-80 transition-opacity text-xs px-2 py-0.5 ${
                          selectedInterests.includes(tag)
                            ? ""
                            : categoryColors[category] || ""
                        }`}
                        onClick={() => toggleInterest(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Filters & Clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex flex-wrap gap-1.5">
                {department && (
                  <Badge variant="secondary" className="gap-1">
                    Dept: {department}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setDepartment("")}
                    />
                  </Badge>
                )}
                {batch && (
                  <Badge variant="secondary" className="gap-1">
                    Batch: {batch}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setBatch("")}
                    />
                  </Badge>
                )}
                {selectedInterests.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleInterest(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            "Searching..."
          ) : (
            <>
              <span className="font-semibold text-foreground">
                {totalCount}
              </span>{" "}
              student{totalCount !== 1 ? "s" : ""} found
            </>
          )}
        </p>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-muted-foreground">
            Searching students...
          </span>
        </div>
      ) : users.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onConnect={handleConnect}
                isConnecting={connectingId === user.id}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => fetchUsers(page + 1, true)}
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No students found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or search query.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
