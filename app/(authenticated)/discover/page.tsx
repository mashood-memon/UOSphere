"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import DiscoverContent from "./discover-content";

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
