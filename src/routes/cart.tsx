import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: Cart });

interface Row {
  id: string; quantity: number; size: string; color: string;
  products: { id: string; name: string; price: number; images: string[]; stock: number; slug: string } | null;
}

function Cart() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [coupon, setCoupon] = useState(""); const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("cart_items")
      .select("id,quantity,size,color,products(id,name,price,images,stock,slug)")
      .eq("user_id", user.id);
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => { load(); }, [user]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-primary mb-4">Your cart</h1>
      <p className="text-muted-foreground mb-6">Sign in to view your cart.</p>
      <Link to="/login"><Button>Sign in</Button></Link>
    </div>
  );

  const subtotal = rows.reduce((a, r) => a + (r.products?.price ?? 0) * r.quantity, 0);
  const shipping = 0;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const updateQty = async (id: string, q: number) => {
    if (q < 1) return;
    await supabase.from("cart_items").update({ quantity: q }).eq("id", id);
    load();
  };
  const remove = async (id: string) => { await supabase.from("cart_items").delete().eq("id", id); load(); };

  const applyCoupon = async () => {
    const { data } = await (supabase as any).from("coupons_public").select("*").eq("code", coupon.toUpperCase()).maybeSingle();
    if (!data) return toast.error("Invalid coupon");
    if (data.min_order_value && subtotal < Number(data.min_order_value)) return toast.error(`Minimum order ${inr(data.min_order_value)}`);
    if (data.valid_until && new Date(data.valid_until) < new Date()) return toast.error("Coupon expired");
    let disc = data.discount_type === "percent" ? (subtotal * Number(data.discount_value)) / 100 : Number(data.discount_value);
    if (data.max_discount) disc = Math.min(disc, Number(data.max_discount));
    setApplied({ code: data.code, discount: Math.round(disc) });
    toast.success(`Coupon ${data.code} applied`);
  };

  const checkout = async () => {
    if (rows.length === 0) return;
    navigate({ to: "/checkout", search: { coupon: applied?.code ?? "" } });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-primary mb-8">Your Cart</h1>
      {rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Link to="/shop"><Button>Continue shopping</Button></Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {rows.map((r) => r.products && (
              <div key={r.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <img src={r.products.images[0] ?? "https://placehold.co/120x160"} className="w-24 h-32 object-cover rounded" alt="" />
                <div className="flex-1">
                  <Link to="/product/$slug" params={{ slug: r.products.slug }} className="font-medium hover:text-accent">{r.products.name}</Link>
                  <p className="text-xs text-muted-foreground mt-1">{r.size} • {r.color || "—"}</p>
                  <p className="font-semibold mt-2">{inr(r.products.price)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateQty(r.id, r.quantity - 1)}>-</Button>
                    <span className="px-3">{r.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => updateQty(r.id, r.quantity + 1)}>+</Button>
                    <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-6 h-fit sticky top-32">
            <h3 className="font-display text-xl text-primary mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>- {inr(discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "FREE" : inr(shipping)}</span></div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-base"><span>Total</span><span>{inr(total)}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <Button variant="outline" onClick={applyCoupon}>Apply</Button>
            </div>
            <Button onClick={checkout} className="w-full mt-4" size="lg">Checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
}
