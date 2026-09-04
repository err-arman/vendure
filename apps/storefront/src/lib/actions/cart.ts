"use server";

import { query, mutate } from "@/lib/vendure/api";
import { setAuthToken } from "@/lib/auth";
import { getActiveCurrencyCode } from "@/lib/currency-server";
import { updateTag } from "next/cache";
import { GetActiveOrderQuery, GetProductVariantsQuery, GetProductForPickerQuery } from "@/lib/vendure/queries";
import { AddToCartMutation } from "@/lib/vendure/mutations";
import { getLocale, getTranslations } from "next-intl/server";

export async function getActiveOrderProductIds(): Promise<{
  ids: string[];
  totalQuantity: number;
}> {
  try {
    const res = await query(GetActiveOrderQuery, undefined, {
      useAuthToken: true,
      tags: ["cart"],
    });
    const lines = res.data.activeOrder?.lines ?? [];
    return {
      ids: [...new Set(lines.map((l) => l.productVariant.product.id))],
      totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
    };
  } catch {
    return { ids: [], totalQuantity: 0 };
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

export interface PickerVariant {
  id: string;
  name: string;
  priceWithTax: number;
  stockLevel: string;
  options: Array<{
    id: string;
    code: string;
    name: string;
    groupId: string;
    group: { id: string; code: string; name: string };
  }>;
}

export interface PickerOptionGroup {
  id: string;
  code: string;
  name: string;
  options: Array<{ id: string; code: string; name: string }>;
}

export interface PickerProduct {
  id: string;
  name: string;
  asset?: string | null;
  variants: PickerVariant[];
  optionGroups: PickerOptionGroup[];
}

export async function getProductForPicker(
  slug: string,
): Promise<{ product: PickerProduct | null; error?: string }> {
  try {
    const currencyCode = await getActiveCurrencyCode();
    const res = await query(
      GetProductForPickerQuery,
      { slug },
      { currencyCode },
    );
    const product = res.data.product;
    if (!product) return { product: null };

    return {
      product: {
        id: product.id,
        name: product.name,
        asset: product.assets?.[0]?.preview ?? null,
        variants: product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          priceWithTax: v.priceWithTax,
          stockLevel: v.stockLevel,
          options: v.options.map((o) => ({
            id: o.id,
            code: o.code,
            name: o.name,
            groupId: o.groupId,
            group: { id: o.group.id, code: o.group.code, name: o.group.name },
          })),
        })),
        optionGroups: product.optionGroups.map((g) => ({
          id: g.id,
          code: g.code,
          name: g.name,
          options: g.options.map((o) => ({ id: o.id, code: o.code, name: o.name })),
        })),
      },
    };
  } catch {
    return { product: null, error: "Failed to load product" };
  }
}

export async function addVariantToCart(
  variantId: string,
  quantity = 1,
): Promise<{ success: boolean; error?: string }> {
  const t = await getTranslations({ locale: await getLocale(), namespace: "Errors" });
  try {
    const currencyCode = await getActiveCurrencyCode();

    const result = await mutate(
      AddToCartMutation,
      { variantId, quantity },
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
    return { success: false, error: t("failedAddToCart") };
  }
}
