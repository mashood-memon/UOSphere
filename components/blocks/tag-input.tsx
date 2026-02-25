"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  maxTags: number;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
  colorClass?: string;
  /** Show dashed border on tags */
  dashed?: boolean;
  className?: string;
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  maxTags,
  maxLength = 50,
  placeholder = "Type and press Enter...",
  suggestions = [],
  colorClass = "bg-violet-100 text-violet-800 border-violet-300",
  dashed = false,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = input.trim();
  const isAtLimit = tags.length >= maxTags;

  // Filter suggestions that match input and aren't already added
  const filteredSuggestions =
    normalized.length >= 2
      ? suggestions.filter(
          (s) =>
            s.toLowerCase().includes(normalized.toLowerCase()) &&
            !tags.some((t) => t.toLowerCase() === s.toLowerCase()),
        )
      : [];

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.length > maxLength) return;
    // Prevent duplicates (case-insensitive)
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    if (isAtLimit) return;
    // Only allow alphanumeric, spaces, slashes, dots, hyphens, parentheses
    if (!/^[a-zA-Z0-9\s/.\-()]+$/.test(trimmed)) return;

    onAdd(trimmed);
    setInput("");
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(normalized);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isAtLimit ? `Limit reached (${maxTags})` : placeholder}
            disabled={isAtLimit}
            maxLength={maxLength}
            className="text-sm"
          />
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredSuggestions.slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => addTag(normalized)}
          disabled={isAtLimit || !normalized}
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {tags.length}/{maxTags} added
      </p>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                colorClass,
                "gap-1 pl-2.5 pr-1 py-1 text-xs font-medium",
                dashed && "border-dashed border-2",
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-0.5 hover:text-red-600 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
