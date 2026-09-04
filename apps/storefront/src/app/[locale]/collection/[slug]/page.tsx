import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { query } from '@/lib/vendure/api';
import { SearchProductsQuery, GetCollectionProductsQuery } from '@/lib/vendure/queries';
import { ProductGrid } from '@/components/commerce/product-grid';
import { ProductGridSkeleton } from '@/components/shared/product-grid-skeleton';
import { buildSearchInput } from '@/lib/search-helpers';
import { cacheLife, cacheTag } from 'next/cache';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { routing } from '@/i18n/routing';
import {
    SITE_NAME,
    truncateDescription,
    buildCanonicalUrl,
    buildOgImages,
} from '@/lib/metadata';
import {toOgLocale} from '@/i18n/locale-utils';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

async function getCollectionProducts(slug: string, locale: string, searchParams: { [key: string]: string | string[] | undefined }, currencyCode: string) {
    'use cache';
    cacheLife('hours');

    cacheTag(`collection-${slug}-${locale}-${currencyCode}`);
    cacheTag('collection');

    return query(SearchProductsQuery, {
        input: buildSearchInput({
            searchParams,
            collectionSlug: slug,
            take: 24,
        })
    }, {languageCode: locale, currencyCode});
}

async function getCollectionMetadata(slug: string, locale: string) {
    'use cache';
    cacheLife('hours');

    cacheTag(`collection-meta-${slug}-${locale}`);

    return query(GetCollectionProductsQuery, {
        slug,
        input: { take: 0, collectionSlug: slug, groupByProduct: true },
    }, {languageCode: locale});
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/collection/[slug]'>): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getRouteLocale();
    const result = await getCollectionMetadata(slug, locale);
    const collection = result.data.collection;

    const t = await getTranslations({locale, namespace: 'Product'});

    if (!collection) {
        return {
            title: t('collectionNotFound'),
        };
    }

    const description =
        truncateDescription(collection.description) ||
        t('browseCollectionAt', {name: collection.name, siteName: SITE_NAME});
    const ogLocale = toOgLocale(locale);
    const collectionPath = `/collection/${collection.slug}`;

    return {
        title: collection.name,
        description,
        alternates: {
            canonical: buildCanonicalUrl(`/${locale}${collectionPath}`),
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, buildCanonicalUrl(`/${l}${collectionPath}`)])
            ),
        },
        openGraph: {
            title: collection.name,
            description,
            type: 'website',
            locale: ogLocale,
            url: buildCanonicalUrl(`/${locale}${collectionPath}`),
            images: buildOgImages(collection.featuredAsset?.preview, collection.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: collection.name,
            description,
            images: collection.featuredAsset?.preview
                ? [collection.featuredAsset.preview]
                : undefined,
        },
    };
}

export default async function CollectionPage({params, searchParams}: PageProps<'/[locale]/collection/[slug]'>) {
    const { slug } = await params;
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});

    const productDataPromise = getCollectionProducts(slug, locale, searchParamsResolved, currencyCode);
    const collectionResult = await getCollectionMetadata(slug, locale);
    const collectionName = collectionResult.data.collection?.name ?? slug;

    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{collectionName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Collection Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{collectionName}</h1>
            </div>

            <div className="max-w-5xl mx-auto">
                <Suspense fallback={<ProductGridSkeleton />}>
                    <ProductGrid
                        productDataPromise={productDataPromise}
                        loadMoreQuery={{
                            searchParams: searchParamsResolved,
                            collectionSlug: slug,
                            locale,
                            currencyCode,
                        }}
                    />
                </Suspense>
            </div>
        </div>
    );
}
