import { MENU_CATEGORIES } from "@shared/menu";
import { getCustomizations } from "@shared/customizations";
import { listActiveSpecials, getSoldOutItems } from "./db";

const MENU_BY_ID = new Map(
  MENU_CATEGORIES.flatMap((c) => c.items).map((i) => [i.id, i])
);

export interface CartItemInput {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  quantity: number;
  customizations?: string;
}

export type PricingResult =
  | { ok: true; totalCents: number }
  | { ok: false; reason: string };

// Prices arrive from the client but are never trusted: every line item is
// re-priced here from the canonical menu / specials / add-on tables, and the
// order is rejected on any mismatch.
export async function validateCartPricing(
  items: CartItemInput[]
): Promise<PricingResult> {
  const soldOut = new Set(await getSoldOutItems());
  let specialsById: Map<number, { priceCents: number | null }> | null = null;
  let totalCents = 0;

  for (const item of items) {
    // Customized items carry an id of `${menuId}__${optionIds}`
    const baseId = item.id.split("__")[0]!;

    if (soldOut.has(baseId)) {
      return { ok: false, reason: `Sorry, ${item.name} just sold out.` };
    }

    let expected: number;

    if (baseId.startsWith("special-")) {
      if (!specialsById) {
        specialsById = new Map((await listActiveSpecials()).map((s) => [s.id, s]));
      }
      const special = specialsById.get(parseInt(baseId.slice("special-".length), 10));
      if (!special?.priceCents) {
        return { ok: false, reason: `Sorry, "${item.name}" is no longer available.` };
      }
      expected = special.priceCents;
    } else {
      const menuItem = MENU_BY_ID.get(baseId);
      if (!menuItem) {
        return { ok: false, reason: `Unknown menu item "${item.name}".` };
      }
      expected = menuItem.priceCents;

      if (item.customizations) {
        const opts = getCustomizations(menuItem.category);
        const addOnByLabel = new Map(opts.addOns.map((a) => [a.label, a.priceCents]));
        const removeLabels = new Set(opts.removes.map((r) => r.label));

        for (const label of item.customizations.split(",").map((s) => s.trim())) {
          if (!label || removeLabels.has(label)) continue;
          const addOnPrice = addOnByLabel.get(label);
          if (addOnPrice == null) {
            return { ok: false, reason: `Unknown customization "${label}".` };
          }
          expected += addOnPrice;
        }
      }
    }

    if (item.priceCents !== expected) {
      return {
        ok: false,
        reason: `The price of ${item.name} has changed — please refresh and try again.`,
      };
    }

    totalCents += expected * item.quantity;
  }

  return { ok: true, totalCents };
}
