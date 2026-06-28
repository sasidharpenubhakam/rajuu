import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, customers: 0 });
  useEffect(() => {
    (async () => {
      const [p, o, items, c] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("order_items").select("price,quantity,status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const revenue = (items.data ?? [])
        .filter((i: any) => i.status === "delivered")
        .reduce((a, i: any) => a + Number(i.price) * Number(i.quantity), 0);
      setStats({
        products: p.count ?? 0,
        orders: o.count ?? 0,
        revenue,
        customers: c.count ?? 0,
      });
    })();
  }, []);
  const cards = [
    { l: "Products", v: stats.products },
    { l: "Orders", v: stats.orders },
    { l: "Revenue", v: inr(stats.revenue) },
    { l: "Customers", v: stats.customers },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.l} className="rounded-lg border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.l}</p>
            <p className="font-display text-3xl text-primary mt-2">{c.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
