import { StorefrontApp } from "@/components/StorefrontApp";
import { getCatalogData } from "@/lib/catalog";

export const revalidate = 60;

export default async function HomePage() {
  const { categories, products, bundles, settings } = await getCatalogData();

  return (
    <StorefrontApp
      categories={categories}
      products={products}
      bundles={bundles}
      settings={settings}
    />
  );
}
