"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  quantity: number;
  customizations?: string;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; state: CartState };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalCents: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = "sc_cart";

function toCartItem(value: unknown): CartItem | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.id !== "string" ||
    typeof v.name !== "string" ||
    typeof v.category !== "string" ||
    typeof v.priceCents !== "number" ||
    !Number.isFinite(v.priceCents) ||
    typeof v.quantity !== "number" ||
    !Number.isFinite(v.quantity) ||
    (v.customizations !== undefined && typeof v.customizations !== "string")
  ) {
    return null;
  }
  const item: CartItem = {
    id: v.id,
    name: v.name,
    category: v.category,
    priceCents: v.priceCents,
    quantity: v.quantity,
  };
  if (v.customizations !== undefined) item.customizations = v.customizations as string;
  return item;
}

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null && Array.isArray((parsed as CartState).items)) {
        // Drop malformed entries instead of trusting stored data.
        const items = (parsed as { items: unknown[] }).items
          .map(toCartItem)
          .filter((i): i is CartItem => i !== null);
        return { items };
      }
    }
  } catch {}
  return { items: [] };
}

function saveCart(state: CartState) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Start empty so the server render and the client's first render match;
  // the stored cart is restored after mount.
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Effects re-run on StrictMode remounts and Activity re-shows; read storage only once.
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    dispatch({ type: "HYDRATE", state: loadCart() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Don't overwrite the stored cart before it has been restored.
    if (!hydrated) return;
    saveCart(state);
  }, [state, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", item });
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "add_to_cart", {
        currency: "CAD",
        value: (item.priceCents || 0) / 100,
        items: [
          {
            item_id: String(item.id),
            item_name: item.name,
            item_category: item.category,
            price: (item.priceCents || 0) / 100,
            quantity: 1,
          },
        ],
      });
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    const item = state.items.find((i) => i.id === id);
    dispatch({ type: "REMOVE_ITEM", id });
    if (item && typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "remove_from_cart", {
        currency: "CAD",
        value: ((item.priceCents || 0) * (item.quantity || 1)) / 100,
        items: [
          {
            item_id: String(item.id),
            item_name: item.name,
            item_category: item.category,
            price: (item.priceCents || 0) / 100,
            quantity: item.quantity || 1,
          },
        ],
      });
    }
  }, [state.items]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", id, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCents = state.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items: state.items, totalItems, totalCents, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
