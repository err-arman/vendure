import type { Metadata } from "next";
import { Suspense } from "react";
import { noIndexRobots } from "@/lib/metadata";
import { AccountNavLinks } from "@/components/account/account-nav-links";
import { getActiveCustomer } from "@/lib/vendure/actions";
import { redirect } from "@/i18n/navigation";
import { getRouteLocale } from "@/i18n/server";

export const metadata: Metadata = {
  robots: noIndexRobots(),
};

const navItems = [
  { href: "/account/orders", labelKey: "orders", icon: "Package" },
  { href: "/account/addresses", labelKey: "addresses", icon: "MapPin" },
  { href: "/account/profile", labelKey: "profile", icon: "User" },
];

export default async function AccountLayout({
  children,
}: LayoutProps<"/[locale]/account">) {
  const customer = await getActiveCustomer();
  if (!customer) {
    redirect({ href: "/sign-in", locale: await getRouteLocale() });
  }

  return (
    <div className="container mx-auto px-4 py-30">
      {/* Mobile: horizontal tab bar */}
      <div className="md:hidden mb-6">
        <Suspense>
          <AccountNavLinks items={navItems} layout="horizontal" />
        </Suspense>
      </div>

      <div className="flex gap-8">
        {/* Desktop: sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <Suspense>
            <AccountNavLinks items={navItems} layout="vertical" />
          </Suspense>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
