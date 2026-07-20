import { redirect } from "next/navigation";

// /admin has no dashboard of its own — the real pages are /admin/dashboard,
// /admin/orders, etc. Without this, hitting /admin 404s under the ROOT layout,
// so the PWA install prompt there would attach the customer manifest, not the
// admin one. Redirect into the panel proper.
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
