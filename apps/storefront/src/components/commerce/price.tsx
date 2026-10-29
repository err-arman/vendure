'use client';

import {useLocale} from 'next-intl';
import {toIntlLocale} from '@/i18n/locale-utils';

interface PriceProps {
    value: number;
    currencyCode?: string | null;
}

export function Price({value, currencyCode}: PriceProps) {
    const locale = useLocale();
    const intlLocale = toIntlLocale(locale);
    return (
        <>
            {new Intl.NumberFormat(intlLocale, {
                style: 'currency',
                currency: currencyCode ?? 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value / 100)}
        </>
    );
}
