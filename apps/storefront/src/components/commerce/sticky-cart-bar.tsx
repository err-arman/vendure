"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/providers/cart-provider";

const FOOTER_REVEAL_OFFSET = 24;

interface StickyCartBarProps {
  show: boolean;
}

export function StickyCartBar({ show }: StickyCartBarProps) {
  const t = useTranslations("Cart");
  const { itemCount } = useCart();
  const [nearBottom, setNearBottom] = useState(false);

  // Keep the footer visible: hide the fixed bar once the user scrolls close
  // to the bottom of the page, otherwise it would overlay the footer.
  useEffect(() => {
    const onScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setNearBottom(scrolled >= scrollable - FOOTER_REVEAL_OFFSET);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const isHidden = !show || nearBottom || itemCount === 0;

  return (
    <Link
      href="/cart"
      aria-hidden={isHidden}
      tabIndex={isHidden ? -1 : 0}
      className={`fixed bottom-0 left-0 z-40 block w-full transition-transform duration-300 sm:hidden ${
        isHidden ? "pointer-events-none translate-y-full" : "translate-y-0"
      }`}
    >
      <span className="flex h-14 w-full items-center justify-center gap-2 bg-primary text-base font-semibold text-primary-foreground">
        <ShoppingCart className="h-5 w-5" />
        {t("stickyBar")} ({itemCount})
      </span>
    </Link>
  );
}
