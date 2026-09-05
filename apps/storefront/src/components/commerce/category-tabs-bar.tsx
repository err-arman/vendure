"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { getNavbarHidden, subscribeNavbarHidden } from "@/lib/navbar-scroll";

export interface CategoryTab {
  id: string;
  name: string;
  count?: number;
}

interface CategoryTabsBarProps {
  categories: CategoryTab[];
  activeId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit?: () => void;
  searchInputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  >;
  children?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function CategoryTabsBar({
  categories,
  activeId,
  onSelect,
  query,
  onQueryChange,
  onSubmit,
  searchInputProps,
  children,
  containerRef,
}: CategoryTabsBarProps) {
  const t = useTranslations("Product");
  const navRef = useRef<HTMLElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  const navbarHidden = useSyncExternalStore(
    subscribeNavbarHidden,
    getNavbarHidden,
    () => false,
  );

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
    <div
      ref={containerRef}
      className={`sticky z-30 space-y-3 bg-background/95 py-2 shadow-sm shadow-stone-950/[0.04] backdrop-blur-xl transition-all duration-300 ${
        navbarHidden ? "top-0" : "top-20"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl space-y-3 px-3 sm:px-4 lg:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
          className="relative w-full"
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`${t("searchIn")} ${t("products")}`.trim()}
            className="h-11 w-full rounded-md border-border bg-background pl-10 pr-3 text-sm text-foreground shadow-none placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            {...searchInputProps}
          />
        </form>

        <nav
          ref={navRef}
          aria-label={t("categories")}
          className="flex min-h-12 items-end gap-6 overflow-x-auto rounded-md bg-muted px-4 pt-3 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((category) => {
            const isActive = category.id === activeId;
            return (
              <button
                key={category.id}
                ref={isActive ? activeButtonRef : undefined}
                type="button"
                onClick={() => onSelect(category.id)}
                aria-current={isActive ? "true" : undefined}
                className={`relative flex h-9 shrink-0 items-start whitespace-nowrap px-0.5 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.name}
                {category.count !== undefined && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    ({category.count})
                  </span>
                )}
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
      </div>
      {children}
    </div>
  );
}
