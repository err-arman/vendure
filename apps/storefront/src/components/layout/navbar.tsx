import { NavigationLink } from "@/components/shared/navigation-link";
import { ThemeLogo } from "@/components/layout/navbar/theme-logo";
import { NavbarCart } from "@/components/layout/navbar/navbar-cart";
import { NavbarUser } from "@/components/layout/navbar/navbar-user";
import { ThemeSwitcher } from "@/components/layout/navbar/theme-switcher";
import { CurrencyPickerWrapper } from "@/components/layout/navbar/currency-picker-wrapper";
import { MobileNavWrapper } from "@/components/layout/navbar/mobile-nav-wrapper";
import { NavbarShell } from "@/components/layout/navbar/navbar-shell";
import { Suspense } from "react";
import { NavbarUserSkeleton } from "@/components/shared/skeletons/navbar-user-skeleton";

export function Navbar() {
  return (
    <NavbarShell>
      <div className="border-b border-stone-200/80 bg-[#f8f4ee]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="relative flex h-20 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <NavigationLink href="/" className="inline-flex shrink-0">
                <ThemeLogo />
              </NavigationLink>
            </div>

            <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
              <div className="hidden lg:flex lg:items-center lg:gap-2">
                <Suspense>
                  <CurrencyPickerWrapper />
                </Suspense>
                <Suspense>
                  <ThemeSwitcher />
                </Suspense>
              </div>
              <Suspense>
                <NavbarCart />
              </Suspense>
              <Suspense fallback={<NavbarUserSkeleton />}>
                <NavbarUser />
              </Suspense>
              <Suspense>
                <MobileNavWrapper />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </NavbarShell>
  );
}
