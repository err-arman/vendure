import type {ResultOf} from '@/graphql';
import {ProductGridClient} from './product-grid-client';
import {SearchProductsQuery} from "@/lib/vendure/queries";
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import type {LoadMoreQuery} from '@/app/api/products/page/route';

interface ProductGridProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
        token?: string;
    }>;
    loadMoreQuery: LoadMoreQuery;
}

export async function ProductGrid({productDataPromise, loadMoreQuery}: ProductGridProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
    const result = await productDataPromise;

    const searchResult = result.data.search;

    if (!searchResult.items.length) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">{t('noProductsFound')}</p>
            </div>
        );
    }

    return (
        <ProductGridClient
            items={searchResult.items}
            totalItems={searchResult.totalItems}
            query={loadMoreQuery}
        />
    );
}
