import {getRouteLocale} from '@/i18n/server';
import {User} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Link} from '@/i18n/navigation';
import {LoginButton} from "@/components/layout/navbar/login-button";
import {UserProfileModal} from "@/components/layout/navbar/user-profile-modal";
import {getActiveCustomer} from "@/lib/vendure/actions";
import {getTranslations} from 'next-intl/server';

export async function NavbarUser() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});
    const customer = await getActiveCustomer();

    if (!customer) {
        return (
            <div className="hidden md:block">
                <Button render={<LoginButton isLoggedIn={false} />} variant="ghost" />
            </div>
        );
    }

    return (
        <>
            {/* Desktop / tablet: dropdown menu */}
            <div className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" />}>
                        <User className="h-5 w-5" />
                        {t('greeting', {name: customer.firstName})}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem render={<Link href="/account/profile" />}>{t('profile')}</DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/account/orders" />}>{t('orders')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem render={<LoginButton isLoggedIn={true} />} nativeButton />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: profile modal icon (only when logged in) */}
            <div className="md:hidden">
                <UserProfileModal customer={customer}>
                    <Button variant="ghost" size="icon" aria-label={t('profile')}>
                        <User className="h-5 w-5" />
                    </Button>
                </UserProfileModal>
            </div>
        </>
    );
}