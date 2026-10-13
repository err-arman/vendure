"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import {
  addFirstVariantToCart,
  getActiveOrderProductIds,
} from "@/lib/actions/cart";

interface CartContextValue {
  productIds: Set<string>;
  itemCount: number;
  isInCart: (productId: string) => boolean;
  addProduct: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [itemCount, setItemCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { ids, totalQuantity } = await getActiveOrderProductIds();
      setProductIds(new Set(ids));
      setItemCount(totalQuantity);
    } catch {
      // Keep previous state: a failed read must never fake an empty cart
      // (nor wipe a truthful tick-mark).
    }
  }, []);

  const pathname = usePathname();

  // Sync on mount and after every client-side navigation, so state can never
  // go stale when the cart changes elsewhere (cart page edits, checkout).
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  const isInCart = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds],
  );

  const addProduct = useCallback(
    async (productId: string) => {
      const result = await addFirstVariantToCart(productId);
      if (result.success) {
        // Re-read server truth instead of optimistically guessing, so the
        // tick-mark and itemCount can never disagree with the cart.
        await refresh();
        return true;
      }
      return false;
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ productIds, itemCount, isInCart, addProduct, refresh }),
    [productIds, itemCount, isInCart, addProduct, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
