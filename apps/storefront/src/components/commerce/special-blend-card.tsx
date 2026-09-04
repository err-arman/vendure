"use client";

import Image from "next/image";
import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price } from "@/components/commerce/price";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProductCardAction } from "@/components/commerce/product-card-action";

interface SpecialBlendCardProps {
  product: FragmentOf<typeof ProductCardFragment> | null | undefined;
}

export function SpecialBlendCard({
  product: productProp,
}: SpecialBlendCardProps) {
  const t = useTranslations("Product");

  const product = productProp
    ? readFragment(ProductCardFragment, productProp)
    : null;

  if (!product) {
    return null;
  }

  const priceWithTax = product.priceWithTax;

  const isFromPrice =
    priceWithTax?.__typename === "PriceRange" &&
    priceWithTax.min !== priceWithTax.max;

  const priceValue =
    priceWithTax?.__typename === "PriceRange"
      ? (priceWithTax.min ?? 0)
      : priceWithTax?.__typename === "SinglePrice"
        ? (priceWithTax.value ?? 0)
        : 0;

  /*
   * Replace this with your actual original/base price field
   * once it is available in ProductCardFragment.
   */
  const originalPrice = 0;

  const hasDiscount = originalPrice > 0 && originalPrice > priceValue;

  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - priceValue) / originalPrice) * 100)
    : 0;

  return (
    <div className="relative w-full">
      {/* =====================================================
          DESKTOP + TABLET
          ===================================================== */}
      <div className="hidden md:block">
        <div className="relative w-full">
          <Link href={`/product/${product.slug}`} className="block w-full">
            <div className="relative overflow-hidden rounded-[18px]">
              {product.productAsset ? (
                <Image
                  src={product.productAsset.preview}
                  alt={product.productName}
                  width={600}
                  height={600}
                  sizes="(max-width: 1024px) 33vw, 400px"
                  className="aspect-square w-full rounded-[18px] object-cover transition-transform duration-500"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-[18px] bg-muted text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
            </div>

            <h3 className="mt-2.5 text-base font-semibold text-stone-800 dark:text-stone-200">
              {product.productName}
            </h3>

            <div className="mt-1 flex items-center gap-1">
              {isFromPrice && (
                <span className="text-xs font-normal text-muted-foreground">
                  {t("from")}
                </span>
              )}

              <Price value={priceValue} currencyCode={product.currencyCode} />

              {/* Original price only when discounted */}
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  <Price
                    value={originalPrice}
                    currencyCode={product.currencyCode}
                  />
                </span>
              )}
            </div>

            {/* Desktop discount */}
            {hasDiscount && (
              <div className="mt-1 flex items-center gap-1">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#43a047] text-[8px] font-bold text-white">
                  %
                </span>

                <span className="text-xs font-semibold text-[#43a047]">
                  {discountPercentage}% off
                </span>
              </div>
            )}
          </Link>

          {/* Desktop cart */}
          <ProductCardAction
            productId={product.productId}
            productSlug={product.slug}
            currencyCode={product.currencyCode}
            className={(inCart) =>
              `absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors focus:outline-none ${
                inCart
                  ? "bg-[#A3B18A] text-white"
                  : "bg-white/90 text-stone-800 hover:bg-white dark:bg-background/90 dark:text-foreground dark:hover:bg-background"
              }`
            }
            iconClassName="h-4 w-4"
          />
        </div>
      </div>

      {/* =====================================================
          MOBILE
          ===================================================== */}
      <div className="block md:hidden">
        <div className="relative w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-2">
          <Link
            href={`/product/${product.slug}`}
            className="flex items-start gap-2.5 pr-[42px]"
          >
            {/* Product image */}
            <div className="relative h-[60px] w-[60px] shrink-0 rounded-md bg-[#f3f4f6]">
              {product.productAsset ? (
                <Image
                  src={product.productAsset.preview}
                  alt={product.productName}
                  fill
                  sizes="60px"
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
            </div>

            {/* Product information */}
            <div className="min-w-0 flex-1">
              {/* Product name */}
              <h3 className="text-[13px] font-bold leading-[17px] text-[#111827]">
                {product.productName}
              </h3>

              {/* Description */}
              <p className="mt-0.5 text-[11px] leading-[15px] text-[#8492a1]">
                Medium roast, 100% origin Arabica
              </p>

              {/* Price */}
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-[12px] font-semibold leading-4 text-[#111827]">
                  {isFromPrice && (
                    <span className="mr-1 text-[10px] font-normal">
                      {t("from")}
                    </span>
                  )}

                  <Price
                    value={priceValue}
                    currencyCode={product.currencyCode}
                  />
                </span>

                {/* Old price only when discounted */}
                {hasDiscount && (
                  <span className="text-[10px] leading-4 text-[#9ca3af] line-through">
                    <Price
                      value={originalPrice}
                      currencyCode={product.currencyCode}
                    />
                  </span>
                )}
              </div>

              {/* Discount only when available */}
              {hasDiscount && (
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="flex h-[11px] w-[11px] items-center justify-center rounded-full bg-[#43a047] text-[7px] font-bold leading-none text-white">
                    %
                  </span>

                  <span className="text-[10px] font-semibold leading-3 text-[#43a047]">
                    {discountPercentage}% off
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* =================================================
              MOBILE ADD BUTTON
              ================================================= */}
          {/* Add button */}
          <div className="absolute bottom-2.5 right-2.5">
            <ProductCardAction
              productId={product.productId}
              productSlug={product.slug}
              currencyCode={product.currencyCode}
              className={(inCart) =>
                `flex h-[26px] items-center justify-center rounded-full px-2.5 text-[11px] font-semibold ${
                  inCart
                    ? "bg-[#A3B18A] text-black"
                    : "bg-primary text-primary-foreground"
                }`
              }
              iconClassName="hidden"
            >
              Add
            </ProductCardAction>
          </div>
        </div>
      </div>
    </div>
  );
}
