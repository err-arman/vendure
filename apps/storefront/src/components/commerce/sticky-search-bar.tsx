"use client";

import { useSyncExternalStore } from "react";
import { getNavbarHidden, subscribeNavbarHidden } from "@/lib/navbar-scroll";

interface StickySearchBarProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /* Content rendered inside the centered max-width column (SearchInput, CollectionTabs). */
  content: React.ReactNode;
  /* Optional suggestion popover, rendered as a direct child of the sticky shell so it can anchor below the whole bar. */
  popover?: React.ReactNode;
}

export function StickySearchBar({
  containerRef,
  content,
  popover,
}: StickySearchBarProps) {
  const navbarHidden = useSyncExternalStore(
    subscribeNavbarHidden,
    getNavbarHidden,
    () => false,
  );

  return (
    <div
      ref={containerRef}
      className={`sticky z-30 space-y-3 bg-background/95 py-2 shadow-sm shadow-stone-950/[0.04] backdrop-blur-xl transition-all duration-300 ${
        navbarHidden ? "top-0" : "top-20"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl space-y-3 px-3 sm:px-4 lg:px-8">
        {content}
      </div>
      {popover}
    </div>
  );
}