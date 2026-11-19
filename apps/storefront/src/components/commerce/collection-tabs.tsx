"use client";

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

  // Tabs wrap onto additional rows instead of scrolling horizontally, so every
  // collection stays visible at once (no arrows, no clipped tabs).
  return (
    <nav
      aria-label={t("collections")}
      className="flex min-h-12 flex-wrap items-end gap-2 rounded-md bg-muted px-2 pt-3 text-[12px]"
    >
      {collections.map((collection) => {
        const isActive = collection.id === activeId;
        return (
          <button
            key={collection.id}
            type="button"
            onClick={() => onSelect(collection.id)}
            aria-current={isActive ? "true" : undefined}
            className={`relative flex h-9 shrink-0 items-start px-2 whitespace-nowrap font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
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
  );
}
