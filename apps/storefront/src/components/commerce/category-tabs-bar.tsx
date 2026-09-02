"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import {
  getNavbarHidden,
  subscribeNavbarHidden,
} from "@/lib/navbar-scroll";

export interface CategoryTab {
  id: string;
  name: string;
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
}

export function CategoryTabsBar({
  categories,
  activeId,
  onSelect,
  query,
  onQueryChange,
  onSubmit,
  searchInputProps,
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
    const navLeft = nav.getBoundingClientRect().left;
    const btnLeft = button.getBoundingClientRect().left;
    const btnWidth = button.getBoundingClientRect().width;
    const hiddenLeft = btnLeft - navLeft;
    const hiddenRight = navLeft + nav.clientWidth - (btnLeft + btnWidth);
    if (hiddenRight < 0) {
      nav.scrollBy({ left: hiddenRight, behavior: "smooth" });
    } else if (hiddenLeft < 0) {
      nav.scrollBy({ left: hiddenLeft, behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <div
      className={`sticky z-30 rounded-2xl border border-stone-200/70 bg-white/80 p-2 shadow-lg shadow-stone-900/[0.06] backdrop-blur-xl transition-all duration-300 ${
        navbarHidden ? "top-0" : "top-20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
          className="relative w-full shrink-0 sm:w-auto"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`${t("searchIn")} ${t("products")}`.trim()}
            className="h-9 w-full rounded-full border-transparent bg-stone-100/90 pl-9 pr-3 text-sm text-stone-700 shadow-inner placeholder:text-stone-400 transition-all focus-visible:border-transparent focus-visible:bg-white focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 sm:w-56"
            {...searchInputProps}
          />
        </form>

        <div
          className="mx-1 hidden h-6 w-px bg-gradient-to-b from-transparent via-stone-300 to-transparent sm:block"
          aria-hidden="true"
        />

        <nav
          ref={navRef}
          aria-label={t("categories")}
          className="flex flex-1 items-center gap-1 overflow-x-auto rounded-full bg-stone-100/80 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/[0.04]"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}