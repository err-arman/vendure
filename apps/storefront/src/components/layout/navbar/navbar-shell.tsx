"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getNavbarHidden,
  setNavbarHidden,
  subscribeNavbarHidden,
} from "@/lib/navbar-scroll";

const HIDE_THRESHOLD = 80;

export function NavbarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onScroll = () => {
      setNavbarHidden(window.scrollY > HIDE_THRESHOLD);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setNavbarHidden(false);
    };
  }, []);

  const hidden = useSyncExternalStore(
    subscribeNavbarHidden,
    getNavbarHidden,
    () => false,
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {children}
    </header>
  );
}
