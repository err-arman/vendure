"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price } from "@/components/commerce/price";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check, ShoppingCart, Loader2 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { toast } from "sonner";

interface ProductCardProps {
  product: FragmentOf<typeof ProductCardFragment> | null | undefined;
  /** Optional label shown above the product title (e.g. the category name). */
  sectionName?: string;
}

export function ProductCard({
  product: productProp,
  sectionName,
}: ProductCardProps) {
  const t = useTranslations("Product");
  const { isInCart, addProduct } = useCart();
  const [isPending, startTransition] = useTransition();
  const [addedNow, setAddedNow] = useState(false);

  const product = productProp
    ? readFragment(ProductCardFragment, productProp)
    : null;

  if (!product) {
    return null;
  }

  const priceWithTax = product.priceWithTax;
  const priceLabel =
    priceWithTax?.__typename === "PriceRange" ? (
      priceWithTax.min !== priceWithTax.max ? (
        <>
          <span className="mr-1 text-xs font-normal text-muted-foreground">
            {t("from")}
          </span>
          <Price
            value={priceWithTax.min ?? 0}
            currencyCode={product.currencyCode}
          />
        </>
      ) : (
        <Price
          value={priceWithTax.min ?? 0}
          currencyCode={product.currencyCode}
        />
      )
    ) : priceWithTax?.__typename === "SinglePrice" ? (
      <Price
        value={priceWithTax.value ?? 0}
        currencyCode={product.currencyCode}
      />
    ) : null;

  const inCart = addedNow || isInCart(product.productId);

  const handleAddOrOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    startTransition(async () => {
      const ok = await addProduct(product.productId);
      if (ok) {
        setAddedNow(true);
        setTimeout(() => setAddedNow(false), 2000);
        toast.success(t("addedToCartMessage"), {
          description: t("addedToCartDescription", { name: product.productName }),
        });
      } else {
        toast.error(t("errorTitle"), {
          description: t("errorAddToCart"),
        });
      }
    });
  };

  return (
    <Link href={`/product/${product.slug}`} className="mx-auto w-full max-w-sm">
      <div className="mx-auto w-full max-w-sm">
        <div className="overflow-hidden rounded-lg bg-white">
          <p className="mb-px text-center text-sm font-semibold uppercase tracking-wide text-gray-800">
            {product.productName}
          </p>
          <div className="relative aspect-square overflow-hidden rounded-lg">
            {product.productAsset ? (
              <Image
                src={product.productAsset.preview}
                alt={product.productName}
                fill
                className="w-full transition-transform duration-500"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {t("noImage")}
              </div>
            )}
            <button
              onClick={handleAddOrOpen}
              disabled={isPending}
              aria-label={inCart ? t("inCart") : t("addToCart")}
              className={`absolute right-12 top-10 flex items-center gap-2 rounded-lg px-4 py-2 font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A3B18A] focus:ring-offset-2 disabled:opacity-60 ${
                inCart
                  ? "bg-[#A3B18A] text-black"
                  : "bg-[#D9E4DD] text-black hover:bg-[#C0C8B6]"
              }`}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : inCart ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
            <div className="absolute bottom-4 right-4">
              <div className="relative inline-flex items-center rounded-r-md bg-[#555B46] px-4 py-2 pr-4 text-sm font-bold text-white">
                {priceLabel}
                <div
                  className="absolute h-0 w-0"
                  style={{
                    left: "-14px",
                    borderTop: "25px solid transparent",
                    borderBottom: "18px solid transparent",
                    borderRight: "14px solid #555B46",
                  }}
                ></div>
                <span className="absolute -left-1.5 top-1/2 z-20 h-2 w-2 -translate-y-1/2 rounded-full bg-[#999]"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
