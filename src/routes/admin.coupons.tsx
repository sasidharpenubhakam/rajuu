import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/coupons")({ component: AdminCoupons });

interface C { id: string; code: string; discount_type: string; discount_value: number; min_order_value: number; max_discount: number | null; is_active: boolean }

function AdminCoupons() {
  const [list, setList] = useState<C[]>([]);
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: 10, min_order_value: 0, max_discount: "" });
  const load = () => supabase.from("coupons").select("*").order("created_at", { ascending: false }).then(({ data }) => setList((data ?? []) as C[]));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(), discount_type: form.discount_type as "percent" | "flat",
      discount_value: Number(form.discount_value), min_order_value: Number(form.min_order_value) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
    });
    if (error) toast.error(error.message); else { toast.success("Added"); setForm({ code: "", discount_type: "percent", discount_value: 10, min_order_value: 0, max_discount: "" }); load(); }
  };
  const remove = async (id: string) => { await supabase.from("coupons").delete().eq("id", id); load(); };
  const toggle = async (c: C) => { await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id); load(); };

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-6">Coupons</h1>
      <form onSubmit={add} className="rounded-lg border border-border bg-card p-4 grid md:grid-cols-6 gap-3 items-end mb-6">
        <div><Label>Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
        <div>
          <Label>Type</Label>
          <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="percent">Percent</SelectItem><SelectItem value="flat">Flat ₹</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Value</Label><Input type="number" required value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
        <div><Label>Min order</Label><Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })} /></div>
        <div><Label>Max disc</Label><Input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} /></div>
        <Button type="submit">Add</Button>
      </form>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Active</th><th className="p-3"></th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.discount_type === "percent" ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                <td className="p-3">₹{c.min_order_value}</td>
                <td className="p-3"><Button size="sm" variant="outline" onClick={() => toggle(c)}>{c.is_active ? "Active" : "Inactive"}</Button></td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
