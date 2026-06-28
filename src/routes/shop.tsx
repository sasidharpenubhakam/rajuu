import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { z } from "zod";

const search = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  component: Shop,
});

function Shop() {
  const { category, q } = Route.useSearch();
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("products").select("id,slug,name,price,compare_at_price,images,fabric,stock,categories!inner(slug)")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(60);
      if (category) query = query.eq("categories.slug", category);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      setItems((data ?? []) as unknown as ProductCardData[]);
      setLoading(false);
    })();
  }, [category, q]);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-primary mb-2">
        {q ? `Results for "${q}"` : category ? category.replace(/-/g, " ") : "All Sarees"}
      </h1>
      <p className="text-muted-foreground text-sm mb-8">{items.length} products</p>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No products found. Try a different category.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
