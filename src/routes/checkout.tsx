import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  validateSearch: z.object({ coupon: z.string().optional() }),
  component: Checkout,
});

interface Row { id: string; quantity: number; size: string; color: string;
  products: { id: string; name: string; price: number; images: string[]; slug: string } | null }

function Checkout() {
  const { user, loading } = useAuth();
  const { coupon: couponCode } = Route.useSearch();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [addr, setAddr] = useState({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [placing, setPlacing] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("cart_items").select("id,quantity,size,color,products(id,name,price,images,slug)")
      .eq("user_id", user.id).then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  const subtotal = rows.reduce((a, r) => a + (r.products?.price ?? 0) * r.quantity, 0);
  const shipping = 0;

  useEffect(() => {
    if (!couponCode) return;
    (supabase as any).from("coupons_public").select("*").eq("code", couponCode).maybeSingle()
      .then(({ data }: { data: any }) => {
        if (!data) return;
        let d = data.discount_type === "percent" ? (subtotal * Number(data.discount_value)) / 100 : Number(data.discount_value);
        if (data.max_discount) d = Math.min(d, Number(data.max_discount));
        setDiscount(Math.round(d));
      });
  }, [couponCode, subtotal]);

  const total = Math.max(0, subtotal - discount) + shipping;

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) return toast.error("Cart is empty");
    setPlacing(true);
    const { data: orderId, error } = await (supabase as any).rpc("place_order", {
      _shipping_address: addr,
      _coupon_code: couponCode || null,
    });
    if (error || !orderId) { setPlacing(false); return toast.error(error?.message ?? "Failed to place order"); }
    toast.success("Order placed!");
    navigate({ to: "/account/orders" });
  };

  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
      <form onSubmit={placeOrder} className="lg:col-span-2 space-y-6">
        <h1 className="font-display text-3xl text-primary">Checkout</h1>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-medium">Shipping Address</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input required value={addr.full_name} onChange={(e) => setAddr({ ...addr, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input required value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Address line 1</Label><Input required value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Address line 2 (optional)</Label><Input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} /></div>
            <div><Label>City</Label><Input required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></div>
            <div><Label>State</Label><Input required value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} /></div>
            <div><Label>Pincode</Label><Input required value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} /></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-medium mb-2">Payment</h2>
          <p className="text-sm text-muted-foreground">Mock payment — click Place Order to complete. Real payment gateway can be added later.</p>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={placing}>{placing ? "Placing order…" : `Place Order — ${inr(total)}`}</Button>
      </form>
      <aside className="rounded-lg border border-border bg-card p-6 h-fit">
        <h3 className="font-display text-xl text-primary mb-4">Summary</h3>
        <div className="space-y-3 text-sm">
          {rows.map((r) => r.products && (
            <div key={r.id} className="flex gap-3">
              <img src={r.products.images[0]} className="w-14 h-16 object-cover rounded" alt="" />
              <div className="flex-1 text-xs">
                <p className="font-medium">{r.products.name}</p>
                <p className="text-muted-foreground">{r.size} × {r.quantity}</p>
              </div>
              <span className="text-sm">{inr(r.products.price * r.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-accent"><span>Discount ({couponCode})</span><span>- {inr(discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "FREE" : inr(shipping)}</span></div>
            <div className="flex justify-between font-semibold pt-2 border-t border-border"><span>Total</span><span>{inr(total)}</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
