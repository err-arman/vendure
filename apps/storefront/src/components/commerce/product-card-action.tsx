"use client";

import { useState, type ReactNode } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/providers/cart-provider";
import { VariantPickerDialog } from "@/components/commerce/variant-picker-dialog";

interface ProductCardActionProps {
  productId: string;
  productSlug: string;
  currencyCode?: string | null;
  inStock?: boolean;
  className: (inCart: boolean, outOfStock?: boolean) => string;
  iconClassName?: string;
  children?: ReactNode;
}

export function ProductCardAction({
  productId,
  productSlug,
  currencyCode,
  inStock = true,
  className,
  iconClassName,
  children,
}: ProductCardActionProps) {
  const t = useTranslations("Product");
  const { isInCart } = useCart();
  const [addedNow, setAddedNow] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inCart = addedNow || isInCart(productId);
  const outOfStock = !inStock;

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={outOfStock}
        aria-label={
          outOfStock ? t("outOfStock") : inCart ? t("inCart") : t("addToCart")
        }
        className={className(inCart, outOfStock)}
      >
        {inCart ? (
          <Check className={iconClassName} />
        ) : (
          <ShoppingCart className={iconClassName} />
        )}
        {children}
      </button>
      <VariantPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        productSlug={productSlug}
        currencyCode={currencyCode ?? undefined}
        onAdded={() => {
          setAddedNow(true);
          window.setTimeout(() => setAddedNow(false), 2000);
        }}
      />
    </>
  );
}