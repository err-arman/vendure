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
  className: (inCart: boolean) => string;
  iconClassName?: string;
  children?: ReactNode;
}

export function ProductCardAction({
  productId,
  productSlug,
  currencyCode,
  className,
  iconClassName,
  children,
}: ProductCardActionProps) {
  const t = useTranslations("Product");
  const { isInCart } = useCart();
  const [addedNow, setAddedNow] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inCart = addedNow || isInCart(productId);

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label={inCart ? t("inCart") : t("addToCart")}
        className={className(inCart)}
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