/**
 * fraudCore — the fleet's shared checkout screen. ZERO dependencies, ZERO I/O.
 *
 * This file is byte-identical in every storefront repo (Mohawk `lib/`, Spirit
 * Fire `server/_core/`, Golden Climax, NorthLucid, Boreal, 7OH, Stoned Chef).
 * The stores run three different ORMs — Prisma/Postgres, Drizzle/MySQL,
 * mysql2/MariaDB — so nothing that touches a database can be shared. What CAN
 * be shared is the part that was actually getting the decisions wrong:
 * normalizing an identity, and deciding on it. Each repo supplies its own thin
 * adapter that reads its own tables and calls `decide()`.
 *
 * -- Posture (Ian's call, 2026-08-23) ---------------------------------------
 * Hard-block PROVEN identities only. Everything else stays open until three
 * card declines in 24h from one phone, and even then only the CARD rail closes
 * — e-Transfer keeps working. That asymmetry is deliberate: e-Transfer is 73%
 * of Spirit Fire's paid volume, and a first-try card decline on the MXN
 * presentment rail is an ordinary event for a real Canadian customer, not a
 * signal. A guard that locks a real shopper out of every payment method costs
 * more than the fraud it stops.
 *
 * -- What the real attacks taught us ---------------------------------------
 * Spirit Fire, Jun–Jul 2026, $13,403.44 declined across 5 orders:
 *   jlaganiere4@gmail.com     -. TWO different mailboxes — no amount of
 *   jlaganiere1979@gmail.com  -' email canonicalization joins them...
 *   ...but BOTH used phone 2633846744.        => phone is the join key.
 *   Address written "6880 Boulevard Gouin Est #307" one time and
 *   "6880 Boulevard Gouin Est APP #307" the next. => normalize street+unit.
 * Same store, card testing 2026-06-26 00:32->01:09, 6 orders escalating $1->$25:
 *   michael.loverso@gmail.com / 5149164096, shipping to Montréal on some
 *   attempts and LAVAL on others.            => address alone cannot catch it;
 *                                               the phone-keyed decline cap can.
 * Mohawk, Aug 2026: a banned buyer returned via `+tag` and dot aliases on a
 * Gmail address.                             => canonicalize BOTH sides.
 */

/** Case/accent/punctuation-insensitive token form. "Boulevard Gouin-Est" -> "boulevard gouin est". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Gmail treats dots as nothing and every major provider treats `+tag` as the
 * same mailbox, so `didier.sanz04@gmail.com` and `didiersanz04+shop@gmail.com`
 * are one inbox. Compare canonical forms on BOTH sides — the blocklist and the
 * checkout input — or the block is one keystroke deep.
 */
export function normalizeEmail(raw: string | null | undefined): string {
  const e = String(raw || "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
    domain = "gmail.com";
  }
  return `${local}@${domain}`;
}

export function digitsOnly(phone: string | null | undefined): string {
  return String(phone || "").replace(/\D/g, "");
}

/** Last 10 digits, so +1 / 1- / spacing variants of one number collapse together. */
export function last10Digits(phone: string | null | undefined): string | null {
  const d = digitsOnly(phone);
  if (d.length < 10) return null;
  return d.slice(-10);
}

/**
 * "APP #307", "Apt 307", "unit 307", "#307" -> "307".
 *
 * 🔴 The `#` must be read off the RAW string, before folding. `fold()` strips
 * every non-alphanumeric, so by the time a `#`-anchored regex ran, the `#` was
 * already gone — and a bare "6880 Boulevard Gouin Est #307" (no "Apt"/"APP"
 * keyword) yielded NO unit. That is the exact first spelling the Laganiere
 * orders used for 4 of their 5 attempts, $11,597.62 of the $13,403.44: it
 * produced a different address key from the "APP #307" spelling on the fifth,
 * so the two never grouped as one address. Inherited from Mohawk, which has the
 * same defect and needs the same fix.
 */
export function extractUnit(
  street1: string | null | undefined,
  street2?: string | null,
): string {
  const raw = `${street1 || ""} ${street2 || ""}`;
  const hash = raw.match(/#\s*([A-Za-z0-9]+)/);
  if (hash) return hash[1].toLowerCase();
  const blob = fold(raw);
  const m = blob.match(/\b(?:apt|app|apartment|unit|suite|ste)\s*([a-z0-9]+)\b/);
  return m ? m[1] : "";
}

/** House: "8635 24e|h1z3z5". Apartment: "6880 boulevard|307|h1g6l8". */
export function addressKey(
  street1: string | null | undefined,
  postcode?: string | null,
  street2?: string | null,
): string {
  const parts = fold(String(street1 || "")).split(" ").filter(Boolean);
  if (parts.length < 2) return "";
  const street = `${parts[0]} ${parts[1]}`;
  const unit = extractUnit(street1, street2);
  const postal = fold(String(postcode || "")).replace(/\s/g, "");
  if (unit && postal) return `${street}|${unit}|${postal}`;
  if (unit) return `${street}|${unit}`;
  return postal ? `${street}|${postal}` : street;
}

/** One postal address as the caller's store recorded it. */
export interface AddressInput {
  line1?: string | null;
  line2?: string | null;
  postcode?: string | null;
}

/** A checkout attempt, normalized by the per-repo adapter out of its own shape. */
export interface IdentityInput {
  email?: string | null;
  phone?: string | null;
  /** Every address on the attempt — billing AND shipping. Order irrelevant. */
  addresses?: Array<AddressInput | null | undefined>;
}

export interface BlockedAddress {
  /** First two folded street tokens, e.g. "6880 boulevard". */
  street: string;
  /** When set, the unit must match too — a whole building is never blocked. */
  unit?: string;
  /** Free-text provenance, surfaced in logs and admin. */
  note?: string;
}

/**
 * Proven identities, fleet-wide. An actor barred from one store walks straight
 * to the next one otherwise — the stores share a region, a card rail and a
 * playbook, so they share this list.
 *
 * Entries stay canonical: run every email through `normalizeEmail` and every
 * phone through `last10Digits` before adding it.
 */
export const BLOCKED_EMAILS: ReadonlySet<string> = new Set(
  [
    // Mohawk — Montréal card-testing ring, tagged `fraud-ring-h1z-2026-08`.
    "didiersanz04@gmail.com",
    "marco_0235@outlook.com",
    "brunoskz2000@gmail.com",
    "salimswisss@gmail.com",
    "simontremblay2024@gmail.com",
    // Spirit Fire — $13,403.44 declined, Jun 27 -> Jul 16 2026. Two mailboxes, one phone.
    "jlaganiere4@gmail.com",
    "jlaganiere1979@gmail.com",
    // Spirit Fire — card testing $1 -> $25 in 37 minutes, 2026-06-26.
    "michael.loverso@gmail.com",
  ].map(normalizeEmail),
);

export const BLOCKED_PHONES: ReadonlySet<string> = new Set(
  [
    "4386013775", // Mohawk ring
    "4388129108", // Mohawk ring
    "2633846744", // Spirit Fire — Laganiere, spans BOTH mailboxes
    "5149164096", // Spirit Fire — Lo Verso card testing, spans Montréal + Laval
  ].map((p) => last10Digits(p) || p),
);

export const BLOCKED_ADDRESSES: readonly BlockedAddress[] = [
  { street: "8635 24e", note: "Mohawk ring — civic house" },
  { street: "8581 pie", unit: "101", note: "Mohawk ring — apartment" },
  { street: "6880 boulevard", unit: "307", note: "Spirit Fire — Laganiere, $13.4K declined" },
];

/**
 * Three declines from one phone in a day is testing. Two is still a real
 * customer whose Canadian issuer bounced the MXN presentment once, then again.
 */
export const CARD_FAIL_CAP_24H = 3;

/**
 * Payment methods that are the CARD rail, i.e. what the decline cap closes.
 *
 * Every spelling in the fleet's data belongs here, because the cap is only as
 * good as its rail detection:
 *  - `credit_card` AND `credit-card` both exist in Spirit Fire's orders table,
 *    so an exact-match check misses one of them.
 *  - Mohawk runs a SECOND card gateway under `paygobillingcc`, which contains
 *    neither "card" nor any obvious card token — its own checkout route treats
 *    it as a card rail, and so must this. A hardcoded
 *    `paymentMethod !== "credit_card"` let card testing through it untouched.
 */
const CARD_METHODS = new Set([
  "card",
  "credit_card",
  "credit-card",
  "creditcard",
  "bluepeak",
  "digipay",
  "pcivault",
  "paygobillingcc",
  "paygo",
]);

export function isCardMethod(paymentMethod: string | null | undefined): boolean {
  const m = fold(String(paymentMethod || "")).replace(/ /g, "_");
  return CARD_METHODS.has(m) || m.includes("card") || m.startsWith("paygo");
}

/**
 * A blocked apartment must match the UNIT, not merely contain its digits.
 * `blob.includes("101")` also matched Apt 1012 and Unit 2101 — real neighbours,
 * hard-blocked on every payment rail. Prefer the parsed unit; fall back to a
 * whole-token match so "8581 Pie-IX 101" (no "Apt") still lands.
 */
function unitMatches(candidate: { blob: string; unit: string }, unit: string): boolean {
  if (candidate.unit) return candidate.unit === unit;
  return new RegExp(`(?:^| )${unit}(?: |$)`).test(candidate.blob);
}

/**
 * Each address is screened on its own, WITH its own unit. Billing and shipping
 * must never be folded into one blob: the unit test then matches a number that
 * came from the other address entirely.
 */
function addressCandidates(input: IdentityInput): Array<{ blob: string; unit: string }> {
  const out: Array<{ blob: string; unit: string }> = [];
  for (const a of input.addresses || []) {
    const l1 = String(a?.line1 || "");
    const l2 = String(a?.line2 || "");
    if (!l1 && !l2) continue;
    out.push({ blob: fold(`${l1} ${l2}`), unit: extractUnit(l1, l2) });
  }
  return out;
}

/** Every canonical key on this attempt — what an adapter looks up in its own tables. */
export function identityKeys(input: IdentityInput): {
  email: string;
  phones: string[];
  addressKeys: string[];
} {
  const phones = new Set<string>();
  const p = last10Digits(input.phone);
  if (p) phones.add(p);
  const addressKeys = new Set<string>();
  for (const a of input.addresses || []) {
    const k = addressKey(a?.line1, a?.postcode, a?.line2);
    if (k) addressKeys.add(k);
  }
  return {
    email: normalizeEmail(input.email),
    phones: [...phones],
    addressKeys: [...addressKeys],
  };
}

/** Why a checkout was refused — carried into logs, alerts and admin. */
export type BlockReason =
  | "static_blocklist_email"
  | "static_blocklist_phone"
  | "static_blocklist_address"
  | "staff_tagged_fraud"
  | "card_decline_cap";

export type Screen =
  | { action: "allow" }
  | { action: "hard_block"; reason: BlockReason; detail?: string }
  /** Card refused, every other rail (e-Transfer, BTC) still open. */
  | { action: "card_blocked"; reason: BlockReason; fails: number };

/** Pure static-list check. No I/O — safe to call anywhere, including a client bundle. */
export function screenStatic(input: IdentityInput): Screen {
  const email = normalizeEmail(input.email);
  if (email && BLOCKED_EMAILS.has(email)) {
    return { action: "hard_block", reason: "static_blocklist_email", detail: email };
  }

  const phone = last10Digits(input.phone);
  if (phone && BLOCKED_PHONES.has(phone)) {
    return { action: "hard_block", reason: "static_blocklist_phone", detail: phone };
  }

  const candidates = addressCandidates(input);
  for (const blocked of BLOCKED_ADDRESSES) {
    const hit = candidates.some(
      (c) => c.blob.includes(blocked.street) && (!blocked.unit || unitMatches(c, blocked.unit)),
    );
    if (hit) {
      return {
        action: "hard_block",
        reason: "static_blocklist_address",
        detail: blocked.unit ? `${blocked.street} #${blocked.unit}` : blocked.street,
      };
    }
  }

  return { action: "allow" };
}

/** What the per-repo adapter must fetch from its own database. */
export interface Signals {
  /** Staff tagged this customer chargeback/fraud in admin. */
  taggedFraud?: boolean;
  /** Failed CARD orders in the last 24h keyed on this attempt's phone. */
  cardFails24h?: number;
  /** The rail the customer is trying to pay on. */
  paymentMethod?: string | null;
}

/**
 * The whole decision, in one pure function. Static list first, then staff tags,
 * then the card cap — the cap is last because it must never upgrade itself into
 * a hard block: a real shopper who burned three declines still has e-Transfer.
 */
export function decide(input: IdentityInput, signals: Signals = {}): Screen {
  const stat = screenStatic(input);
  if (stat.action !== "allow") return stat;

  if (signals.taggedFraud) {
    return { action: "hard_block", reason: "staff_tagged_fraud" };
  }

  const fails = signals.cardFails24h ?? 0;
  if (fails >= CARD_FAIL_CAP_24H && isCardMethod(signals.paymentMethod)) {
    return { action: "card_blocked", reason: "card_decline_cap", fails };
  }

  return { action: "allow" };
}

/** Customer-facing copy. Never name the rule that fired — it teaches evasion. */
export function customerMessage(screen: Screen, locale: "en" | "fr" = "en"): string {
  if (screen.action === "card_blocked") {
    return locale === "fr"
      ? "Le paiement par carte n'est pas disponible pour cette commande. Veuillez utiliser le virement Interac — il est accepté immédiatement."
      : "Card payment isn't available for this order. Please use Interac e-Transfer — it's accepted right away.";
  }
  if (screen.action === "hard_block") {
    return locale === "fr"
      ? "Nous ne pouvons pas traiter cette commande. Contactez-nous si vous croyez qu'il s'agit d'une erreur."
      : "We can't process this order. Please contact us if you believe this is a mistake.";
  }
  return "";
}
