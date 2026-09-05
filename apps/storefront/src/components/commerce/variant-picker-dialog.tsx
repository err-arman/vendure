"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Price } from "@/components/commerce/price";
import {
  getProductForPicker,
  addVariantToCart,
  type PickerProduct,
} from "@/lib/actions/cart";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";

interface VariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSlug: string;
  currencyCode?: string;
  onAdded?: () => void;
}

export function VariantPickerDialog({
  open,
  onOpenChange,
  productSlug,
  currencyCode,
  onAdded,
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

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    if (product.variants.length === 1) return product.variants[0];
    if (Object.keys(selectedOptions).length !== product.optionGroups.length) {
      return null;
    }
    const selectedIds = Object.values(selectedOptions);
    return (
      product.variants.find((variant) =>
        selectedIds.every((id) => variant.options.some((opt) => opt.id === id)),
      ) ?? null
    );
  }, [product, selectedOptions]);

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
    top-1/2 left-1/2
    flex
    h-[90dvh]
    w-[95vw]
    max-w-md
    flex-col
    -translate-x-1/2
    -translate-y-1/2
    gap-0
    overflow-hidden
    rounded-2xl
    p-0
  "
        showCloseButton
      >
        {loading ? (
          <>
            <DialogTitle className="sr-only">{t("selectOptions")}</DialogTitle>

            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : loadError || !product ? (
          <>
            <DialogTitle className="sr-only">{t("errorTitle")}</DialogTitle>

            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {t("errorAddToCart")}
            </div>
          </>
        ) : (
          <>
            {/* HEADER */}
            <div className="sticky top-0 z-20 border-b bg-background px-5 py-4">
              <DialogTitle className="pr-8 text-lg font-semibold leading-tight">
                {product.name}
              </DialogTitle>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {/* IMAGE */}
              <div className="mb-6 overflow-hidden rounded-xl bg-muted">
                {product.asset ? (
                  <Image
                    src={product.asset}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="mx-auto h-40 w-auto object-contain sm:h-48"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-muted-foreground">
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

              {/* OPTIONS */}
              <div className="space-y-6">
                {product.optionGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-3 text-sm font-semibold">{group.name}</p>

                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const selected =
                          selectedOptions[group.id] === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [group.id]: option.id,
                              }))
                            }
                            className={`min-h-10 max-w-full rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/50"
                            }`}
                          >
                            <span className="block max-w-[140px] truncate">
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

              {/* EXTRA SPACE FOR STICKY FOOTER */}
              <div className="h-24" />
            </div>

            {/* STICKY FOOTER */}
            <div className="sticky bottom-0 z-20 border-t bg-background p-4">
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
                      : !selectedVariant && product.optionGroups.length > 0
                        ? t("selectOptions")
                        : !inStock
                          ? t("outOfStock")
                          : t("addToCart")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
