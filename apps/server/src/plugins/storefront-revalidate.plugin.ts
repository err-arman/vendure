import { OnApplicationBootstrap } from "@nestjs/common";
import {
  CollectionEvent,
  EventBus,
  Logger,
  PluginCommonModule,
  ProductEvent,
  ProductVariantEvent,
  VendurePlugin,
} from "@vendure/core";

const STORE_FRONT_REVALIDATION_URL =
  process.env.STORE_FRONT_REVALIDATION_URL ||
  process.env.NEXT_PUBLIC_STORE_FRONT_REVALIDATION_URL ||
  "http://localhost:2121/api/revalidate";
const REVALIDATION_SECRET =
  process.env.REVALIDATION_SECRET ||
  process.env.STORE_FRONT_REVALIDATION_SECRET;

@VendurePlugin({
  imports: [PluginCommonModule],
})
export class StorefrontRevalidatePlugin implements OnApplicationBootstrap {
  constructor(private eventBus: EventBus) {}

  onApplicationBootstrap() {
    this.eventBus.ofType(ProductEvent).subscribe((event) => {
      void this.revalidateForProduct(event);
    });

    this.eventBus.ofType(CollectionEvent).subscribe((event) => {
      void this.revalidateForCollection(event);
    });

    this.eventBus.ofType(ProductVariantEvent).subscribe((event) => {
      void this.revalidateForVariants(event);
    });
  }

  private async revalidateForProduct(event: ProductEvent) {
    const tags = this.uniqueTags([`product-${event.entity.slug}`, "products"]);

    await this.revalidate(tags);
  }

  private async revalidateForCollection(event: CollectionEvent) {
    const tags = this.uniqueTags([
      `collection-${event.entity.slug}`,
      "collection",
    ]);

    await this.revalidate(tags);
  }

  private async revalidateForVariants(event: ProductVariantEvent) {
    await this.revalidate(["products"]);
  }

  private uniqueTags(tags: Array<string | undefined>): string[] {
    return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))];
  }

  private async revalidate(tags: string[]) {
    if (!REVALIDATION_SECRET) {
      Logger.warn(
        "REVALIDATION_SECRET is not configured; storefront revalidation is disabled.",
      );
      return;
    }

    try {
      const response = await fetch(STORE_FRONT_REVALIDATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${REVALIDATION_SECRET}`,
        },
        body: JSON.stringify({ tags }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        Logger.error(
          `Storefront revalidation failed for ${tags.join(", ")}: ${response.status} ${JSON.stringify(payload)}`,
        );
        return;
      }

      Logger.debug(`Storefront revalidated tags: ${tags.join(", ")}`);
    } catch (error) {
      Logger.error(
        `Failed to trigger storefront revalidation for ${tags.join(", ")}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
