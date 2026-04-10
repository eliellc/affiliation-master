import type { ProductCardProduct } from "@affiliate/ui";

export function toCardProduct(p: {
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  rating: number | null;
}): ProductCardProduct {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: p.price,
    currency: p.currency,
    images: p.images,
    rating: p.rating,
  };
}
