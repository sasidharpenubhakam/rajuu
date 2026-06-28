import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/account/orders")({ component: Orders });

interface Item { id: string; product_name: string; product_image: string | null; size: string; color: string; quantity: number; price: number; status: string }
interface Order { id: string; order_number: string; created_at: string; status: string; total: number; order_items: Item[] }

function Orders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: os, error } = await supabase.from("orders")
      .select("id,order_number,created_at,status,total")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const ids = (os ?? []).map((o) => o.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: its } = await supabase.from("order_items").select("*").in("order_id", ids);
      items = its ?? [];
    }
    setOrders((os ?? []).map((o) => ({ ...o, order_items: items.filter((i) => i.order_id === o.id) })) as unknown as Order[]);
  };
  useEffect(() => { load(); }, [user]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) return <div className="container mx-auto px-4 py-20 text-center"><Link to="/login"><Button>Sign in</Button></Link></div>;

  const cancelItem = async (id: string) => {
    const { error } = await (supabase as any).rpc("cancel_my_order_item", { _item_id: id });
    if (error) toast.error(error.message); else { toast.success("Item cancelled"); load(); }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-primary mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Badge>{o.status}</Badge>
                  <p className="text-sm mt-1 font-semibold">{inr(o.total)}</p>
                </div>
              </div>
              <div className="space-y-3">
                {o.order_items.map((it) => (
                  <div key={it.id} className="flex items-center gap-4 border-t border-border pt-3">
                    {it.product_image && <img src={it.product_image} className="w-14 h-16 object-cover rounded" alt="" />}
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{it.product_name}</p>
                      <p className="text-xs text-muted-foreground">{it.size} • {it.color || "—"} • Qty {it.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">{inr(it.price * it.quantity)}</span>
                    <Badge variant={it.status === "cancelled" ? "destructive" : "secondary"}>{it.status}</Badge>
                    {it.status !== "cancelled" && it.status !== "delivered" && it.status !== "shipped" && (
                      <Button size="sm" variant="outline" onClick={() => cancelItem(it.id)}>Cancel</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
