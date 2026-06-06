import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  variantName?: string | null;
  price: number;
  thumbnail_url?: string | null;
  type: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cybertown_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  function add(item: CartItem) {
    setItems((cur) => {
      const exists = cur.find((i) => i.productId === item.productId && i.variantId === item.variantId);
      if (exists) return cur;
      return [...cur, item];
    });
  }
  function remove(productId: string, variantId: string | null) {
    setItems((cur) => cur.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }
  function clear() { setItems([]); }

  return <Ctx.Provider value={{ items, add, remove, clear, count: items.length }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
