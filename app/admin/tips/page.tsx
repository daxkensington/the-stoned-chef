"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { TipsTab } from "@/components/admin/TipsTab";

export default function AdminTipsPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <p role="status" className="p-8">Checking admin access...</p>;
  if (!isAdmin) return <div className="p-8"><p>Admin access required.</p><Link href="/admin/login">Login</Link></div>;
  return <main className="container max-w-5xl py-8"><Link className="inline-block mb-6 underline" href="/admin/dashboard">Back to dashboard</Link><TipsTab /></main>;
}
