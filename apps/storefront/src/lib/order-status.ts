export const ORDER_STATUS_VALUES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

const ORDER_STATUS_SET: ReadonlySet<string> = new Set(ORDER_STATUS_VALUES);

/**
 * Read the admin-managed `orderStatus` custom field from an order's
 * `customFields` JSON. Returns null when the value is missing or not one of
 * the configured statuses, so callers can fall back to the built-in state.
 */
export function readOrderStatus(customFields: unknown): OrderStatus | null {
  if (!customFields || typeof customFields !== "object") return null;
  const value = (customFields as Record<string, unknown>).orderStatus;
  return typeof value === "string" && ORDER_STATUS_SET.has(value)
    ? (value as OrderStatus)
    : null;
}
