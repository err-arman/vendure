import {Suspense} from "react";
import {getRouteLocale} from "@/i18n/server";
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {ProductGridSkeleton} from "@/components/shared/product-grid-skeleton";
import {ProductGrid} from "@/components/commerce/product-grid";
import {SearchControls} from "@/components/commerce/search-controls";
import {buildSearchInput} from "@/lib/search-helpers";
import {query} from "@/lib/vendure/api";
import {SearchProductsQuery} from "@/lib/vendure/queries";

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

    const activeCollection = searchParamsResolved.cat && searchParamsResolved.cat !== 'all'
        ? searchParamsResolved.cat
        : undefined;

    const productDataPromise = query(SearchProductsQuery, {
        input: buildSearchInput({
            searchParams: searchParamsResolved,
            collectionSlug: activeCollection,
            take: 24,
        })
    }, {languageCode: locale, currencyCode});


    return (
        <div>
            <SearchControls/>
            <div className="mt-8">
                <Suspense fallback={<ProductGridSkeleton/>}>
                    <ProductGrid
                        productDataPromise={productDataPromise}
                        loadMoreQuery={{
                            searchParams: searchParamsResolved,
                            collectionSlug: activeCollection,
                            locale,
                            currencyCode,
                        }}
                    />
                </Suspense>
            </div>
        </div>
    )
}