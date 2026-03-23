"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.subscribers.subscribe.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <section className="py-12 border-t border-border" style={{ background: "oklch(0.13 0.025 35)" }}>
        <div className="container text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.65 0.20 145)" }} />
          <p className="text-lg font-bold text-foreground">You&apos;re on the list!</p>
          <p className="text-muted-foreground text-sm mt-1">
            We&apos;ll let you know when the truck fires up for the season.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-t border-border" style={{ background: "oklch(0.13 0.025 35)" }}>
      <div className="container max-w-lg text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))" }}
        >
          <Mail className="w-6 h-6 text-white" />
        </div>
        <h2
          className="text-3xl font-black mb-2"
          style={{
            fontFamily: "var(--font-bangers), 'Bangers', cursive",
            letterSpacing: "0.04em",
            color: "oklch(0.97 0.01 60)",
          }}
        >
          Never Miss an Opening
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Get notified when we open for the season, plus exclusive deals.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) subscribe.mutate({ email });
          }}
          className="flex gap-2"
        >
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl flex-1"
            style={{
              background: "var(--color-input)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
          <Button
            type="submit"
            disabled={subscribe.isPending}
            className="h-12 px-6 rounded-xl font-bold"
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
              color: "white",
            }}
          >
            {subscribe.isPending ? "..." : "Notify Me"}
          </Button>
        </form>
      </div>
    </section>
  );
}
