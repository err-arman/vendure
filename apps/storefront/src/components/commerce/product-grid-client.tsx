'use client';

import {useState} from 'react';
import {ProductCard} from './product-card';
import {Button} from '@/components/ui/button';
import {useTranslations} from 'next-intl';
import {FragmentOf} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import type {LoadMoreQuery} from '@/app/api/products/page/route';

interface ProductGridClientProps {
    items: Array<FragmentOf<typeof ProductCardFragment>>;
    totalItems: number;
    query: LoadMoreQuery;
}

type LoadMoreItem = FragmentOf<typeof ProductCardFragment>;

const STEP = 8;

export function ProductGridClient({items, totalItems, query}: ProductGridClientProps) {
    const t = useTranslations('Product');
    const [visibleItems, setVisibleItems] = useState<LoadMoreItem[]>(items);
    const [loading, setLoading] = useState(false);

    const loadedCount = visibleItems.length;
    const hasMore = loadedCount < totalItems;

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const response = await fetch('/api/products/page', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...query,
                    skip: loadedCount,
                    take: STEP,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to load more products');
            }
            const data = await response.json();
            setVisibleItems((prev) => [...prev, ...data.items]);
        } catch {
            // Non-fatal: keep the current items, allow retry.
        } finally {
            setLoading(false);
        }
    };

    if (visibleItems.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">{t('noProductsFound')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((product, i) => (
                    <ProductCard
                        key={'product-grid-item' + i}
                        product={product}
                        collectionSlug={query.collectionSlug}
                    />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center pt-2">
                    <span className="animate-pulse text-sm text-muted-foreground">
                        {t('loading')}
                    </span>
                </div>
            )}

            {!loading && hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={loadMore}>
                        {t('loadMore')}
                    </Button>
                </div>
            )}
        </div>
    );
}
