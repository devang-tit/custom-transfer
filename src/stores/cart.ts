"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LineSelection, ProductType } from "@/lib/types";

/**
 * Client cart. Prices here are previews only — the server recomputes every line
 * from the database at checkout (see priceLine in src/lib/pricing.ts).
 */
export type CartItem = {
  /** Unique line id */
  id: string;
  productId: string;
  slug: string;
  name: string;
  type: ProductType;
  /** Thumbnail: artwork/design preview if any, else product image */
  image: string;
  variantLabel: string;
  selection: LineSelection;
  quantity: number;
  unitPrice: number; // cents (preview)
  total: number; // cents (preview)
  artworkUrl?: string;
  artworkName?: string;
  designId?: string;
  notes?: string;
};

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  updateItem: (id: string, patch: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

function lineId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      isOpen: false,
      addItem: (item) =>
        set((s) => ({ items: [...s.items, { ...item, id: item.id ?? lineId() }], isOpen: true })),
      updateItem: (id, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (code) => set({ couponCode: code }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "inkforge-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode }),
    }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.total, 0);
