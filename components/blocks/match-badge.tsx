"use client";

import { cn } from "@/lib/utils";

interface MatchBadgeProps {
  percentage: number;
  label?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MatchBadge({
  percentage,
  label,
  size = "sm",
  className,
}: MatchBadgeProps) {
  // Don't render if below threshold
  if (percentage < 20) return null;

  const getColor = () => {
    if (percentage >= 80)
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (percentage >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (percentage >= 40) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getLabel = () => {
    if (label) return label;
    if (percentage >= 80) return "Excellent Match";
    if (percentage >= 60) return "Great Match";
    if (percentage >= 40) return "Good Match";
    return "Fair Match";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        getColor(),
        sizeClasses[size],
        className,
      )}
    >
      <span>{percentage}%</span>
      <span className={cn(size === "sm" ? "hidden" : "")}>{getLabel()}</span>
    </span>
  );
}
