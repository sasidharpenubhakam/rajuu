import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({ component: Product });

interface P {
  id: string; name: string; description: string | null; price: number;
  compare_at_price: number | null; stock: number; sizes: string[]; colors: string[];
  fabric: string | null; occasion: string | null; images: string[];
}

function Product() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState<P | null>(null);
  const [size, setSize] = useState(""); const [color, setColor] = useState("");
  const [img, setImg] = useState(0);

  useEffect(() => {
    supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle()
      .then(({ data }) => {
        setP(data as P);
        if (data) { setSize(data.sizes[0] ?? ""); setColor(data.colors[0] ?? ""); }
      });
  }, [slug]);

  if (!p) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  const addToCart = async () => {
    if (!user) { toast.error("Please sign in"); navigate({ to: "/login" }); return; }
    const { error } = await supabase.from("cart_items").upsert({
      user_id: user.id, product_id: p.id, size: size || "Free Size", color: color || "",
      quantity: 1,
    }, { onConflict: "user_id,product_id,size,color" });
    if (error) toast.error(error.message); else toast.success("Added to cart");
  };

  const buyNow = async () => { await addToCart(); navigate({ to: "/cart" }); };

  const wish = async () => {
    if (!user) return navigate({ to: "/login" });
    const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: p.id });
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    else toast.success("Saved to wishlist");
  };

  return (
    <div className="container mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
          <img src={p.images[img] ?? "https://placehold.co/600x800/eee/ccc"} alt={p.name} className="w-full h-full object-cover" />
        </div>
        {p.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {p.images.map((src, i) => (
              <button key={i} onClick={() => setImg(i)} className={`w-20 h-20 rounded border-2 overflow-hidden shrink-0 ${i === img ? "border-accent" : "border-transparent"}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <h1 className="font-display text-3xl text-primary">{p.name}</h1>
        {p.fabric && <p className="text-sm text-muted-foreground mt-1">{p.fabric}{p.occasion ? ` • ${p.occasion}` : ""}</p>}
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{inr(p.price)}</span>
          {p.compare_at_price && p.compare_at_price > p.price && (
            <>
              <span className="text-muted-foreground line-through">{inr(p.compare_at_price)}</span>
              <Badge className="bg-accent">{Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)}% OFF</Badge>
            </>
          )}
        </div>

        {p.sizes.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {p.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`px-4 py-2 rounded-md border text-sm ${size === s ? "border-accent bg-accent/10" : "border-border"}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {p.colors.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {p.colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`px-4 py-2 rounded-md border text-sm ${color === c ? "border-accent bg-accent/10" : "border-border"}`}>{c}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button onClick={addToCart} disabled={p.stock === 0} size="lg" variant="outline" className="flex-1"><ShoppingBag className="h-4 w-4 mr-2" />Add to Cart</Button>
          <Button onClick={buyNow} disabled={p.stock === 0} size="lg" className="flex-1">Buy Now</Button>
          <Button onClick={wish} size="lg" variant="ghost"><Heart className="h-5 w-5" /></Button>
        </div>

        {p.description && (
          <div className="mt-10 prose prose-sm">
            <h3 className="font-display text-xl text-primary">Product Details</h3>
            <p className="text-muted-foreground whitespace-pre-line">{p.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
