import { ProductCarousel } from "@/components/commerce/product-carousel";
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
        <ProductCarousel
            title={t('relatedProducts')}
            products={products}
        />
    );
}
