"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addFirstVariantToCart,
  getActiveOrderProductIds,
} from "@/lib/actions/cart";

interface CartContextValue {
  productIds: Set<string>;
  isInCart: (productId: string) => boolean;
  addProduct: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const ids = await getActiveOrderProductIds();
    setProductIds(new Set(ids));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isInCart = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds],
  );

  const addProduct = useCallback(
    async (productId: string) => {
      const result = await addFirstVariantToCart(productId);
      if (result.success) {
        setProductIds((prev) => new Set(prev).add(productId));
        return true;
      }
      return false;
    },
    [],
  );

  const value = useMemo(
    () => ({ productIds, isInCart, addProduct, refresh }),
    [productIds, isInCart, addProduct, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
