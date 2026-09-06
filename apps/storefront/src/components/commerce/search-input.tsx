import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit?: () => void;
  searchInputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  >;
}

export function SearchInput({
  query,
  onQueryChange,
  onSubmit,
  searchInputProps,
}: SearchInputProps) {
  const t = useTranslations("Product");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="relative w-full"
    >
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <Input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={`${t("searchIn")} ${t("products")}`.trim()}
        className="h-11 w-full rounded-md border-border bg-background pl-10 pr-3 text-sm text-foreground shadow-none placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        {...searchInputProps}
      />
    </form>
  );
}