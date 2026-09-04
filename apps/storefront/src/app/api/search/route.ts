import {NextRequest} from 'next/server';
import {cookies} from 'next/headers';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {getCurrencyCookie} from '@/lib/currency';

/**
 * Typeahead suggestions for the search control.
 * Returns up to `limit` product matches for `term` from the active channel.
 */
export async function GET(req: NextRequest) {
    const term = (req.nextUrl.searchParams.get('term') ?? '').trim();
    if (term.length < 2) {
        return Response.json({items: []});
    }

    const requestedLimit = Number(req.nextUrl.searchParams.get('limit'));
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 6, 1), 10);

    const currencyCode = await getCurrencyCookie();
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    try {
        const result = await query(SearchProductsQuery, {
            input: {
                term,
                take: limit,
                skip: 0,
                groupByProduct: true,
                sort: {name: 'ASC'},
            },
        }, {languageCode: locale, currencyCode});

        return Response.json({items: result.data.search.items});
    } catch (error) {
        return Response.json({
            items: [],
            error: error instanceof Error ? error.message : 'Search failed',
        });
    }
}