import type { Metadata } from "next";
import { Suspense } from "react";
import { getRouteLocale } from "@/i18n/server";
import { getActiveCurrencyCode } from "@/lib/currency-server";
import { HeroSection } from "@/components/layout/hero-section";
import { ProductGridSkeleton } from "@/components/shared/product-grid-skeleton";
import { CategoryProductSections } from "@/components/commerce/category-product-sections";
import { SITE_NAME, SITE_URL, buildCanonicalUrl } from "@/lib/metadata";
import { getTranslations } from "next-intl/server";
import { toOgLocale } from "@/i18n/locale-utils";
import { query } from "@/lib/vendure/api";
import {
  GetTopCollectionsQuery,
  SearchProductsQuery,
} from "@/lib/vendure/queries";

const PAGE_SIZE = 10;

function searchInput(collectionSlug: string) {
  return {
    take: 100,
    skip: 0,
    groupByProduct: true,
    sort: { name: "ASC" as const },
    collectionSlug,
  };
}

async function HomeProducts() {
  const locale = await getRouteLocale();
  const currencyCode = await getActiveCurrencyCode();

  const collectionsResult = await query(GetTopCollectionsQuery, undefined, {
    languageCode: locale,
    currencyCode,
  });
  const collections = collectionsResult.data.collections.items;

  // Fetch all products for every collection in parallel.
  const allSections = await Promise.all(
    collections.map(async (c) => {
      const res = await query(
        SearchProductsQuery,
        { input: searchInput(c.slug) },
        { languageCode: locale, currencyCode },
      );
      return { id: c.slug, name: c.name, items: res.data.search.items, totalItems: res.data.search.totalItems };
    }),
  );

  // Only render sections that actually have products.
  const sections = allSections.filter((s) => s.items.length > 0);

  return (
    <section
      id="products"
      className="mx-auto max-w-7xl px-3 pb-20 pt-6 sm:px-4 lg:px-8"
    >
      <CategoryProductSections sections={sections} pageSize={PAGE_SIZE} />
    </section>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Suspense fallback={<ProductGridSkeleton />}>
        <HomeProducts />
      </Suspense>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRouteLocale();
  const t = await getTranslations({ locale, namespace: "Home" });
  const ogLocale = toOgLocale(locale);

  return {
    title: {
      absolute: `${SITE_NAME} - ${t("pageTitle")}`,
    },
    description: t("description"),
    alternates: {
      canonical: buildCanonicalUrl("/"),
    },
    openGraph: {
      title: `${SITE_NAME} - ${t("pageTitle")}`,
      description: t("ogDescription"),
      type: "website",
      locale: ogLocale,
      url: SITE_URL,
    },
  };
}
