"use client";

import Image from "next/image";
import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price } from "@/components/commerce/price";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProductCardAction } from "@/components/commerce/product-card-action";
import { useEffect } from "react";

interface ProductCardProps {
  product: FragmentOf<typeof ProductCardFragment> | null | undefined;
}

export function ProductCard({ product: productProp }: ProductCardProps) {
  const t = useTranslations("Product");
  const product = productProp
    ? readFragment(ProductCardFragment, productProp)
    : null;

  if (!product) {
    return null;
  }

  useEffect(() => {
    console.log("product", product);
  }, [product]);

  const priceWithTax = product.priceWithTax;

  const currentPrice =
    priceWithTax?.__typename === "PriceRange"
      ? (priceWithTax.min ?? 0)
      : priceWithTax?.__typename === "SinglePrice"
        ? (priceWithTax.value ?? 0)
        : 0;

  /*
   * IMPORTANT:
   *
   * Replace `originalPrice` below with the actual original/base price
   * field from your Vendure ProductCardFragment.
   *
   * The logic should be:
   *
   * originalPrice > currentPrice = discount available
   */
  const originalPrice = 0;

  const hasDiscount = originalPrice > 0 && originalPrice > currentPrice;

  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const desktopPriceLabel =
    priceWithTax?.__typename === "PriceRange" ? (
      priceWithTax.min !== priceWithTax.max ? (
        <>
          <span className="mr-1 text-xs font-normal text-white/70">
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

  return (
    <div className="relative w-full">
      {/* =========================================================
          DESKTOP + TABLET
          ========================================================= */}
      <div className="hidden md:block">
        <div className="relative w-full">
          <Link href={`/product/${product.slug}`} className="block w-full">
            <div className="overflow-hidden rounded-xl bg-[#f1f5f9]">
              {/* Product name */}
              <div className="px-3 pb-1 pt-2">
                <p className="text-center text-sm font-bold uppercase tracking-wide text-[#111827]">
                  {product.productName}
                </p>
              </div>

              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                {product.productAsset ? (
                  <Image
                    src={product.productAsset.preview}
                    alt={product.productName}
                    fill
                    sizes="(max-width: 1024px) 33vw, 400px"
                    className="object-contain p-8 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}

                {/* Desktop price badge */}
                <div className="absolute bottom-4 right-4">
                  <div className="relative inline-flex min-h-[34px] items-center rounded-r-lg bg-[#555B46] px-4 py-2 text-sm font-bold text-white">
                    {desktopPriceLabel}

                    <div
                      className="absolute left-[-14px] top-0 h-0 w-0"
                      style={{
                        borderTop: "17px solid transparent",
                        borderBottom: "17px solid transparent",
                        borderRight: "14px solid #555B46",
                      }}
                    />

                    <span className="absolute left-[-4px] top-1/2 z-20 h-2 w-2 -translate-y-1/2 rounded-full bg-[#999]" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop cart button */}
          <ProductCardAction
            productId={product.productId}
            productSlug={product.slug}
            currencyCode={product.currencyCode}
            className={(inCart) =>
              `absolute right-11 top-12 z-30 flex h-8 w-11 items-center justify-center rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A3B18A] focus:ring-offset-2 ${
                inCart
                  ? "bg-[#A3B18A] text-black"
                  : "bg-[#D9E4DD] text-black hover:bg-[#C0C8B6]"
              }`
            }
            iconClassName="h-4 w-4 text-white"
          />
        </div>
      </div>

      {/* =========================================================
          MOBILE
          ========================================================= */}
      {/* <div className="block md:hidden">
        <Link
          href={`/product/${product.slug}`}
          className="block"
        >
          <div className="relative flex min-h-[96px] w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-2">

          
            <div className="relative h-[78px] w-[70px] shrink-0 overflow-hidden rounded-md bg-[#f3f3f3]">
              {product.productAsset ? (
                <Image
                  src={product.productAsset.preview}
                  alt={product.productName}
                  fill
                  sizes="70px"
                  className="object-contain p-1"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 self-stretch py-1">

              
              <h3 className="truncate text-sm font-bold leading-5 text-[#111827]">
                {product.productName}
              </h3>

            
              <p className="truncate text-xs leading-4 text-[#8b9aaa]">
                Medium roast, 100% origin Arabica
              </p>

            
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs font-semibold text-[#111827]">
                  <Price
                    value={currentPrice}
                    currencyCode={product.currencyCode}
                  />
                </span>

              
                {hasDiscount && (
                  <span className="text-[10px] text-[#9ca3af] line-through">
                    <Price
                      value={originalPrice}
                      currencyCode={product.currencyCode}
                    />
                  </span>
                )}
              </div>

            
              {hasDiscount && (
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#43a047] text-[8px] text-white">
                    %
                  </span>

                  <span className="text-[10px] font-semibold text-[#43a047]">
                    {discountPercentage}% off
                  </span>
                </div>
              )}
            </div>

            
            <div
              className="shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <ProductCardAction
                productId={product.productId}
                productSlug={product.slug}
                currencyCode={product.currencyCode}
                className={(inCart) =>
                  `flex h-8 min-w-[38px] items-center justify-center rounded-full px-2 text-[11px] font-semibold shadow-sm transition-all ${
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
        </Link>
      </div> */}

      {/* =========================================================
    MOBILE
    ========================================================= */}
      <div className="block md:hidden">
        <div className="relative w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-2">
          <Link
            href={`/product/${product.slug}`}
            className="flex items-start gap-2.5"
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
            <div className="min-w-0 flex-1 pb-1">
              {/* Product name */}
              <h3 className="text-[13px] font-bold leading-[17px] text-[#111827]">
                {product.productName}
              </h3>

              {/* Description */}
              <p className="mt-0.5 text-[11px] leading-[15px] text-[#8492a1]">
                {product.description?.replace(/<[^>]*>/g, "").trim()}
              </p>

              {/* Price */}
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-[12px] font-semibold leading-4 text-[#111827]">
                  <Price
                    value={currentPrice}
                    currencyCode={product.currencyCode}
                  />
                </span>

                {/* Original price only if discounted */}
                {hasDiscount && (
                  <span className="text-[10px] leading-4 text-[#9ca3af] line-through">
                    <Price
                      value={originalPrice}
                      currencyCode={product.currencyCode}
                    />
                  </span>
                )}
              </div>

              {/* Discount only if available */}
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

          {/* Add button */}
          <div className="absolute bottom-2.5 right-2.5">
            <ProductCardAction
              productId={product.productId}
              productSlug={product.slug}
              currencyCode={product.currencyCode}
              className={(inCart) =>
                `flex h-[26px] items-center justify-center rounded-full px-2.5 text-[11px] font-semibold ${
                  inCart ? "bg-[#A3B18A] text-black" : "bg-primary text-primary-foreground"
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
