"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FragmentOf, ResultOf, readFragment } from "@/graphql";
import { ProductCard } from "@/components/commerce/product-card";
import { CollectionTabs, type CollectionTab } from "@/components/commerce/collection-tabs";
import { StickyCartBar } from "@/components/commerce/sticky-cart-bar";
import { StickySearchBar } from "@/components/commerce/sticky-search-bar";
import { SearchInput } from "@/components/commerce/search-input";
import { SearchProductsQuery } from "@/lib/vendure/queries";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Image as ImageIcon, Search } from "lucide-react";
import { Price } from "@/components/commerce/price";
import type { SearchSuggestion } from "@/components/commerce/search-controls";

const SUGGESTION_ENDPOINT = "/api/search";
const SUGGESTION_LIMIT = 6;

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

interface CollectionProductSectionsProps {
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
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
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
                collectionSlug={id}
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

export function CollectionProductSections({
  sections,
  pageSize,
}: CollectionProductSectionsProps) {
  const t = useTranslations("Product");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "all");
  const collections: CollectionTab[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch product suggestions (debounced) from the backend as the user types.
  useEffect(() => {
    const term = query.trim();
    setHighlightIndex(-1);

    if (fetchRef.current) clearTimeout(fetchRef.current);

    if (term.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsOpen(false);
      return;
    }

    setSuggestionsLoading(true);
    fetchRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SUGGESTION_ENDPOINT}?term=${encodeURIComponent(term)}&limit=${SUGGESTION_LIMIT}`,
        );
        const data = (await res.json()) as { items?: SearchSuggestion[] };
        setSuggestions(data.items ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
      setSuggestionsOpen(true);
    }, 250);

    return () => {
      if (fetchRef.current) clearTimeout(fetchRef.current);
    };
  }, [query]);

  useEffect(() => {
    return () => {
      if (fetchRef.current) clearTimeout(fetchRef.current);
    };
  }, []);

  // Close the suggestion dropdown when clicking outside.
  useEffect(() => {
    if (!suggestionsOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [suggestionsOpen]);

  const navigateToSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams();
      if (term) params.set("query", term);
      router.push(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const navigateToProduct = useCallback(
    (slug: string) => {
      setSuggestionsOpen(false);
      router.push(`/product/${slug}`);
    },
    [router],
  );

  const handleSubmit = useCallback(() => {
    const term = query.trim();
    if (!term) return;
    setSuggestionsOpen(false);
    navigateToSearch(term);
  }, [query, navigateToSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      navigateToProduct(suggestions[highlightIndex].slug);
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
    }
  };

  const showPopover =
    suggestionsOpen && query.trim().length >= 2 && !suggestionsLoading;

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

  // Scrollspy suppression: while a tab-triggered smooth scroll is in progress
  // the IntersectionObserver would keep overriding activeId with whichever
  // section is passing through the active zone (causing the tab to "unselect").
  const suppressSpyRef = useRef(false);
  const spyCooldownRef = useRef<number | null>(null);

  // Scrollspy: highlight the section currently in view.
  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        if (suppressSpyRef.current) return;
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
        if (suppressSpyRef.current) return;
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
      if (spyCooldownRef.current) {
        window.clearTimeout(spyCooldownRef.current);
        spyCooldownRef.current = null;
      }
    };
  }, [sections]);

  const scrollToSection = useCallback((id: string) => {
    setActiveId(id);

    if (spyCooldownRef.current) {
      window.clearTimeout(spyCooldownRef.current);
    }

    const target = document.getElementById(id);
    if (!target) return;

    // Disable the scrollspy until the smooth scroll settles, so intermediate
    // sections don't overwrite the freshly-selected tab. The cooldown scales
    // with the scroll distance so long jumps aren't cut short.
    suppressSpyRef.current = true;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    const distance = Math.abs(target.getBoundingClientRect().top);
    const cooldown = Math.min(2000, Math.max(500, distance * 0.3));
    spyCooldownRef.current = window.setTimeout(() => {
      suppressSpyRef.current = false;
      spyCooldownRef.current = null;
    }, cooldown);
  }, []);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [tabsStuck, setTabsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTabsStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <StickySearchBar
        containerRef={searchContainerRef}
        content={
          <>
            <SearchInput
              query={query}
              onQueryChange={setQuery}
              onSubmit={handleSubmit}
              searchInputProps={{
                onKeyDown: handleSearchKeyDown,
                onFocus: () => {
                  if (query.trim().length >= 2) setSuggestionsOpen(true);
                },
              }}
            />
            <CollectionTabs
              collections={collections}
              activeId={activeId}
              onSelect={scrollToSection}
            />
          </>
        }
        popover={
          showPopover && (
          <div className="mx-auto w-full max-w-7xl rounded-2xl border border-border bg-popover/95 p-1.5 shadow-xl shadow-stone-900/[0.08] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => navigateToSearch(query.trim())}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {t("searchFor")}{" "}
                <span className="font-medium text-foreground">
                  {query.trim()}
                </span>
              </span>
            </button>

            {suggestions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {t("noSearchResultsShort")}
              </p>
            ) : (
              <ul className="mt-0.5">
                {suggestions.map((item, index) => (
                  <li key={item.productId}>
                    <button
                      type="button"
                      onPointerDown={() => navigateToProduct(item.slug)}
                      onMouseEnter={() => setHighlightIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                        highlightIndex === index ? "bg-muted" : ""
                      }`}
                    >
                      {item.productAsset?.preview ? (
                        <img
                          src={item.productAsset.preview}
                          alt={item.productName}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      )}
                      <span className="flex flex-1 flex-col">
                        <span className="line-clamp-1 text-sm font-medium text-foreground">
                          {item.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.priceWithTax?.__typename === "SinglePrice" ? (
                            <Price
                              value={item.priceWithTax.value ?? 0}
                              currencyCode={item.currencyCode ?? undefined}
                            />
                          ) : item.priceWithTax?.__typename === "PriceRange" ? (
                            <Price
                              value={item.priceWithTax.min ?? 0}
                              currencyCode={item.currencyCode ?? undefined}
                            />
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
    />

      <div className={tabsStuck ? "pb-20" : ""}>
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

      <StickyCartBar show={tabsStuck} />
    </>
  );
}
