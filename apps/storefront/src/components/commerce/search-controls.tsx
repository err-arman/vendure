"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Image as ImageIcon, Search } from "lucide-react";
import {
  CategoryTabsBar,
  type CategoryTab,
} from "@/components/commerce/category-tabs-bar";
import { Price } from "@/components/commerce/price";
import { useTranslations } from "next-intl";

export interface SearchSuggestion {
  productId: string;
  productName: string;
  slug: string;
  productAsset?: { preview?: string | null } | null;
  priceWithTax?:
    | { __typename: "PriceRange"; min?: number | null; max?: number | null }
    | { __typename: "SinglePrice"; value?: number | null }
    | null;
  currencyCode?: string | null;
}

interface SearchControlsProps {
  categories: CategoryTab[];
}

const SUGGESTION_ENDPOINT = "/api/search";
const SUGGESTION_LIMIT = 6;

export function SearchControls({ categories }: SearchControlsProps) {
  const t = useTranslations("Product");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("cat") ?? "all";

  const [query, setQuery] = useState(
    searchParams.get("query") ?? searchParams.get("q") ?? "",
  );
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch product suggestions (debounced) as the user types.
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

  // Close the suggestion popover when clicking outside.
  useEffect(() => {
    if (!suggestionsOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [suggestionsOpen]);

  const navigateToSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) params.set("query", term);
      else params.delete("query");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router],
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

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id && id !== "all") params.set("cat", id);
    else params.delete("cat");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <div ref={containerRef} className="relative">
      <CategoryTabsBar
        categories={categories}
        activeId={activeId}
        onSelect={handleSelect}
        query={query}
        onQueryChange={handleQueryChange}
        onSubmit={handleSubmit}
        searchInputProps={{
          onKeyDown: handleKeyDown,
          onFocus: () => {
            if (query.trim().length >= 2) setSuggestionsOpen(true);
          },
        }}
      />

      {showPopover && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover/95 p-1.5 shadow-xl shadow-stone-900/[0.08] backdrop-blur-xl sm:left-0 sm:right-auto sm:w-96">
          <button
            type="button"
            onClick={() => navigateToSearch(query.trim())}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              {t("searchFor")}{" "}
              <span className="font-medium text-foreground">{query.trim()}</span>
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
    </div>
  );
}
