"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export interface CollectionTab {
  id: string;
  name: string;
}

interface CollectionTabsProps {
  collections: CollectionTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CollectionTabs({
  collections,
  activeId,
  onSelect,
}: CollectionTabsProps) {
  const t = useTranslations("Product");
  const navRef = useRef<HTMLElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    setCanScrollLeft(nav.scrollLeft > 4);
    setCanScrollRight(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4);
  }, []);

  // Reflect whether the tab row can scroll left/right (tabs overflow the
  // viewport) so the chevron controls only appear when they are needed.
  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, collections.length]);

  const scrollNav = useCallback((direction: 1 | -1) => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollBy({
      left: direction * nav.clientWidth * 0.85,
      behavior: "smooth",
    });
  }, []);

  // Keep the active button visible within the horizontally scrollable nav
  // without ever scrolling the page vertically.
  useEffect(() => {
    const nav = navRef.current;
    const button = activeButtonRef.current;
    if (!nav || !button) return;

    const navRect = nav.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const hiddenLeft = buttonRect.left - navRect.left;
    const hiddenRight = buttonRect.right - navRect.right;

    if (hiddenRight > 0) {
      nav.scrollBy({ left: hiddenRight, behavior: "smooth" });
    } else if (hiddenLeft < 0) {
      nav.scrollBy({ left: hiddenLeft, behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          aria-label={t("scrollCollectionsLeft")}
          onClick={() => scrollNav(-1)}
          className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <nav
        ref={navRef}
        onScroll={updateScrollState}
        aria-label={t("collections")}
        className="flex min-h-12 items-end gap-2 overflow-x-auto rounded-md bg-muted px-2 pt-3 text-[12px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {collections.map((collection) => {
          const isActive = collection.id === activeId;
          return (
            <button
              key={collection.id}
              ref={isActive ? activeButtonRef : undefined}
              type="button"
              onClick={() => onSelect(collection.id)}
              aria-current={isActive ? "true" : undefined}
              className={`relative flex h-9 shrink-0 items-start px-0 whitespace-nowrap font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {collection.name}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary transition-opacity duration-200 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {canScrollRight && (
        <button
          type="button"
          aria-label={t("scrollCollectionsRight")}
          onClick={() => scrollNav(1)}
          className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}