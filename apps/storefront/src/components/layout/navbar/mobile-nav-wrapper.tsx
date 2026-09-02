import {getRouteLocale} from '@/i18n/server';
import {getTopCollections} from '@/lib/vendure/cached';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {MobileNav} from '@/components/layout/navbar/mobile-nav';

export async function MobileNavWrapper() {
    const locale = await getRouteLocale();

    const [collections, customer] = await Promise.all([
        getTopCollections(locale),
        getActiveCustomer(),
    ]);

    return <MobileNav collections={collections} isLoggedIn={!!customer} />;
}