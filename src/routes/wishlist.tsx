import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({ component: Wishlist });

function Wishlist() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ProductCardData[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("wishlist").select("products(id,slug,name,price,compare_at_price,images,fabric,stock)")
      .eq("user_id", user.id)
      .then(({ data }) => setItems((data ?? []).map((r: any) => r.products).filter(Boolean) as ProductCardData[]));
  }, [user]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) return <div className="container mx-auto px-4 py-20 text-center"><Link to="/login"><Button>Sign in to view wishlist</Button></Link></div>;
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-primary mb-8">Wishlist</h1>
      {items.length === 0 ? <p className="text-muted-foreground">No saved items yet.</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
