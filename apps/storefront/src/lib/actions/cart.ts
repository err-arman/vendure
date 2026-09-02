"use server";

import { query, mutate } from "@/lib/vendure/api";
import { setAuthToken } from "@/lib/auth";
import { getActiveCurrencyCode } from "@/lib/currency-server";
import { updateTag } from "next/cache";
import { GetActiveOrderQuery, GetProductVariantsQuery } from "@/lib/vendure/queries";
import { AddToCartMutation } from "@/lib/vendure/mutations";

export async function getActiveOrderProductIds(): Promise<string[]> {
  try {
    const res = await query(GetActiveOrderQuery, undefined, {
      useAuthToken: true,
      tags: ["cart"],
    });
    const lines = res.data.activeOrder?.lines ?? [];
    return [...new Set(lines.map((l) => l.productVariant.product.id))];
  } catch {
    return [];
  }
}

export async function addFirstVariantToCart(
  productId: string,
  quantity = 1,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await query(GetProductVariantsQuery, { productId }, { useAuthToken: true });
    const variant = res.data.product?.variants?.[0];
    if (!variant) return { success: false, error: "No variant found" };

    const currencyCode = await getActiveCurrencyCode();
    const result = await mutate(
      AddToCartMutation,
      { variantId: variant.id, quantity },
      { useAuthToken: true, currencyCode },
    );

    if (result.token) await setAuthToken(result.token);

    if (result.data.addItemToOrder.__typename === "Order") {
      updateTag("cart");
      updateTag("active-order");
      return { success: true };
    }
    return { success: false, error: result.data.addItemToOrder.message };
  } catch {
    return { success: false, error: "Failed to add to cart" };
  }
}
