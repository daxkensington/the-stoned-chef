export interface RemoveOption {
  id: string;
  label: string;
}

export interface AddOnOption {
  id: string;
  label: string;
  priceCents: number;
}

export interface ItemCustomizations {
  removes: RemoveOption[];
  addOns: AddOnOption[];
}

// Customization options by category
const BURGER_REMOVES: RemoveOption[] = [
  { id: "no-onion", label: "No Onion" },
  { id: "no-pickle", label: "No Pickle" },
  { id: "no-ketchup", label: "No Ketchup" },
  { id: "no-mustard", label: "No Mustard" },
  { id: "no-lettuce", label: "No Lettuce" },
  { id: "no-tomato", label: "No Tomato" },
];

const BURGER_ADDONS: AddOnOption[] = [
  { id: "extra-cheese", label: "Extra Cheese", priceCents: 150 },
  { id: "add-bacon", label: "Add Bacon", priceCents: 200 },
  { id: "add-jalapenos", label: "Add Jalapeños", priceCents: 100 },
  { id: "extra-patty", label: "Extra Patty", priceCents: 400 },
];

const POUTINE_ADDONS: AddOnOption[] = [
  { id: "extra-cheese-curds", label: "Extra Cheese Curds", priceCents: 200 },
  { id: "extra-gravy", label: "Extra Gravy", priceCents: 100 },
  { id: "add-jalapenos", label: "Add Jalapeños", priceCents: 100 },
  { id: "add-pulled-pork", label: "Add Pulled Pork", priceCents: 300 },
];

const WRAP_REMOVES: RemoveOption[] = [
  { id: "no-lettuce", label: "No Lettuce" },
  { id: "no-tomato", label: "No Tomato" },
  { id: "no-sauce", label: "No Sauce" },
];

const WRAP_ADDONS: AddOnOption[] = [
  { id: "extra-chicken", label: "Extra Chicken", priceCents: 300 },
  { id: "add-cheese", label: "Add Cheese", priceCents: 150 },
];

const FISH_ADDONS: AddOnOption[] = [
  { id: "extra-tartar", label: "Extra Tartar Sauce", priceCents: 50 },
  { id: "upgrade-onion-rings", label: "Swap Fries → Onion Rings", priceCents: 200 },
];

export function getCustomizations(category: string): ItemCustomizations {
  switch (category) {
    case "burgers":
      return { removes: BURGER_REMOVES, addOns: BURGER_ADDONS };
    case "fries-poutine":
      return { removes: [], addOns: POUTINE_ADDONS };
    case "chicken":
      return { removes: WRAP_REMOVES, addOns: WRAP_ADDONS };
    case "fish-chips":
      return { removes: [], addOns: FISH_ADDONS };
    default:
      return { removes: [], addOns: [] };
  }
}

export function hasCustomizations(category: string): boolean {
  const c = getCustomizations(category);
  return c.removes.length > 0 || c.addOns.length > 0;
}
