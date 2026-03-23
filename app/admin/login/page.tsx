"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        utils.auth.me.invalidate();
        toast.success("Logged in!");
        router.push("/admin/specials");
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)",
        }}
      >
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))" }}
          >
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1
            className="text-3xl font-black"
            style={{
              fontFamily: "var(--font-bangers), 'Bangers', cursive",
              letterSpacing: "0.04em",
              color: "oklch(0.97 0.01 60)",
            }}
          >
            Admin Login
          </h1>
          <p className="text-muted-foreground text-sm mt-1">The Stoned Chef Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-foreground font-semibold text-sm">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="h-11 rounded-xl pl-9"
                style={{
                  background: "var(--color-input)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-foreground font-semibold text-sm">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl pl-9"
                style={{
                  background: "var(--color-input)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-12 font-bold rounded-xl"
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
              color: "white",
            }}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
