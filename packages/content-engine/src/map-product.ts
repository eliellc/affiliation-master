import type { ProductCardProduct } from "@affiliate/ui";
import { productPublicPath } from "@affiliate/product-engine";

export function toCardProduct(p: {
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  rating: number | null;
  categories?: { category: { path: string } }[];
}): ProductCardProduct {
  const primaryPath = p.categories?.[0]?.category.path;
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: p.price,
    currency: p.currency,
    images: p.images,
    rating: p.rating,
    productHref: productPublicPath(p.slug, primaryPath),
  };
}
