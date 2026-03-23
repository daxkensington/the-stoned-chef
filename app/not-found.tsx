"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-6xl">🍔</div>
      <h1
        className="text-5xl font-black"
        style={{
          fontFamily: "var(--font-bangers), 'Bangers', cursive",
          letterSpacing: "0.04em",
          color: "oklch(0.70 0.20 45)",
        }}
      >
        404
      </h1>
      <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Looks like this page got lost on the way to the chip truck. Head back to the menu!
      </p>
      <Button
        onClick={() => router.push("/")}
        className="h-12 px-6 rounded-xl font-bold"
        style={{
          background: "linear-gradient(135deg, oklch(0.58 0.24 30) 0%, oklch(0.65 0.22 45) 100%)",
          color: "white",
        }}
      >
        <Home className="w-4 h-4 mr-2" />
        Back to Menu
      </Button>
    </div>
  );
}
