import {Suspense} from "react";
import {getRouteLocale} from "@/i18n/server";
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {ProductGridSkeleton} from "@/components/shared/product-grid-skeleton";
import {ProductGrid} from "@/components/commerce/product-grid";
import {SearchControls} from "@/components/commerce/search-controls";
import type {CategoryTab} from "@/components/commerce/category-tabs-bar";
import {buildSearchInput, getCurrentPage} from "@/lib/search-helpers";
import {query} from "@/lib/vendure/api";
import {SearchProductsQuery} from "@/lib/vendure/queries";
import {getTopCollections} from "@/lib/vendure/cached";
import {getTranslations} from "next-intl/server";

interface SearchResultsProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        query?: string;
        cat?: string;
    }>
}

export async function SearchResults({searchParams}: SearchResultsProps) {
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const page = getCurrentPage(searchParamsResolved);

    const t = await getTranslations({locale, namespace: 'Product'});
    const collections = await getTopCollections(locale);
    const categories: CategoryTab[] = [
        {id: 'all', name: t('allProducts')},
        ...collections.map(c => ({id: c.slug, name: c.name})),
    ];

    const activeCategory = searchParamsResolved.cat && searchParamsResolved.cat !== 'all'
        ? searchParamsResolved.cat
        : undefined;

    const productDataPromise = query(SearchProductsQuery, {
        input: buildSearchInput({
            searchParams: searchParamsResolved,
            collectionSlug: activeCategory,
        })
    }, {languageCode: locale, currencyCode});


    return (
        <div>
            <SearchControls categories={categories}/>
            <div className="mt-8">
                <Suspense fallback={<ProductGridSkeleton/>}>
                    <ProductGrid productDataPromise={productDataPromise} currentPage={page} take={12}/>
                </Suspense>
            </div>
        </div>
    )
}