"use client";

import { ChevronDown, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const ALL_ROASTS = "all";

export interface RoastOption {
  id: string;
  name: string;
}

interface RoastFilterProps {
  options: RoastOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Dropdown that filters the home page sections by roast level.
 * Options come straight from the Vendure `Roast` facet, so the list grows
 * and shrinks with the catalog.
 */
export function RoastFilter({
  options,
  value,
  onChange,
  className,
}: RoastFilterProps) {
  const t = useTranslations("Product");
  const selected = options.find((option) => option.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            aria-label={t("filterByRoast")}
            className={cn("h-11 shrink-0 gap-2 rounded-md px-3", className)}
          />
        }
      >
        <Flame
          className={cn(
            "size-4",
            selected ? "text-primary" : "text-muted-foreground",
          )}
        />
        <span>{t("roast")}</span>
        {selected && (
          <span className="hidden max-w-24 truncate text-muted-foreground sm:inline">
            · {selected.name}
          </span>
        )}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuLabel>{t("roast")}</DropdownMenuLabel>
          <DropdownMenuRadioItem value={ALL_ROASTS} closeOnClick>
            {t("allRoasts")}
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id} closeOnClick>
              {option.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
