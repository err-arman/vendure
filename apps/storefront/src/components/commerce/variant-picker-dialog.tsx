"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Price } from "@/components/commerce/price";
import { WhatsAppButton } from "@/components/commerce/whatsapp-button";
import {
  getProductForPicker,
  addVariantToCart,
  type PickerProduct,
} from "@/lib/actions/cart";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import {
  CONDITIONAL_OPTION_RULES,
  findConditionalVariant,
  getDisplayOptions,
  getVisibleOptionGroups,
  withGrindDefaults,
  type ConditionalOptionRule,
} from "@/lib/vendure/conditional-options";

interface VariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSlug: string;
  currencyCode?: string;
  onAdded?: () => void;
  conditionalRules?: ConditionalOptionRule[];
}

export function VariantPickerDialog({
  open,
  onOpenChange,
  productSlug,
  currencyCode,
  onAdded,
  conditionalRules = CONDITIONAL_OPTION_RULES,
}: VariantPickerDialogProps) {
  const t = useTranslations("Product");
  const { refresh } = useCart();

  const [product, setProduct] = useState<PickerProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProduct(null);
    setLoadError(false);
    setSelectedOptions({});
    setQuantity(1);
    setIsAdded(false);
    setLoading(true);
    getProductForPicker(productSlug)
      .then(({ product }) => {
        setProduct(product);
        setLoadError(!product);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [open, productSlug]);

  // Visible groups after conditional rules (Grind Size only for Ground).
  const visibleGroups = useMemo(() => {
    if (!product) return [];
    return getVisibleOptionGroups(
      product.optionGroups,
      selectedOptions,
      conditionalRules,
    );
  }, [product, selectedOptions, conditionalRules]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    if (product.variants.length === 1) return product.variants[0];
    return (
      findConditionalVariant(
        product.optionGroups,
        product.variants,
        selectedOptions,
        conditionalRules,
      ) ?? null
    );
  }, [product, selectedOptions, conditionalRules]);

  const handleOptionSelect = (groupId: string, optionId: string) => {
    if (!product) return;
    setSelectedOptions((prev) =>
      withGrindDefaults(
        product.optionGroups,
        { ...prev, [groupId]: optionId },
        conditionalRules,
      ),
    );
  };

  const inStock =
    selectedVariant && selectedVariant.stockLevel !== "OUT_OF_STOCK";
  const canAdd = Boolean(selectedVariant) && Boolean(inStock) && quantity > 0;

  const setSafeQuantity = (value: number) => {
    setQuantity(Number.isFinite(value) ? Math.max(1, Math.min(99, value)) : 1);
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
    startTransition(async () => {
      const result = await addVariantToCart(selectedVariant.id, quantity);
      if (result.success) {
        setIsAdded(true);
        onAdded?.();
        await refresh();
        toast.success(t("addedToCartMessage"), {
          description: t("addedToCartDescription", {
            name: product?.name ?? "",
          }),
        });
        setTimeout(() => {
          setIsAdded(false);
          onOpenChange(false);
        }, 800);
      } else {
        toast.error(t("errorTitle"), {
          description: result.error || t("errorAddToCart"),
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
    inset-0
    translate-x-0 translate-y-0
    mx-auto my-auto
    h-fit
    block
    max-h-[85vh]
    supports-[height:100svh]:max-h-[85svh]
    w-[95vw]
    max-w-md
    touch-pan-y
    overflow-y-auto
    overscroll-contain
    rounded-2xl
    p-0
  "
        showCloseButton
      >
        {loading ? (
          <>
            <DialogTitle className="sr-only">{t("selectOptions")}</DialogTitle>

            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : loadError || !product ? (
          <>
            <DialogTitle className="sr-only">{t("errorTitle")}</DialogTitle>

            <div className="flex min-h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {t("errorAddToCart")}
            </div>
          </>
        ) : (
          <>
            {/* HEADER */}
              <div className="border-b bg-background px-4 py-4 sm:px-5">
                <DialogTitle className="pr-8 text-lg font-semibold leading-tight">
                  {product.name}
                </DialogTitle>
              </div>

              <div className="px-4 py-4 sm:px-5 sm:py-5">
              {/* IMAGE */}
              <div className="mb-4 overflow-hidden rounded-xl bg-muted sm:mb-6">
                {product.asset ? (
                  <Image
                    src={product.asset}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="mx-auto h-28 w-auto object-contain sm:h-48"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center text-muted-foreground sm:h-40">
                    {t("noImage")}
                  </div>
                )}
              </div>

              {/* PRICE */}
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  {t("selectOptions")}
                </p>

                {selectedVariant && (
                  <p className="text-lg font-bold">
                    <Price
                      value={selectedVariant.priceWithTax}
                      currencyCode={currencyCode}
                    />
                  </p>
                )}
              </div>

              {/* OPTIONS (conditionally visible; `None` size hidden for Ground) */}
              <div className="space-y-6">
                {visibleGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-3 text-sm font-semibold">{group.name}</p>

                    <div className="flex flex-wrap gap-2">
                      {getDisplayOptions(
                        group,
                        product.optionGroups,
                        selectedOptions,
                        conditionalRules,
                      ).map((option) => {
                        const selected =
                          selectedOptions[group.id] === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleOptionSelect(group.id, option.id)}
                            className={`min-h-10 max-w-full rounded-full border px-4 py-2 text-center text-sm font-medium leading-snug transition-colors ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/50"
                            }`}
                          >
                            <span className="block break-words">
                              {option.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* QUANTITY */}
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold">{t("quantity")}</p>

                <div className="grid h-11 w-36 grid-cols-[44px_1fr_44px] overflow-hidden rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    className="flex items-center justify-center hover:bg-muted disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(event) =>
                      setSafeQuantity(Number(event.target.value))
                    }
                    className="h-full rounded-none border-x border-y-0 text-center shadow-none focus-visible:ring-0"
                  />

                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity + 1)}
                    className="flex items-center justify-center hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

              {/* FOOTER (scrolls with the content) */}
              <div className="border-t bg-background p-4">
                {selectedVariant && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("total")}
                    </span>

                    <span className="text-lg font-bold">
                      <Price
                        value={selectedVariant.priceWithTax * quantity}
                        currencyCode={currencyCode}
                      />
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-xl text-base font-semibold"
                    disabled={!canAdd || isPending}
                    onClick={handleAdd}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {t("addedToCart")}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />

                        {isPending
                          ? t("adding")
                          : !selectedVariant && visibleGroups.length > 0
                            ? t("selectOptions")
                            : !inStock
                              ? t("outOfStock")
                              : t("addToCart")}
                      </>
                    )}
                  </Button>

                  <WhatsAppButton
                    productSlug={productSlug}
                    className="h-12 w-full rounded-xl"
                  />
                </div>
              </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
