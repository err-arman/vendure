import { NextRequest, NextResponse } from "next/server";
import { SearchProductsQuery } from "@/lib/vendure/queries";
import { buildSearchInput } from "@/lib/search-helpers";
import { query } from "@/lib/vendure/api";

export interface LoadMoreQuery {
    searchParams: { [key: string]: string | string[] | undefined };
    collectionSlug?: string;
    locale: string;
    currencyCode: string;
}

interface LoadMoreBody extends LoadMoreQuery {
    skip: number;
    take: number;
}

export async function POST(request: NextRequest) {
    let body: LoadMoreBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { searchParams, collectionSlug, locale, currencyCode, skip, take } = body;

    if (typeof skip !== "number" || typeof take !== "number" || take <= 0) {
        return NextResponse.json(
            { error: "Invalid skip/take values" },
            { status: 400 },
        );
    }

    try {
        const result = await query(
            SearchProductsQuery,
            {
                input: buildSearchInput({
                    searchParams,
                    collectionSlug,
                    take,
                    skip,
                }),
            },
            { languageCode: locale, currencyCode },
        );

        return NextResponse.json({
            items: result.data.search.items,
            totalItems: result.data.search.totalItems,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to load more products",
            },
            { status: 500 },
        );
    }
}
