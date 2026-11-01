"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { mutate } from "@/lib/vendure/api";
import { CancelMyOrderMutation } from "@/lib/vendure/mutations";

export type CancelOrderResult =
  | { success: true; orderStatus: string | null }
  | { success: false; error: string };

export async function cancelOrder(code: string): Promise<CancelOrderResult> {
  try {
    const result = await mutate(
      CancelMyOrderMutation,
      { code },
      { useAuthToken: true },
    );

    const locale = await getLocale();
    revalidatePath(`/${locale}/account/orders`);
    revalidatePath(`/${locale}/account/orders/${code}`);

    return {
      success: true,
      orderStatus: result.data.cancelMyOrder.customFields?.orderStatus ?? null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
