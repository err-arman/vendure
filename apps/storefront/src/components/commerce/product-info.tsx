'use client';

import {useState, useMemo, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Separator} from '@/components/ui/separator';
import {ShoppingCart, CheckCircle2, Check} from 'lucide-react';
import {addToCart} from '@/app/[locale]/product/[slug]/actions';
import {toast} from 'sonner';
import {Price} from '@/components/commerce/price';
import {useTranslations} from 'next-intl';
import {
    CONDITIONAL_OPTION_RULES,
    findConditionalVariant,
    getDisplayOptions,
    getVisibleOptionGroups,
    isConditionalChildGroup,
    normalizeOptionCode,
    withGrindDefaults,
    type ConditionalOptionRule,
} from '@/lib/vendure/conditional-options';

interface ProductInfoProps {
    product: {
        id: string;
        name: string;
        description: string;
        variants: Array<{
            id: string;
            name: string;
            sku: string;
            priceWithTax: number;
            stockLevel: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
                groupId: string;
                group: {
                    id: string;
                    code: string;
                    name: string;
                };
            }>;
        }>;
        optionGroups: Array<{
            id: string;
            code: string;
            name: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
            }>;
        }>;
    };
    searchParams: { [key: string]: string | string[] | undefined };
    currencyCode: string;
    conditionalRules?: ConditionalOptionRule[];
}

export function ProductInfo({product, searchParams, currencyCode, conditionalRules = CONDITIONAL_OPTION_RULES}: ProductInfoProps) {
    const t = useTranslations('Product');
    const pathname = usePathname();
    const router = useRouter();
    const currentSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isAdded, setIsAdded] = useState(false);

    // Initialize selected options from URL, applying conditional defaults
    // (Grind == Whole auto-selects the hidden `None` size; Grind Size stays
    // hidden until Ground is chosen). Group/option lookup is normalized
    // (case-insensitive, spaces/underscores as dashes).
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};

        const normalizedParams = new Map<string, string>();
        for (const [key, value] of Object.entries(searchParams)) {
            const first = Array.isArray(value) ? value[0] : value;
            if (typeof first === 'string') {
                normalizedParams.set(normalizeOptionCode(key), first);
            }
        }

        // Load from URL search params
        product.optionGroups.forEach((group) => {
            const paramValue =
                normalizedParams.get(normalizeOptionCode(group.code)) ??
                (group.name ? normalizedParams.get(normalizeOptionCode(group.name)) : undefined);
            if (typeof paramValue === 'string') {
                const normalizedValue = normalizeOptionCode(paramValue);
                const option = group.options.find(
                    (opt) =>
                        normalizeOptionCode(opt.code) === normalizedValue ||
                        (opt.name !== undefined && normalizeOptionCode(opt.name) === normalizedValue),
                );
                if (option) {
                    initialOptions[group.id] = option.id;
                }
            }
        });

        return withGrindDefaults(product.optionGroups, initialOptions, conditionalRules);
    });

    // Visible groups after applying conditional rules (Grind Size only for
    // Ground). Unaffected products render all groups.
    const visibleGroups = useMemo(
        () => getVisibleOptionGroups(product.optionGroups, selectedOptions, conditionalRules),
        [product.optionGroups, selectedOptions, conditionalRules],
    );

    // Find the matching variant for the applicable selections only. A hidden
    // Grind Size auto-selected to `None` still participates in matching.
    const selectedVariant = useMemo(() => {
        if (product.variants.length === 1) {
            return product.variants[0] ?? null;
        }

        return findConditionalVariant(product.optionGroups, product.variants, selectedOptions, conditionalRules) ?? null;
    }, [selectedOptions, product.variants, product.optionGroups, conditionalRules]);

    const handleOptionChange = (groupId: string, optionId: string) => {
        const next = withGrindDefaults(
            product.optionGroups,
            {...selectedOptions, [groupId]: optionId},
            conditionalRules,
        );
        setSelectedOptions(next);

        // Find the option group and option to get their codes
        const group = product.optionGroups.find((g) => g.id === groupId);
        const option = group?.options.find((opt) => opt.id === optionId);

        if (group && option) {
            // Update URL with option code and drop params for newly hidden
            // groups (matched by normalized alias so stale params can't linger).
            const params = new URLSearchParams(currentSearchParams);
            params.set(group.code, option.code);
            const groupById = new Map(product.optionGroups.map((g) => [g.id, g] as const));
            for (const knownGroupId of Object.keys(selectedOptions)) {
                if (!(knownGroupId in next)) {
                    const hiddenGroup = groupById.get(knownGroupId);
                    if (!hiddenGroup) continue;
                    const aliases = new Set(
                        [hiddenGroup.code, hiddenGroup.name]
                            .filter((v): v is string => typeof v === 'string')
                            .map((v) => normalizeOptionCode(v)),
                    );
                    for (const key of Array.from(params.keys())) {
                        if (aliases.has(normalizeOptionCode(key))) {
                            params.delete(key);
                        }
                    }
                }
            }
            router.push(`${pathname}?${params.toString()}`, {scroll: false});
        }
    };

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        startTransition(async () => {
            const result = await addToCart(selectedVariant.id, 1);

            if (result.success) {
                setIsAdded(true);
                toast.success(t('addedToCartMessage'), {
                    description: t('addedToCartDescription', {name: product.name}),
                });

                // Reset the added state after 2 seconds
                setTimeout(() => setIsAdded(false), 2000);
            } else {
                toast.error(t('errorTitle'), {
                    description: result.error || t('errorAddToCart'),
                });
            }
        });
    };

    const isInStock = selectedVariant && selectedVariant.stockLevel !== 'OUT_OF_STOCK';
    const canAddToCart = selectedVariant && isInStock;

    return (
        <div className="space-y-6">
            {/* Product Title & Price */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
                {selectedVariant && (
                    <p className="text-2xl md:text-3xl text-muted-foreground font-semibold mt-3">
                        <Price value={selectedVariant.priceWithTax} currencyCode={currencyCode}/>
                    </p>
                )}
            </div>

            <Separator />

            {/* Product Description */}
            <div className="prose prose-sm max-w-none text-muted-foreground">
                <div dangerouslySetInnerHTML={{__html: product.description}}/>
            </div>

            {/* Option Groups (conditionally visible; `None` size hidden for Ground) */}
            {visibleGroups.length > 0 && (
                <div className="space-y-5">
                    {visibleGroups.map((group) => {
                        const displayOptions = getDisplayOptions(group, product.optionGroups, selectedOptions, conditionalRules);

                        // Dependent groups (e.g. Grind Size) render as
                        // responsive selection cards; all other groups keep
                        // the existing segmented radio buttons.
                        if (isConditionalChildGroup(group, conditionalRules)) {
                            return (
                                <div key={group.id} className="space-y-3">
                                    <Label className="text-base font-semibold">
                                        {group.name}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
                                        {displayOptions.map((option) => {
                                            const selected = selectedOptions[group.id] === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() => handleOptionChange(group.id, option.id)}
                                                    className={`relative flex min-h-18 w-full flex-col items-center justify-center gap-0.5 rounded-xl border px-6 py-3 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                                                        selected
                                                            ? 'border-sky-500 bg-sky-50 font-medium text-gray-900 ring-1 ring-sky-500 dark:bg-sky-950/50 dark:text-foreground'
                                                            : 'border-gray-200 bg-background text-gray-900 hover:border-sky-400 hover:bg-sky-50/50 dark:border-border dark:text-foreground dark:hover:bg-sky-950/30'
                                                    }`}
                                                >
                                                    <span className="break-words">{option.name}</span>
                                                    {selected && (
                                                        <span
                                                            aria-hidden="true"
                                                            className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        return (
                        <div key={group.id} className="space-y-3">
                            <Label className="text-base font-semibold">
                                {group.name}
                            </Label>
                            <RadioGroup
                                value={selectedOptions[group.id] || ''}
                                onValueChange={(value) => handleOptionChange(group.id, value)}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {displayOptions.map((option) => (
                                        <div key={option.id}>
                                            <RadioGroupItem
                                                value={option.id}
                                                id={option.id}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={option.id}
                                                className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground peer-data-[checked]:border-primary peer-data-[checked]:ring-2 peer-data-[checked]:ring-primary/20 peer-data-[checked]:bg-primary/5 cursor-pointer transition-all"
                                            >
                                                {option.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* Stock Status */}
            {selectedVariant && (
                <div className="text-sm">
                    {isInStock ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                            <span className="h-2 w-2 rounded-full bg-green-600" />
                            {t('inStock')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            {t('outOfStock')}
                        </span>
                    )}
                </div>
            )}

            {/* Add to Cart Button */}
            <div className="pt-2 space-y-3">
                <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold rounded-lg"
                    disabled={!canAddToCart || isPending}
                    onClick={handleAddToCart}
                >
                    {isAdded ? (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5"/>
                            {t('addedToCart')}
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-5 w-5"/>
                            {isPending
                                ? t('adding')
                                : !selectedVariant && visibleGroups.length > 0
                                    ? t('selectOptions')
                                    : !isInStock
                                        ? t('outOfStock')
                                        : t('addToCart')}
                        </>
                    )}
                </Button>
            </div>

            {/* SKU */}
            {selectedVariant && (
                <div className="text-xs text-muted-foreground">
                    {t('sku', {sku: selectedVariant.sku})}
                </div>
            )}
        </div>
    );
}
