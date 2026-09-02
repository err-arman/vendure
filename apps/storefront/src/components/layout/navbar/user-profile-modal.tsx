"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/layout/navbar/login-button";
import { useTranslations } from "next-intl";

export interface ProfileCustomer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
}

interface UserProfileModalProps {
  customer: ProfileCustomer;
  children: React.ReactNode;
}

export function UserProfileModal({ customer, children }: UserProfileModalProps) {
  const t = useTranslations("Navigation");
  const tAcct = useTranslations("Account");
  const [open, setOpen] = useState(false);

  const firstName = customer.firstName ?? "";
  const lastName = customer.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || tAcct("guest");
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span className="contents">{children}</span>} />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("profile")}</DialogTitle>
          <DialogDescription>{t("profileModalDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <Avatar size="lg" className="size-16">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-base font-medium">{fullName}</p>
            {customer.emailAddress && (
              <p className="text-sm text-muted-foreground">{customer.emailAddress}</p>
            )}
            {customer.phoneNumber && (
              <p className="text-sm text-muted-foreground">{customer.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button render={<Link href="/account/orders" onClick={() => setOpen(false)} />} variant="outline">
            {t("orders")}
          </Button>
        </div>

        <DialogFooter className="flex-row gap-2">
          <DialogClose render={<Button variant="outline" />}>{tAcct("close")}</DialogClose>
          <Button render={<Link href="/account/profile" onClick={() => setOpen(false)} />}>
            {tAcct("editProfile")}
          </Button>
        </DialogFooter>

        <LoginButton isLoggedIn />
      </DialogContent>
    </Dialog>
  );
}
