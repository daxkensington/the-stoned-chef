"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";

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
  | { type: "CLEAR_CART" };

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

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.items)) return parsed;
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
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, loadCart);

  useEffect(() => {
    saveCart(state);
  }, [state]);

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
