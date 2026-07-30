import type {Metadata} from "next";
import {Suspense} from "react";
import {getRouteLocale} from "@/i18n/server";
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {HeroSection} from "@/components/layout/hero-section";
import {ProductGrid} from "@/components/commerce/product-grid";
import {ProductGridSkeleton} from "@/components/shared/product-grid-skeleton";
import {SITE_NAME, SITE_URL, buildCanonicalUrl} from "@/lib/metadata";
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/i18n/locale-utils';
import {query} from "@/lib/vendure/api";
import {SearchProductsQuery} from "@/lib/vendure/queries";
import {buildSearchInput} from "@/lib/search-helpers";

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const ogLocale = toOgLocale(locale);

    return {
        title: {
            absolute: `${SITE_NAME} - ${t('pageTitle')}`,
        },
        description: t('description'),
        alternates: {
            canonical: buildCanonicalUrl("/"),
        },
        openGraph: {
            title: `${SITE_NAME} - ${t('pageTitle')}`,
            description: t('ogDescription'),
            type: "website",
            locale: ogLocale,
            url: SITE_URL,
        },
    };
}

async function HomeProducts() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const take = 12;

    const productDataPromise = query(SearchProductsQuery, {
        input: buildSearchInput({searchParams: {}})
    }, {languageCode: locale, currencyCode});

    return (
        <section id="products" className="container mx-auto px-4 py-12 md:py-16">
            <ProductGrid productDataPromise={productDataPromise} currentPage={1} take={take}/>
        </section>
    );
}

export default async function Home() {
    return (
        <div className="min-h-screen">
            <HeroSection/>
            <Suspense fallback={<ProductGridSkeleton/>}>
                <HomeProducts/>
            </Suspense>
        </div>
    );
}
