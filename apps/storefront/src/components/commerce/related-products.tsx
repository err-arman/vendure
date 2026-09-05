import { ProductCard } from "@/components/commerce/product-card";
import { getRouteLocale } from "@/i18n/server";
import { cacheLife, cacheTag } from "next/cache";
import {getActiveCurrencyCode} from '@/lib/currency-server';
import { query } from "@/lib/vendure/api";
import { GetCollectionProductsQuery, SearchProductsQuery } from "@/lib/vendure/queries";
import { readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import {getTranslations} from 'next-intl/server';
import {buildSearchInput} from "@/lib/search-helpers";

interface RelatedProductsProps {
    collectionSlug?: string;
    currentProductId: string;
}

async function getRelatedProducts(collectionSlug: string | undefined, currentProductId: string, locale: string, currencyCode: string) {
    'use cache'
    cacheLife('hours')

    cacheTag(`related-products-${collectionSlug ?? 'all'}-${locale}-${currencyCode}`);
    cacheTag('products');

    if (collectionSlug) {
        const result = await query(GetCollectionProductsQuery, {
            slug: collectionSlug,
            input: {
                collectionSlug: collectionSlug,
                take: 13,
                skip: 0,
                groupByProduct: true
            }
        }, {languageCode: locale, currencyCode});

        return result.data.search.items
            .filter(item => {
                const product = readFragment(ProductCardFragment, item);
                return product.productId !== currentProductId;
            })
            .slice(0, 12);
    }

    // Fallback: fetch all products
    const result = await query(SearchProductsQuery, {
        input: buildSearchInput({searchParams: {}})
    }, {languageCode: locale, currencyCode});

    return result.data.search.items
        .filter(item => {
            const product = readFragment(ProductCardFragment, item);
            return product.productId !== currentProductId;
        })
        .slice(0, 12);
}

export async function RelatedProducts({ collectionSlug, currentProductId }: RelatedProductsProps) {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});
    const products = await getRelatedProducts(collectionSlug, currentProductId, locale, currencyCode);

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <h2 className="mb-8 text-3xl font-bold md:text-4xl">
                    {t("relatedProducts")}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                        <ProductCard
                            key={readFragment(ProductCardFragment, product).productId}
                            product={product}
                            collectionSlug={collectionSlug}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
