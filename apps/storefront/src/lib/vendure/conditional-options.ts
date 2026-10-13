/**
 * Conditional Grind / Grind Size mechanism for product variant selectors.
 *
 * Catalog model (data-driven, no hardcoded IDs):
 * - `Grind` group has options like Whole and Ground.
 * - `Grind Size` group has real sizes plus a `None` placeholder option that
 *   exists only so Whole-grind variants resolve (Whole + None).
 *
 * Rules:
 * - Grind == Whole    -> hide the Grind Size selector, auto-select `None`
 *                        behind the scenes so the (Whole, None) variant
 *                        resolves and add-to-cart works immediately.
 * - Grind == Ground   -> show the Grind Size selector with its real values,
 *                        hiding the `None` placeholder (it is only for Whole).
 *                        Any stale `None` selection is cleared.
 * - No Grind chosen   -> Grind Size stays hidden (existing convention).
 *
 * Codes (falling back to names) are matched case-insensitively after
 * normalizing whitespace and underscores to dashes, so Admin-created groups
 * like `Grind Size`, `grind-size` or `grind_size`, and options like `None`
 * or `none`, all work without code changes.
 */

export interface ConditionalOptionRule {
    parentGroupCode: string;
    parentOptionCode: string;
    childGroupCode: string;
}

export const CONDITIONAL_OPTION_RULES: ConditionalOptionRule[] = [
    { parentGroupCode: 'grind', parentOptionCode: 'ground', childGroupCode: 'grind-size' },
    { parentGroupCode: 'grind', parentOptionCode: 'ground', childGroupCode: 'ground-size' },
];

/** Grind parent group codes (matched against code or name). */
export const GRIND_GROUP_CODES = ['grind'];
/** Grind option meaning whole bean (matched against code or name). */
export const GRIND_WHOLE_CODES = ['whole'];
/** Grind option meaning ground coffee (matched against code or name). */
export const GRIND_GROUND_CODES = ['ground'];
/** Grind Size child group codes (matched against code or name). */
export const GRIND_SIZE_GROUP_CODES = ['grind-size', 'ground-size'];
/** Placeholder size option reserved for Whole (matched against code or name). */
export const NONE_OPTION_CODES = ['none'];

interface OptionLike {
    id: string;
    code: string;
    name?: string;
}

interface OptionGroupLike {
    id: string;
    code: string;
    name?: string;
    options: OptionLike[];
}

interface VariantLike {
    options: Array<{ id: string }>;
}

export function normalizeOptionCode(code: string): string {
    return code.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function groupMatches<T extends OptionGroupLike>(group: T, code: string): boolean {
    const normalized = normalizeOptionCode(code);
    if (normalizeOptionCode(group.code) === normalized) return true;
    return group.name !== undefined && normalizeOptionCode(group.name) === normalized;
}

function optionMatches<T extends OptionLike>(option: T, code: string): boolean {
    const normalized = normalizeOptionCode(code);
    if (normalizeOptionCode(option.code) === normalized) return true;
    return option.name !== undefined && normalizeOptionCode(option.name) === normalized;
}

function findGroupByCode<T extends OptionGroupLike>(groups: T[], code: string): T | undefined {
    return groups.find((group) => groupMatches(group, code));
}

function findFirstGroup<T extends OptionGroupLike>(groups: T[], codes: string[]): T | undefined {
    for (const code of codes) {
        const found = findGroupByCode(groups, code);
        if (found) return found;
    }
    return undefined;
}

function findFirstOption<T extends OptionLike>(options: T[], codes: string[]): T | undefined {
    for (const code of codes) {
        const found = options.find((option) => optionMatches(option, code));
        if (found) return found;
    }
    return undefined;
}

function selectedOption<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    groupCode: string,
): T['options'][number] | undefined {
    const group = findGroupByCode(groups, groupCode);
    if (!group) return undefined;
    const selectedOptionId = selectedOptions[group.id];
    if (!selectedOptionId) return undefined;
    return group.options.find((option) => option.id === selectedOptionId);
}

/** True when the selected option of one of `groupCodes` matches one of `optionCodes`. */
function isOptionSelected<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    groupCodes: string[],
    optionCodes: string[],
): boolean {
    const group = findFirstGroup(groups, groupCodes);
    if (!group) return false;
    const selectedId = selectedOptions[group.id];
    if (!selectedId) return false;
    const option = group.options.find((o) => o.id === selectedId);
    if (!option) return false;
    return optionCodes.some((code) => optionMatches(option, code));
}

export function isGrindWholeSelected<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
): boolean {
    return isOptionSelected(groups, selectedOptions, GRIND_GROUP_CODES, GRIND_WHOLE_CODES);
}

export function isGrindGroundSelected<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
): boolean {
    return isOptionSelected(groups, selectedOptions, GRIND_GROUP_CODES, GRIND_GROUND_CODES);
}

function isChildVisible<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[],
    childGroupCode: string,
): boolean {
    const relevant = rules.filter(
        (rule) => normalizeOptionCode(rule.childGroupCode) === normalizeOptionCode(childGroupCode),
    );
    if (relevant.length === 0) return true;
    return relevant.some((rule) => {
        const selected = selectedOption(groups, selectedOptions, rule.parentGroupCode);
        return selected !== undefined && optionMatches(selected, rule.parentOptionCode);
    });
}

export function getVisibleOptionGroups<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[] = CONDITIONAL_OPTION_RULES,
): T[] {
    if (rules.length === 0) return groups;
    return groups.filter(
        (group) =>
            isChildVisible(groups, selectedOptions, rules, group.code) &&
            (group.name === undefined ||
                isChildVisible(groups, selectedOptions, rules, group.name)),
    );
}

/**
 * Options to render for one group. When a conditional child (Grind Size) is
 * visible — i.e. Grind == Ground — the `None` placeholder is filtered out,
 * since it exists only for Whole. In every other case all options render.
 */
export function getDisplayOptions<T extends OptionGroupLike>(
    group: T,
    groups: T[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[] = CONDITIONAL_OPTION_RULES,
): T['options'] {
    if (rules.length === 0) return group.options;
    const isConditionalChild = rules.some(
        (rule) =>
            groupMatches(group, rule.childGroupCode),
    );
    if (!isConditionalChild) return group.options;
    const visible = getVisibleOptionGroups(groups, selectedOptions, rules);
    const isVisible = visible.some((g) => g.id === group.id);
    if (!isVisible) return group.options;
    return group.options.filter(
        (option) => !NONE_OPTION_CODES.some((code) => optionMatches(option, code)),
    );
}

export function sanitizeSelectedOptions<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[] = CONDITIONAL_OPTION_RULES,
): Record<string, string> {
    if (rules.length === 0) return { ...selectedOptions };
    // Iterate to support chained rules (a child that is itself a parent).
    let cleaned: Record<string, string> = { ...selectedOptions };
    for (let i = 0; i < groups.length; i += 1) {
        const visible = getVisibleOptionGroups(groups, cleaned, rules);
        const visibleIds = new Set(visible.map((group) => group.id));
        const next: Record<string, string> = {};
        for (const [groupId, optionId] of Object.entries(cleaned)) {
            if (visibleIds.has(groupId)) {
                next[groupId] = optionId;
            }
        }
        if (Object.keys(next).length === Object.keys(cleaned).length) {
            cleaned = next;
            break;
        }
        cleaned = next;
    }
    return cleaned;
}

/**
 * Apply the Whole/None default on top of sanitizing:
 * - Grind == Whole  -> select the `None` size option (hidden group) so the
 *                      (Whole, None) variant resolves. No-op when the size
 *                      group or a `None` option does not exist.
 * - Grind == Ground -> drop a stale `None` size selection (it is hidden).
 * - Otherwise       -> sanitized selections unchanged.
 */
export function withGrindDefaults<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[] = CONDITIONAL_OPTION_RULES,
): Record<string, string> {
    const cleaned = sanitizeSelectedOptions(groups, selectedOptions, rules);
    const sizeGroup = findFirstGroup(groups, GRIND_SIZE_GROUP_CODES);
    if (!sizeGroup) return cleaned;

    if (isGrindWholeSelected(groups, cleaned)) {
        const noneOption = findFirstOption(sizeGroup.options, NONE_OPTION_CODES);
        if (noneOption) {
            return { ...cleaned, [sizeGroup.id]: noneOption.id };
        }
        return cleaned;
    }

    if (isGrindGroundSelected(groups, cleaned)) {
        const selectedId = cleaned[sizeGroup.id];
        if (selectedId) {
            const selected = sizeGroup.options.find((o) => o.id === selectedId);
            if (selected && NONE_OPTION_CODES.some((code) => optionMatches(selected, code))) {
                const next = { ...cleaned };
                delete next[sizeGroup.id];
                return next;
            }
        }
    }

    return cleaned;
}

export function getRequiredGroupIds<T extends OptionGroupLike>(
    groups: T[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[] = CONDITIONAL_OPTION_RULES,
): string[] {
    return getVisibleOptionGroups(groups, selectedOptions, rules).map((group) => group.id);
}

export function findMatchingVariant<TVariant extends VariantLike>(
    variants: TVariant[],
    selectedOptions: Record<string, string>,
    requiredGroupIds: string[],
): TVariant | undefined {
    const selectedIds = requiredGroupIds
        .map((groupId) => selectedOptions[groupId])
        .filter((optionId): optionId is string => Boolean(optionId));
    if (selectedIds.length !== requiredGroupIds.length) return undefined;
    return variants.find((variant) => {
        const variantOptionIds = variant.options.map((option) => option.id);
        return selectedIds.every((optionId) => variantOptionIds.includes(optionId));
    });
}

/**
 * Variant resolution for conditional products: sanitize, apply the
 * Whole/None default, then match against the visible groups plus any
 * auto-selected hidden group (the `None` size). Returns undefined until
 * the applicable selections are complete and map to a real variant —
 * never a fabricated ID.
 */
export function findConditionalVariant<TVariant extends VariantLike, TGroup extends OptionGroupLike>(
    groups: TGroup[],
    variants: TVariant[],
    selectedOptions: Record<string, string>,
    rules: ConditionalOptionRule[] = CONDITIONAL_OPTION_RULES,
): TVariant | undefined {
    const cleaned = withGrindDefaults(groups, selectedOptions, rules);
    const visibleIds = new Set(
        getVisibleOptionGroups(groups, cleaned, rules).map((group) => group.id),
    );
    const requiredGroupIds = [
        ...visibleIds,
        ...Object.keys(cleaned).filter((groupId) => !visibleIds.has(groupId)),
    ];
    return findMatchingVariant(variants, cleaned, requiredGroupIds);
}
