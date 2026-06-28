import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

interface Item { id: string; product_name: string; quantity: number; price: number; status: string }
interface O {
  id: string; order_number: string; created_at: string; status: string; total: number;
  shipping_address: any; user_id: string; order_items: Item[];
}

function AdminOrders() {
  const [orders, setOrders] = useState<O[]>([]);
  const load = () => supabase
    .from("orders")
    .select("id,order_number,created_at,status,total,shipping_address,user_id,order_items(id,product_name,quantity,price,status)")
    .order("created_at", { ascending: false })
    .then(({ data }) => setOrders((data ?? []) as O[]));
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    // Cascade non-cancelled items so revenue (delivered items) is accurate
    await supabase
      .from("order_items")
      .update({ status: status as any })
      .eq("order_id", id)
      .neq("status", "cancelled");
    toast.success("Updated");
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-6">Orders</h1>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
            {orders.map((o) => {
              const cancelledCount = o.order_items?.filter((i) => i.status === "cancelled").length ?? 0;
              const totalCount = o.order_items?.length ?? 0;
              return (
                <tr key={o.id} className="border-t border-border align-top">
                  <td className="p-3 font-medium">
                    {o.order_number}
                    {cancelledCount > 0 && (
                      <div className="mt-1"><Badge variant="destructive" className="text-[10px]">{cancelledCount}/{totalCount} cancelled by customer</Badge></div>
                    )}
                  </td>
                  <td className="p-3">{o.shipping_address?.full_name ?? "—"}<br /><span className="text-xs text-muted-foreground">{o.shipping_address?.phone}</span></td>
                  <td className="p-3">
                    <ul className="space-y-1">
                      {o.order_items?.map((i) => (
                        <li key={i.id} className="text-xs">
                          <span className={i.status === "cancelled" ? "line-through text-muted-foreground" : ""}>
                            {i.product_name} × {i.quantity}
                          </span>
                          {i.status === "cancelled" && <span className="ml-1 text-destructive">(cancelled)</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{inr(o.total)}</td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
