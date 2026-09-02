import { getRouteLocale } from "@/i18n/server";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

const COPYRIGHT_YEAR = 2026;

async function Copyright() {
  "use cache";
  cacheLife("days");

  const locale = await getRouteLocale();
  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <div>
      &copy; {COPYRIGHT_YEAR} {t("copyright")}
    </div>
  );
}

export async function Footer() {
  "use cache";
  cacheLife("days");

  const locale = await getRouteLocale();
  cacheTag(`footer-${locale}`);

  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <Copyright />
          <div className="flex items-center gap-2">
            <span>{t("poweredBy")}</span>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Image
                src="/butterfly.png"
                alt="East Bengal Coffee Roasters"
                width={40}
                height={27}
                className="h-4 w-auto"
              />
            </a>
            <span>&</span>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Image
                src="/next.svg"
                alt="Next.js"
                width={16}
                height={16}
                className="h-5 w-auto dark:invert"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
