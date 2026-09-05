"use client";

import Image from "next/image";
import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price } from "@/components/commerce/price";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProductCardAction } from "@/components/commerce/product-card-action";

interface ProductCardProps {
  product: FragmentOf<typeof ProductCardFragment> | null | undefined;
  collectionSlug?: string;
}

export function ProductCard({ product: productProp, collectionSlug }: ProductCardProps) {
  const t = useTranslations("Product");
  const product = productProp
    ? readFragment(ProductCardFragment, productProp)
    : null;

  if (!product) {
    return null;
  }

  const priceWithTax = product.priceWithTax;

  const productHref = collectionSlug
    ? `/product/${product.slug}?collection=${collectionSlug}`
    : `/product/${product.slug}`;

  const currentPrice =
    priceWithTax?.__typename === "PriceRange"
      ? (priceWithTax.min ?? 0)
      : priceWithTax?.__typename === "SinglePrice"
        ? (priceWithTax.value ?? 0)
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
          <Link href={productHref} className="block w-full">
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
      <div className="block md:hidden">
        <div className="flex w-full rounded-lg border border-[#e5e7eb] bg-white p-2.5">
          {/* Left: 66% - product info */}
          <Link
            href={productHref}
            className="flex w-[66%] shrink-0 flex-col"
          >
            {/* Product name */}
            <h3 className="line-clamp-1 text-[15px] font-bold leading-[19px] text-[#111827]">
              {product.productName}
            </h3>

            {/* Price */}
            <div className="mt-0.5">
              <span className="text-[12px] font-semibold leading-4 text-[#111827]">
                <Price
                  value={currentPrice}
                  currencyCode={product.currencyCode}
                />
              </span>
            </div>

            {/* Description: 2 lines then ellipsis */}
            <p className="mt-0.5 line-clamp-2 text-xs leading-[16px] text-[#8492a1]">
              {product.description?.replace(/<[^>]*>/g, "").trim()}
            </p>
          </Link>

          {/* Right: 34% - product image + cart icon */}
          <div className="relative w-[34%] shrink-0">
            <Link href={productHref} className="block">
              <div className="relative aspect-square overflow-hidden rounded-md bg-[#f3f4f6]">
                {product.productAsset ? (
                  <Image
                    src={product.productAsset.preview}
                    alt={product.productName}
                    fill
                    sizes="120px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}
              </div>
            </Link>

            {/* Cart icon */}
            <div className="absolute bottom-1.5 right-1.5">
              <ProductCardAction
                productId={product.productId}
                productSlug={product.slug}
                currencyCode={product.currencyCode}
                className={(inCart) =>
                  `flex h-8 w-8 items-center justify-center rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3B18A] focus:ring-offset-2 ${
                    inCart
                      ? "bg-[#A3B18A] text-black"
                      : "bg-[#555B46] text-white"
                  }`
                }
                iconClassName="h-4 w-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
