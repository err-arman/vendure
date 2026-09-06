# Storefront Architecture Documentation

> East Bengal Coffee Roasters — Next.js 16 + Vendure Storefront  
> Generated from `apps/storefront`

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [App Router — Pages & Layouts](#app-router)
3. [Route Handlers (API)](#route-handlers)
4. [Components — Commerce](#components-commerce)
5. [Components — Layout & Navbar](#components-layout)
6. [Components — Providers](#components-providers)
7. [Components — Shared & Skeletons](#components-shared)
8. [Components — UI Primitives](#components-ui)
9. [Account Pages & Components](#account)
10. [Lib — Utilities, Actions & Vendure](#lib)
11. [i18n — Routing, Messages & Locale](#i18n)
12. [Component Usage Map](#usage-map)

---

## 1. Project Structure {#project-structure}

```
apps/storefront/
├── messages/                    # en.json, de.json — i18n translation strings
├── public/                      # Static assets (ecbr-logo.png, favicon, icons)
├── src/
│   ├── app/                     # Next.js App Router (all under [locale])
│   ├── components/
│   │   ├── account/             # Account section navigation
│   │   ├── commerce/            # Product cards, cart, search, checkout UI
│   │   ├── layout/              # Navbar, footer, hero
│   │   │   └── navbar/          # All navbar sub-components
│   │   ├── providers/           # CartProvider, ThemeProvider
│   │   ├── shared/              # Skeletons, NavigationLink, CountrySelect
│   │   └── ui/                  # 28 shadcn/Base UI primitives
│   ├── i18n/                    # next-intl routing, navigation, locale utils
│   └── lib/                     # Vendure API client, queries, mutations, helpers
│       ├── actions/             # Server actions (cart, currency)
│       └── vendure/             # GraphQL queries, mutations, fragments, cached data
```

---

## 2. App Router — Pages & Layouts {#app-router}

### Layouts

| Path | What It Does |
|------|-------------|
| `app/[locale]/layout.tsx` | **Root layout.** Validates locale, loads i18n messages, generates SEO metadata (OG, robots, hreflang). Wraps children in `NextIntlClientProvider` → `ThemeProvider` → `Suspense` → `CartProvider`. Renders persistent `Navbar`, `Footer`, and `Toaster`. Sets Geist fonts. |
| `app/[locale]/account/layout.tsx` | **Account area layout.** Redirects unauthenticated users to `/sign-in`. Renders a sidebar/tab navigation (profile, orders, addresses) with children in a main area. Sets `noindex` robots. |

### Pages

| Path | What It Does |
|------|-------------|
| `app/[locale]/page.tsx` | **Home page.** Renders `HeroSection` + `CollectionProductSections` (all collection tabs, search, and product grids). Fetches top collections with products per collection in parallel. |
| `app/[locale]/search/page.tsx` | **Search page.** Renders `SearchResults` (server component that fetches products and renders `SearchControls` + `ProductGrid`). Generates SEO metadata from `?query`/`?q` params. |
| `app/[locale]/collection/[slug]/page.tsx` | **Collection listing.** Breadcrumbs + collection title + paginated `ProductGrid`. Full SEO/OG metadata with per-locale alternates. |
| `app/[locale]/product/[slug]/page.tsx` | **Product detail.** Breadcrumbs (Home → collection → product), `ProductImageCarousel`, `ProductInfo` (options, price, add-to-cart), and `RelatedProducts`. Calls `notFound()` for unknown slugs. |
| `app/[locale]/cart/page.tsx` | **Cart page.** Renders cart items, order summary, and promotion code input. `noindex`. |
| `app/[locale]/checkout/page.tsx` | **Checkout.** Fetches active order, validates state (redirects to cart if empty, to confirmation if past payment). Loads addresses, shipping/payment methods, countries. Renders `CheckoutProvider` → `CheckoutFlow`. Supports guests. |
| `app/[locale]/order-confirmation/[code]/page.tsx` | **Order confirmation.** Wraps `OrderConfirmation` in Suspense. |
| `app/[locale]/sign-in/page.tsx` | **Sign-in.** Split layout: branded hero panel (desktop) + login form with `?redirectTo`. |
| `app/[locale]/register/page.tsx` | **Registration.** Same split layout as sign-in with `RegistrationForm`. |
| `app/[locale]/forgot-password/page.tsx` | **Forgot password.** Centered `ForgotPasswordForm`. |
| `app/[locale]/reset-password/page.tsx` | **Reset password.** Reads token from URL, renders `ResetPasswordForm`. |
| `app/[locale]/verify/page.tsx` | **Email verification.** Processes verification token from URL. |
| `app/[locale]/verify-pending/page.tsx` | **Verification pending.** Shows "check your email" message. |
| `app/[locale]/not-found.tsx` | **404 page.** Large 404 + Home/Browse Products buttons + popular collection links. |
| `app/[locale]/account/profile/page.tsx` | **Profile.** `EditProfileForm` + `EditEmailForm` + `ChangePasswordForm`. |
| `app/[locale]/account/orders/page.tsx` | **Order history.** Paginated order list (mobile cards, desktop table) with status badges. |
| `app/[locale]/account/orders/[code]/page.tsx` | **Order detail.** Fetches order by code, renders `OrderDetail`. |
| `app/[locale]/account/addresses/page.tsx` | **Address book.** Fetches addresses + countries, renders `AddressesClient`. |
| `app/[locale]/account/verify-email/page.tsx` | **Email change verify.** Processes email change token. |

### Loading States (Suspense Fallbacks)

| Path | Skeleton For |
|------|-------------|
| `app/[locale]/cart/loading.tsx` | Cart page — item rows + order summary |
| `app/[locale]/checkout/loading.tsx` | Checkout — step indicator + form + summary |
| `app/[locale]/search/loading.tsx` | Search — search bar + grid skeleton |
| `app/[locale]/collection/[slug]/loading.tsx` | Collection — sidebar + product grid |
| `app/[locale]/product/[slug]/loading.tsx` | Product detail — image + info |
| `app/[locale]/account/profile/loading.tsx` | Profile — form cards |
| `app/[locale]/account/orders/loading.tsx` | Orders — table rows |
| `app/[locale]/account/addresses/loading.tsx` | Addresses — address cards |

---

## 3. Route Handlers (API) {#route-handlers}

| Path | Method | What It Does |
|------|--------|-------------|
| `app/api/search/route.ts` | GET | **Typeahead search.** Requires `?term` (2+ chars), optional `?limit` (1–10, default 6). Returns grouped product matches as JSON. Reads locale from cookie. |
| `app/api/products/page/route.ts` | POST | **Infinite scroll / load-more.** Accepts `{ searchParams, collectionSlug, locale, currencyCode, skip, take }`. Returns `{ items, totalItems }`. |
| `app/api/revalidate/route.ts` | POST | **Cache revalidation webhook.** Requires `Authorization: Bearer <SECRET>`. Accepts `{ tags: string[] }` (max 100). Expands tags across locales/currencies and calls `revalidateTag`. |

---

## 4. Middleware / Proxy

| Path | What It Does |
|------|-------------|
| `src/proxy.ts` | **next-intl locale middleware.** Wraps `createMiddleware(routing)`. Negotiates/redirections locale. Matcher excludes `/api`, `/_next`, `/_vercel`, and static files. |

---

## 5. Components — Commerce {#components-commerce}

### Search & Tabs

| Component | File | What It Does | Used Where |
|-----------|------|-------------|-----------|
| `StickySearchBar` | `sticky-search-bar.tsx` | Thin sticky shell: positions content at top (or below navbar), accepts a `content` slot and a `popover` slot. Manages top-0/top-20 offset based on navbar scroll state. | Home page (`CollectionProductSections`), Search page (`SearchControls`) |
| `SearchInput` | `search-input.tsx` | Presentational search form with magnifier icon and controlled input. Takes `query`, `onQueryChange`, `onSubmit`, `searchInputProps`. | Home page, Search page (both inside `StickySearchBar`) |
| `CollectionTabs` | `collection-tabs.tsx` | Horizontally scrollable row of collection tabs with chevron scroll controls and scrollspy auto-scroll to keep active tab visible. | Home page (inside `StickySearchBar`) |
| `CollectionProductSections` | `collection-product-sections.tsx` | **Home page product sections.** Composes `StickySearchBar` + `SearchInput` + `CollectionTabs` + suggestion popover. Manages scrollspy, active tab, suggestion fetch, keyboard nav, `filteredSections`, sticky cart bar. | `app/[locale]/page.tsx` |
| `SearchControls` | `search-controls.tsx` | **Search page controller.** Composes `StickySearchBar` + `SearchInput` + suggestion popover + `StickyCartBar`. Manages debounced suggestion fetch, keyboard nav, outside-click dismiss. | `app/[locale]/search/search-results.tsx` |

### Products & Cart

| Component | File | What It Does | Used Where |
|-----------|------|-------------|-----------|
| `ProductCard` | `product-card.tsx` | Single product card — desktop (image, name, price badge, cart button) + mobile (row layout). Shows "Out of stock" label in red when `inStock` is false. | Home page sections, Search results, Collection listing, Related products |
| `ProductCardAction` | `product-card-action.tsx` | Cart button on product cards. Toggles checkmark when in cart. Opens `VariantPickerDialog`. Disabled + ghost style when out of stock. | `ProductCard` (both desktop and mobile) |
| `VariantPickerDialog` | `variant-picker-dialog.tsx` | Dialog that loads product variants, lets user pick options + quantity, adds to cart via server action. Shows price, stock status, loading/error states. | `ProductCardAction` (on card click) |
| `ProductInfo` | `product-info.tsx` | Product detail panel: title, price, description, radio-button option pickers (synced with URL), stock status, SKU, add-to-cart button. | `app/[locale]/product/[slug]/page.tsx` |
| `ProductImageCarousel` | `product-image-carousel.tsx` | Client-side image carousel: main zoomable image, prev/next arrows, image counter, thumbnail grid. | `app/[locale]/product/[slug]/page.tsx` |
| `ProductGrid` | `product-grid.tsx` | **Server component.** Awaits product search results, delegates to `ProductGridClient` or shows no-results. | Collection page, Search results, Home page (via sections) |
| `ProductGridClient` | `product-grid-client.tsx` | Responsive product grid with "Load more" button. Fetches paginated results from `/api/products/page`. | `ProductGrid` |
| `RelatedProducts` | `related-products.tsx` | **Server component.** Fetches up to 12 products from same collection (excluding current), renders grid. | `app/[locale]/product/[slug]/page.tsx` |
| `StickyCartBar` | `sticky-cart-bar.tsx` | Fixed bottom mobile-only bar linking to `/cart` with item count. Hidden when empty, near bottom, or `show=false`. | Home page, Search page |
| `Price` | `price.tsx` | Formats a price value (minor units ÷ 100) as localized currency via `Intl.NumberFormat`. | Throughout (cards, dialogs, detail, cart) |
| `OrderStatusBadge` | `order-status-badge.tsx` | Colored badge with icon + translated label for Vendure order states. | Order history, Order detail |

---

## 6. Components — Layout & Navbar {#components-layout}

### Top-Level Layout

| Component | File | What It Does | Used Where |
|-----------|------|-------------|-----------|
| `Navbar` | `navbar.tsx` | **Server component.** Composes the fixed top bar: logo, currency picker, theme switcher, cart icon, user menu, mobile nav. Wrapped in `NavbarShell`. | `app/[locale]/layout.tsx` |
| `Footer` | `footer.tsx` | **Server component.** Copyright line + "Powered by" brand badge. Fully cached per locale. | `app/[locale]/layout.tsx` |
| `HeroSection` | `hero-section.tsx` | **Server component.** Full-width hero banner with background image, dark overlay, circular logo medallion, "Freshly Roasted" badge, title, subtitle. | `app/[locale]/page.tsx` |

### Navbar Sub-Components

| Component | File | What It Does | Used Where |
|-----------|------|-------------|-----------|
| `NavbarShell` | `navbar-shell.tsx` | Client wrapper: hides navbar by translating it away when scrolled past 80px. Synced via shared external store (`navbar-scroll.ts`). | `Navbar` |
| `ThemeLogo` | `theme-logo.tsx` | Server component. Renders brand logo image (`ecbr-logo.png`, h-12). | `Navbar` |
| `CartIcon` | `cart-icon.tsx` | Icon button linking to `/cart` with red badge showing item count. | `Navbar` |
| `NavbarCart` | `navbar-cart.tsx` | **Server component.** Queries active order's total quantity (cached), renders `CartIcon`. | `Navbar` (via Suspense) |
| `NavbarUser` | `navbar-user.tsx` | **Server component.** Fetches active customer. Renders sign-in button (logged out) or desktop dropdown + mobile profile modal (logged in). | `Navbar` (via Suspense) |
| `LoginButton` | `login-button.tsx` | Button: navigates to `/sign-in` when logged out, runs `logoutAction` when logged in. | `NavbarUser`, `UserProfileModal` |
| `UserProfileModal` | `user-profile-modal.tsx` | Mobile dialog: shows avatar, name, contact info, links to orders/profile, sign-out button. | `NavbarUser` |
| `MobileNav` | `mobile-nav.tsx` | Slide-out left sheet: logo, Shop All link, collection links, account links or sign-in/register buttons. | `MobileNavWrapper` |
| `MobileNavWrapper` | `mobile-nav-wrapper.tsx` | **Server component.** Loads top collections + active customer, renders `MobileNav`. | `Navbar` |
| `ThemeSwitcher` | `theme-switcher.tsx` | Dropdown: sun/moon icons, switch between light/dark/system via `next-themes`. | `Navbar` |
| `CurrencyPicker` | `currency-picker.tsx` | Dropdown for switching active currency via `switchCurrency` server action. Returns null if only one currency available. | `CurrencyPickerWrapper` |
| `CurrencyPickerWrapper` | `currency-picker-wrapper.tsx` | **Server component.** Reads active channel currencies + current cookie, renders `CurrencyPicker`. Intentionally uncached (dynamic). | `Navbar` |

---

## 7. Components — Providers {#components-providers}

| Component | File | What It Does | Used Where |
|-----------|------|-------------|-----------|
| `ThemeProvider` | `providers/theme-provider.tsx` | Wraps `next-themes` ThemeProvider: `attribute="class"`, system default, no transition. | `app/[locale]/layout.tsx` |
| `CartProvider` | `providers/cart-provider.tsx` | Provides cart context: `productIds`, `itemCount`, `isInCart()`, `addProduct()`, `refresh()`. Backed by `getActiveOrderProductIds` server action. | `app/[locale]/layout.tsx` |
| `CheckoutProvider` | `checkout/checkout-provider.tsx` | Server-data-driven context for checkout: order, addresses, countries, shipping/payment methods, guest status. Manages `selectedPaymentMethodCode`. | `app/[locale]/checkout/page.tsx` |

---

## 8. Components — Shared & Skeletons {#components-shared}

| Component | File | What It Does | Used Where |
|-----------|------|-------------|-----------|
| `NavigationLink` | `shared/navigation-link.tsx` | Locale-aware `next/link` wrapper for server components. Prefixes current route locale onto href. | Server components needing locale-aware links |
| `CountrySelect` | `shared/country-select.tsx` | Combobox popover (using `Command`) for picking a country from a searchable list. | Checkout, Address form |
| `ProductGridSkeleton` | `shared/product-grid-skeleton.tsx` | Loading placeholder: heading bar + 12 pulsing card skeletons. | `ProductGrid`, `SearchResultsSkeleton` |
| `SearchResultsSkeleton` | `shared/skeletons/search-results-skeleton.tsx` | Loading layout: pulsing filters sidebar + `ProductGridSkeleton`. | `app/[locale]/search/loading.tsx` |
| `NavbarUserSkeleton` | `shared/skeletons/navbar-user-skeleton.tsx` | Small skeleton placeholder for navbar user area. | `Navbar` Suspense fallback |
| `CartSkeleton` | `shared/skeletons/cart-skeleton.tsx` | Loading placeholder: 3 item-row skeletons + order-summary sidebar. | `app/[locale]/cart/loading.tsx` |

---

## 9. Components — UI Primitives {#components-ui}

All 28 UI primitives live in `components/ui/`. Built on **Base UI** (`@base-ui/react`) with **class-variance-authority** for variants.

| Component | Exports | Description |
|-----------|---------|-------------|
| `accordion` | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Collapsible accordion panels with chevron icons |
| `alert` | `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction` | Inline alert banner (default/destructive) |
| `alert-dialog` | `AlertDialog`, `AlertDialogTrigger/Content/Overlay/Portal`, `AlertDialogHeader/Footer/Title/Description/Media`, `AlertDialogAction/Cancel` | Confirmation modal with backdrop blur |
| `avatar` | `Avatar`, `AvatarImage/Fallback/Badge/Group/GroupCount` | User avatar (sm/default/lg) with fallback, badge, group |
| `badge` | `Badge`, `badgeVariants` | Inline badge/tag (6 variants: default/secondary/destructive/outline/ghost/link) |
| `breadcrumb` | `Breadcrumb`, `BreadcrumbList/Item/Link/Page/Separator/Ellipsis` | Breadcrumb navigation |
| `button` | `Button`, `buttonVariants` | Button (6 variants × 8 sizes) |
| `card` | `Card`, `CardHeader/Footer/Title/Action/Description/Content` | Card container with structured slots |
| `checkbox` | `Checkbox` | Checkbox with check indicator |
| `collapsible` | `Collapsible`, `CollapsibleTrigger/Content` | Simple show/hide panel |
| `command` | `Command`, `CommandDialog/Input/List/Empty/Group/Item/Shortcut/Separator` | Command palette / searchable list (cmdk) |
| `dialog` | `Dialog`, `DialogTrigger/Close/Content/Overlay/Portal`, `DialogHeader/Footer/Title/Description` | General-purpose modal |
| `dropdown-menu` | `DropdownMenu`, `DropdownMenuTrigger/Content/Group/Label/Item/CheckboxItem/RadioGroup/RadioItem/Separator/Shortcut/Sub/SubTrigger/SubContent/Portal` | Full dropdown/context menu |
| `field` | `Field`, `FieldSet/Legend/Group/Content/Label/Title/Description/Separator/Error` | Form field layout primitives |
| `form` | `Form`, `FormField`, `FormItem/Label/Control/Description/Message`, `useFormField` | React Hook Form integration |
| `input` | `Input` | Basic text input |
| `input-group` | `InputGroup`, `InputGroupAddon/Button/Text/Input/Textarea` | Composable input group with addons |
| `label` | `Label` | Form label |
| `pagination` | `Pagination`, `PaginationContent/Item/Link/Previous/Next/Ellipsis` | Pagination navigation |
| `password-input` | `PasswordInput` | Password field with show/hide toggle |
| `popover` | `Popover`, `PopoverTrigger/Content/Header/Title/Description` | Popover tooltip/dropdown panel |
| `radio-group` | `RadioGroup`, `RadioGroupItem` | Radio button group with circular indicator |
| `separator` | `Separator` | Horizontal/vertical divider |
| `sheet` | `Sheet`, `SheetTrigger/Close/Content/Portal/Overlay`, `SheetHeader/Footer/Title/Description` | Slide-out drawer (all 4 sides) |
| `skeleton` | `Skeleton` | Pulsing loading placeholder |
| `sonner` | `Toaster` | Toast notification provider (sonner) |
| `table` | `Table`, `TableHeader/Body/Footer/Head/Row/Cell/Caption` | Data table components |
| `textarea` | `Textarea` | Multiline auto-resize textarea |

---

## 10. Account Pages & Components {#account}

### Account Layout
- `app/[locale]/account/layout.tsx` — Server component. Fetches customer, redirects if unauthenticated. Renders sidebar (desktop) / tab bar (mobile) with links to profile/orders/addresses. Children in `<main>`.

### Account Component

| Component | File | What It Does |
|-----------|------|-------------|
| `AccountNavLinks` | `account/account-nav-links.tsx` | Renders nav items (profile/orders/addresses) as horizontal tabs or vertical sidebar. Highlights active route. |

### Account Pages (see [Pages](#pages) above for details)
- **Profile** — EditProfileForm, EditEmailForm, ChangePasswordForm
- **Orders** — Paginated order list with status badges (mobile cards, desktop table)
- **Order Detail** — Full order view with items, addresses, payments
- **Addresses** — Address list + add/edit/delete forms with CountrySelect
- **Verify Email** — Email change verification

---

## 11. Lib — Utilities, Actions & Vendure {#lib}

### Core Utilities

| File | What It Does |
|------|-------------|
| `lib/utils.ts` | `cn()` — `clsx` + `tailwind-merge` class combiner |
| `lib/format.ts` | `formatDate()` — locale-aware date formatting (short/long) |
| `lib/metadata.ts` | SEO helpers: `SITE_NAME`, `SITE_URL`, `truncateDescription()`, `buildCanonicalUrl()`, `buildOgImages()`, `noIndexRobots()` |
| `lib/navbar-scroll.ts` | Client pub/sub store for navbar hide/show state |
| `lib/search-helpers.ts` | `buildSearchInput()` — maps URL params to Vendure SearchInput; `getCurrentPage()` |
| `lib/auth.ts` | Server-only auth token cookie management (`set/`get/`removeAuthToken`) |
| `lib/currency.ts` | Client/server currency cookie helpers |
| `lib/currency-server.ts` | `getActiveCurrencyCode()` — resolves currency from cookie, validates against channel |

### Server Actions (`lib/actions/`)

| File | Actions |
|------|---------|
| `cart.ts` | `getActiveOrderProductIds()`, `addFirstVariantToCart()`, `getProductForPicker()`, `addVariantToCart()` |
| `switch-currency.ts` | `switchCurrency()` — validates currency, sets cookie, invalidates caches |

### Vendure API Client (`lib/vendure/`)

| File | What It Does |
|------|-------------|
| `api.ts` | **GraphQL client.** `query()` and `mutate()` — POSTs to Vendure Shop API with auth token, channel header, locale/currency params. Returns `{data, token?}`. |
| `fragments.ts` | `ProductCardFragment` (SearchResult: productId, name, slug, description, inStock, asset, price, currency), `ActiveCustomerFragment` (id, name, email, phone) |
| `queries.ts` | 15+ query documents: search, product detail, variants, picker, active order, checkout, addresses, orders, countries, channel, collections |
| `mutations.ts` | 20+ mutation documents: login/logout, cart ops, order state transitions, payment, customer CRUD, password reset, email verification |
| `cached.ts` | `getActiveChannelCached()`, `getAvailableCountriesCached()`, `getTopCollections()` — Next `'use cache'` with `cacheLife`/`cacheTag` |
| `actions.ts` | `getActiveCustomer` — React `cache()`d server function |
| `product-options.ts` | `getDisplayOptionGroups()` — filters out phantom option groups that have no variant |

---

## 12. i18n — Routing, Messages & Locale {#i18n}

### Files

| File | What It Does |
|------|-------------|
| `i18n/routing.ts` | Defines routing: `locales: ['en', 'de']`, `defaultLocale: 'en'`, `localePrefix: 'as-needed'` |
| `i18n/request.ts` | `getRequestConfig` — validates locale, loads `messages/{locale}.json` |
| `i18n/navigation.ts` | Re-exports `Link`, `redirect`, `usePathname`, `useRouter` from `createNavigation(routing)` |
| `i18n/server.ts` | `getRouteLocale()` — safe locale getter for server components/cache |
| `i18n/locale-utils.ts` | `toOgLocale()` (en→en_US), `toIntlLocale()` (en→en-US) |

### Message Namespaces (en.json / de.json)

`Navigation`, `Hero`, `Home`, `Product`, `Sort`, `Filters`, `Cart`, `Checkout`, `OrderStatus`, `Auth`, `Search`, `Verify`, `OrderConfirmation`, `Account`, `NotFound`, `Footer`, `Common`, `Errors`

---

## 13. Component Usage Map {#usage-map}

Shows where each component is rendered (parent → child relationships).

```
app/[locale]/layout.tsx
├── NextIntlClientProvider
│   └── ThemeProvider
│       └── CartProvider
│           ├── Navbar (server)
│           │   └── NavbarShell (client)
│           │       ├── ThemeLogo (server) — logo
│           │       ├── CurrencyPickerWrapper (server)
│           │       │   └── CurrencyPicker
│           │       ├── ThemeSwitcher
│           │       ├── NavbarCart (server)
│           │       │   └── CartIcon
│           │       ├── NavbarUser (server)
│           │       │   ├── LoginButton (logged out)
│           │       │   ├── DropdownMenu (logged in, desktop)
│           │       │   └── UserProfileModal (logged in, mobile)
│           │       └── MobileNavWrapper (server)
│           │           └── MobileNav (client)
│           │               ├── ThemeLogo (sheet header)
│           │               ├── SheetClose → Link /search
│           │               ├── Collection links
│           │               └── Account links / Auth buttons
│           ├── Footer (server)
│           └── Toaster (sonner)

app/[locale]/page.tsx (Home)
├── HeroSection (server)
└── CollectionProductSections (server → client)
    ├── StickySearchBar
    │   ├── SearchInput
    │   ├── CollectionTabs
    │   └── Suggestion popover
    ├── ProductSection[] (per collection)
    │   └── ProductCard[] (desktop + mobile)
    │       └── ProductCardAction
    │           └── VariantPickerDialog
    └── StickyCartBar

app/[locale]/search/page.tsx
└── SearchResults (server)
    ├── SearchControls (client)
    │   ├── StickySearchBar
    │   │   └── SearchInput
    │   ├── Suggestion popover
    │   └── StickyCartBar
    └── ProductGrid (server)
        └── ProductGridClient (client)
            └── ProductCard[] → ProductCardAction → VariantPickerDialog

app/[locale]/collection/[slug]/page.tsx
├── Breadcrumb
└── ProductGrid (server)
    └── ProductGridClient → ProductCard[] → ProductCardAction → VariantPickerDialog

app/[locale]/product/[slug]/page.tsx
├── Breadcrumb
├── ProductImageCarousel
├── ProductInfo
│   └── VariantPickerDialog (on add to cart)
└── RelatedProducts (server)
    └── ProductCard[] → ProductCardAction → VariantPickerDialog

app/[locale]/cart/page.tsx
├── CartSkeleton (loading)
└── Cart items + order summary (client)

app/[locale]/checkout/page.tsx
├── CheckoutProvider
└── CheckoutFlow
    ├── ShippingAddressStep
    ├── ShippingMethodStep
    ├── PaymentStep
    └── ReviewStep

app/[locale]/account/layout.tsx
├── AccountNavLinks (tabs/sidebar)
└── {children} (profile / orders / addresses)

app/[locale]/account/profile/page.tsx
├── EditProfileForm
├── EditEmailForm
└── ChangePasswordForm

app/[locale]/account/orders/page.tsx
└── Order list (mobile cards, desktop table)
    └── OrderStatusBadge

app/[locale]/account/orders/[code]/page.tsx
└── OrderDetail

app/[locale]/account/addresses/page.tsx
└── AddressesClient
    ├── Address list
    └── AddressForm
        └── CountrySelect
```

---

## Key Patterns

- **Server components first**: Pages and wrappers are server components; only interactive widgets (`CollectionProductSections`, `SearchControls`, `ProductCard`, etc.) use `"use client"`.
- **Vendure GraphQL**: All data fetching goes through `lib/vendure/api.ts` (`query`/`mutate`) with typed `gql.tada` documents.
- **Caching**: Server-side data uses Next.js `'use cache'` with `cacheLife`/`cacheTag`. Cart state uses server actions with tag invalidation.
- **i18n**: All user-facing strings live in `messages/{locale}.json`. Locale negotiation via `proxy.ts` middleware.
- **Responsive design**: Every product card has separate desktop and mobile layouts. Navbar has mobile sheet + desktop dropdown. Checkout, orders, and profile all adapt to mobile.
- **Sticky search + tabs**: `StickySearchBar` is a thin shell; `SearchInput` and `CollectionTabs` are composable siblings inside it. The popover renders outside the content column but inside the sticky shell for proper anchoring.
