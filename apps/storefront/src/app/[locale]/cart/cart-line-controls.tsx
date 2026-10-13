'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { adjustQuantity, removeFromCart } from './actions';

interface CartLineControlsProps {
    lineId: string;
    quantity: number;
}

/**
 * Client-side quantity / remove controls for one cart line.
 *
 * The mutations run as server actions; afterwards the shared cart context
 * is re-synced with server truth so ticks and counts update immediately
 * everywhere (e.g. product cards on the home page) instead of only after
 * a full page reload.
 */
export function CartLineControls({ lineId, quantity }: CartLineControlsProps) {
    const { refresh } = useCart();
    const [isPending, startTransition] = useTransition();

    const run = (action: () => Promise<unknown>) => {
        startTransition(async () => {
            // A failure still falls through to refresh() so the UI always
            // reflects server truth afterwards.
            await action().catch(() => {});
            await refresh();
        });
    };

    return (
        <>
            <div className="flex items-center gap-1 border rounded-full bg-muted/50">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full transition-all duration-200 hover:bg-background"
                    disabled={quantity <= 1 || isPending}
                    onClick={() => run(() => adjustQuantity(lineId, Math.max(1, quantity - 1)))}
                >
                    <Minus className="h-4 w-4" />
                </Button>

                <span className="w-10 text-center font-semibold tabular-nums transition-all duration-200">
                    {quantity}
                </span>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full transition-all duration-200 hover:bg-background"
                    disabled={isPending}
                    onClick={() => run(() => adjustQuantity(lineId, quantity + 1))}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                disabled={isPending}
                onClick={() => run(() => removeFromCart(lineId))}
            >
                <X className="h-5 w-5" />
            </Button>
        </>
    );
}
