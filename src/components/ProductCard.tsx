import { Link } from "@tanstack/react-router";
import { inr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  fabric: string | null;
  stock: number;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const img = p.images[0] ?? "https://placehold.co/600x800/eee/ccc?text=Sathyabhaama";
  const off = p.compare_at_price && p.compare_at_price > p.price
    ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
    : 0;
  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[3/4]">
        <img
          src={img}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {off > 0 && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">{off}% OFF</Badge>
        )}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-sm font-medium uppercase tracking-wider">Sold out</span>
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-sm font-medium line-clamp-1 group-hover:text-accent transition">{p.name}</h3>
        {p.fabric && <p className="text-xs text-muted-foreground mt-0.5">{p.fabric}</p>}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold">{inr(p.price)}</span>
          {p.compare_at_price && p.compare_at_price > p.price && (
            <span className="text-xs text-muted-foreground line-through">{inr(p.compare_at_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
