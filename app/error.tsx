"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "2px solid oklch(0.55 0.22 25 / 0.4)" }}
      >
        <AlertCircle className="w-8 h-8" style={{ color: "oklch(0.55 0.22 25)" }} />
      </div>
      <h1
        className="text-3xl font-black"
        style={{
          fontFamily: "var(--font-bangers), 'Bangers', cursive",
          letterSpacing: "0.04em",
          color: "oklch(0.97 0.01 60)",
        }}
      >
        Something Went Wrong
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        We hit an unexpected error. Try again, or head back to the menu.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={reset}
          className="h-12 px-6 rounded-xl font-bold"
          style={{
            background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
            color: "white",
          }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
