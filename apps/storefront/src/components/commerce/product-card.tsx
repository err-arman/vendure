import Image from "next/image";
import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price } from "@/components/commerce/price";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: FragmentOf<typeof ProductCardFragment>;
}

export function ProductCard({ product: productProp }: ProductCardProps) {
  const t = useTranslations("Product");
  const product = readFragment(ProductCardFragment, productProp);

  return (
    <Link
      href={`/product/${product.slug}`}
      //   className="group block bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      className="w-full max-w-sm mx-auto"
    >
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white rounded-lg overflow-hidden">
          <p className="text-center text-sm font-semibold tracking-wide text-gray-800 uppercase mb-px">
            {product.productName}
          </p>
          <div className="relative aspect-square rounded-lg overflow-hidden">
            {product.productAsset ? (
              <Image
                src={product.productAsset.preview}
                alt={product.productName}
                fill
                className="w-full transition-transform duration-500"
                // sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {t("noImage")}
              </div>
            )}
            <button
              //   onClick={() => {console.log('handle add to card')}}
              className={`absolute top-10 right-12 ${
                true ? "bg-[#A3B18A]" : "bg-[#D9E4DD] hover:bg-[#C0C8B6]"
              } text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A3B18A]`}
            >
              {true ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
            <div className="absolute bottom-4 right-4">
              <div className="relative inline-flex items-center rounded-r-md bg-[#555B46] px-4 py-2 pr-4 text-sm font-bold text-white">
                {/* <span className="z-10">{priceValue} </span> */}
                {product.priceWithTax.__typename === "PriceRange" ? (
                  product.priceWithTax.min !== product.priceWithTax.max ? (
                    <>
                      <span className="text-xs font-normal text-muted-foreground mr-1">
                        {t("from")}
                      </span>
                      <Price
                        value={product.priceWithTax.min}
                        currencyCode={product.currencyCode}
                      />
                    </>
                  ) : (
                    <Price
                      value={product.priceWithTax.min}
                      currencyCode={product.currencyCode}
                    />
                  )
                ) : product.priceWithTax.__typename === "SinglePrice" ? (
                  <Price
                    value={product.priceWithTax.value}
                    currencyCode={product.currencyCode}
                  />
                ) : null}
                <div
                  className="absolute  w-0 h-0"
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
