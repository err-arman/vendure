'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cancelOrder } from './actions';

interface CancelOrderButtonProps {
    code: string;
}

export function CancelOrderButton({ code }: CancelOrderButtonProps) {
    const t = useTranslations('Account');
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            const result = await cancelOrder(code);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(t('orderCancelled'));
            setOpen(false);
            router.refresh();
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                {t('cancelOrder')}
            </Button>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('cancelOrderConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('cancelOrderConfirmDescription', { code })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            {t('keepOrder')}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
                            {isCancelling ? t('cancellingOrder') : t('cancelOrder')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
