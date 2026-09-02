"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FragmentOf, ResultOf, readFragment } from "@/graphql";
import { ProductCard } from "@/components/commerce/product-card";
import { CategoryTabsBar, type CategoryTab } from "@/components/commerce/category-tabs-bar";
import { SearchProductsQuery } from "@/lib/vendure/queries";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { useTranslations } from "next-intl";

type SearchItem = ResultOf<typeof SearchProductsQuery>["search"]["items"][number];
type ProductCardData = FragmentOf<typeof ProductCardFragment>;

function getProductName(item: SearchItem): string {
  return readFragment(ProductCardFragment, item as ProductCardData).productName;
}

interface Section {
  id: string;
  name: string;
  items: SearchItem[];
}

interface CategoryProductSectionsProps {
  sections: Section[];
  pageSize: number;
}

function ProductSection({
  id,
  name,
  items,
  pageSize,
}: Section & { pageSize: number }) {
  const t = useTranslations("Product");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < items.length;
  const visibleItems = items.slice(0, visibleCount);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((n) => Math.min(n + pageSize, items.length));
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, pageSize, items.length]);

  return (
    <section id={id} className="scroll-mt-36 pt-10">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-stone-900">
        {name}
      </h2>

      {visibleItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {t("noProductsFound")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((product, i) => (
              <ProductCard
                key={`${id}-product-${i}`}
                product={product}
                sectionName={name}
              />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <span className="animate-pulse text-sm text-muted-foreground">
                {t("loading")}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function CategoryProductSections({
  sections,
  pageSize,
}: CategoryProductSectionsProps) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "all");
  const categories: CategoryTab[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = normalizedQuery
    ? sections
        .map((s) => ({
          ...s,
          items: s.items.filter((item) =>
            getProductName(item).toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((s) => s.items.length > 0)
    : sections;

  // Scrollspy: highlight the section currently in view.
  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const observers: IntersectionObserver[] = [];

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );

    const headerObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -55% 0px", threshold: 0 },
    );

    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) {
        sectionObserver.observe(section);
        const heading = section.querySelector("h2");
        if (heading) headerObserver.observe(heading);
      }
    }

    return () => {
      sectionObserver.disconnect();
      headerObserver.disconnect();
    };
  }, [sections]);

  const scrollToSection = useCallback((id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <>
      <CategoryTabsBar
        categories={categories}
        activeId={activeId}
        onSelect={scrollToSection}
        query={query}
        onQueryChange={setQuery}
      />

      <div>
        {filteredSections.map((section) => (
          <ProductSection
            key={section.id}
            id={section.id}
            name={section.name}
            items={section.items}
            pageSize={pageSize}
          />
        ))}
      </div>
    </>
  );
}
