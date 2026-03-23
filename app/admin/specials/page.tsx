"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Flame,
  ArrowLeft,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type SpecialForm = {
  title: string;
  description: string;
  priceCents: string;
  badge: string;
  active: boolean;
  expiresAt: string;
};

const BADGE_PRESETS = [
  "Today Only",
  "Weekend Special",
  "Limited Time",
  "Chef's Pick",
  "New Item",
  "Fan Favourite",
];

const emptyForm = (): SpecialForm => ({
  title: "",
  description: "",
  priceCents: "",
  badge: "",
  active: true,
  expiresAt: "",
});

export default function AdminSpecialsPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: specials, isLoading } = trpc.specials.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  const createMutation = trpc.specials.create.useMutation({
    onSuccess: () => {
      utils.specials.listAll.invalidate();
      utils.specials.list.invalidate();
      toast.success("Special created!");
      setShowForm(false);
      setForm(emptyForm());
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.specials.update.useMutation({
    onSuccess: () => {
      utils.specials.listAll.invalidate();
      utils.specials.list.invalidate();
      toast.success("Special updated!");
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.specials.delete.useMutation({
    onSuccess: () => {
      utils.specials.listAll.invalidate();
      utils.specials.list.invalidate();
      toast.success("Special deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SpecialForm>(emptyForm());

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-background)" }}
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You must be an admin to view this page.</p>
          <Button onClick={() => router.push("/admin/login")}>Login</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = form.priceCents ? Math.round(parseFloat(form.priceCents) * 100) : null;
    const payload = {
      title: form.title,
      description: form.description || undefined,
      priceCents: priceCents ?? undefined,
      badge: form.badge || undefined,
      active: form.active,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      sortOrder: 0,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (special: NonNullable<typeof specials>[number]) => {
    setEditingId(special.id);
    setForm({
      title: special.title,
      description: special.description ?? "",
      priceCents: special.priceCents ? String(special.priceCents / 100) : "",
      badge: special.badge ?? "",
      active: special.active,
      expiresAt: special.expiresAt
        ? new Date(special.expiresAt).toISOString().slice(0, 10)
        : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = (special: NonNullable<typeof specials>[number]) => {
    updateMutation.mutate({ id: special.id, active: !special.active });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const fieldStyle = {
    background: "oklch(0.18 0.02 30)",
    border: "1px solid oklch(0.30 0.02 30)",
    color: "oklch(0.97 0.01 60)",
    borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div
        className="sticky top-0 z-40 border-b border-border"
        style={{ background: "oklch(0.12 0.02 30 / 0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
              style={{ color: "oklch(0.65 0.04 60)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Site
            </button>
            <span style={{ color: "oklch(0.35 0.02 30)" }}>|</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: "oklch(0.70 0.20 45)" }} />
              <span
                className="font-black text-lg"
                style={{
                  fontFamily: "var(--font-bangers), 'Bangers', cursive",
                  letterSpacing: "0.04em",
                  color: "oklch(0.97 0.01 60)",
                }}
              >
                Manage Specials
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm());
            }}
            style={{
              background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
              color: "white",
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Special
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-3xl">
        {showForm && (
          <div
            className="rounded-2xl p-6 mb-8"
            style={{
              background: "oklch(0.16 0.02 30)",
              border: "1px solid oklch(0.62 0.22 38 / 0.35)",
              boxShadow: "0 4px 24px oklch(0 0 0 / 0.3)",
            }}
          >
            <h3
              className="text-2xl font-black mb-5"
              style={{
                fontFamily: "var(--font-bangers), 'Bangers', cursive",
                letterSpacing: "0.04em",
                color: "oklch(0.97 0.01 60)",
              }}
            >
              {editingId !== null ? "Edit Special" : "New Special"}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.70 0.04 60)" }}>
                  Title *
                </label>
                <input
                  required
                  style={fieldStyle}
                  placeholder="e.g. Pulled Pork Poutine Special"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.70 0.04 60)" }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  style={{ ...fieldStyle, resize: "vertical" as const }}
                  placeholder="Describe what makes this special..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.70 0.04 60)" }}>
                    Price ($CAD) — leave blank for &quot;Ask us!&quot;
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    style={fieldStyle}
                    placeholder="e.g. 14.99"
                    value={form.priceCents}
                    onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.70 0.04 60)" }}>
                    Badge Label
                  </label>
                  <input
                    list="badge-presets"
                    style={fieldStyle}
                    placeholder="e.g. Today Only"
                    value={form.badge}
                    onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  />
                  <datalist id="badge-presets">
                    {BADGE_PRESETS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.70 0.04 60)" }}>
                    Expires On — leave blank for no expiry
                  </label>
                  <input
                    type="date"
                    style={fieldStyle}
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "oklch(0.70 0.04 60)" }}>
                    Status
                  </label>
                  <div className="flex gap-2 mt-1">
                    {[true, false].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, active: val }))}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                        style={
                          form.active === val
                            ? {
                                background: val
                                  ? "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))"
                                  : "oklch(0.35 0.02 30)",
                                color: "white",
                              }
                            : {
                                background: "oklch(0.22 0.02 30)",
                                color: "oklch(0.60 0.04 60)",
                                border: "1px solid oklch(0.30 0.02 30)",
                              }
                        }
                      >
                        {val ? "Active" : "Hidden"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
                    color: "white",
                  }}
                >
                  {editingId !== null ? "Save Changes" : "Create Special"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelForm}
                  style={{
                    background: "oklch(0.20 0.02 30)",
                    color: "oklch(0.75 0.04 60)",
                    border: "1px solid oklch(0.30 0.02 30)",
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading specials...</p>
        ) : !specials || specials.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "oklch(0.16 0.02 30)", border: "1px dashed oklch(0.30 0.02 30)" }}
          >
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.45 0.04 60)" }} />
            <p className="font-bold text-lg mb-1" style={{ color: "oklch(0.97 0.01 60)" }}>
              No specials yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first daily special or limited-time offer.
            </p>
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              style={{
                background: "linear-gradient(135deg, oklch(0.58 0.24 30), oklch(0.68 0.22 45))",
                color: "white",
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Special
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {specials.map((special) => (
              <div
                key={special.id}
                className="rounded-2xl p-4 flex items-start gap-4 transition-all"
                style={{
                  background: "oklch(0.16 0.02 30)",
                  border: `1px solid ${special.active ? "oklch(0.62 0.22 38 / 0.25)" : "oklch(0.25 0.02 30)"}`,
                  opacity: special.active ? 1 : 0.6,
                }}
              >
                <button
                  onClick={() => toggleActive(special)}
                  className="mt-0.5 flex-shrink-0 transition-colors"
                  title={special.active ? "Click to hide" : "Click to show"}
                  style={{
                    color: special.active ? "oklch(0.70 0.20 45)" : "oklch(0.45 0.04 60)",
                  }}
                >
                  {special.active ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-base" style={{ color: "oklch(0.97 0.01 60)" }}>
                      {special.title}
                    </span>
                    {special.badge && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.62 0.22 38 / 0.18)",
                          color: "oklch(0.82 0.16 48)",
                          border: "1px solid oklch(0.62 0.22 38 / 0.35)",
                        }}
                      >
                        <Flame className="w-2.5 h-2.5 inline mr-0.5" />
                        {special.badge}
                      </span>
                    )}
                    {!special.active && (
                      <span className="text-xs text-muted-foreground">(hidden)</span>
                    )}
                  </div>
                  {special.description && (
                    <p className="text-sm text-muted-foreground truncate">{special.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="font-black text-lg"
                      style={{
                        fontFamily: "var(--font-bangers), 'Bangers', cursive",
                        color: "oklch(0.70 0.20 45)",
                      }}
                    >
                      {special.priceCents
                        ? `$${(special.priceCents / 100).toFixed(2)}`
                        : "Ask us!"}
                    </span>
                    {special.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        Expires{" "}
                        {new Date(special.expiresAt).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(special)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: "oklch(0.65 0.04 60)" }}
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${special.title}"?`))
                        deleteMutation.mutate({ id: special.id });
                    }}
                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: "oklch(0.55 0.18 25)" }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
