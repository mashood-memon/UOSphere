"use client";

import { Badge } from "@/components/ui/badge";
import { getCategoryForTag, categoryColors } from "@/lib/constants/interests";
import { cn } from "@/lib/utils";

interface InterestBadgeProps {
  tag: string;
  category?: string;
  isCustom?: boolean;
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
}

export function InterestBadge({
  tag,
  category,
  isCustom = false,
  size = "sm",
  removable = false,
  onRemove,
}: InterestBadgeProps) {
  const resolvedCategory = category || getCategoryForTag(tag);
  const colorClasses = categoryColors[resolvedCategory] || categoryColors.other;

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClasses,
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
        "font-medium",
        isCustom && "border-dashed border-2",
        removable && "pr-1",
      )}
    >
      {tag}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-red-600 transition-colors"
          aria-label={`Remove ${tag}`}
        >
          ×
        </button>
      )}
    </Badge>
  );
}
