import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/announcements")({ component: AdminAnnouncements });

interface A { id: string; message: string; is_active: boolean; sort_order: number }

function AdminAnnouncements() {
  const [list, setList] = useState<A[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => supabase.from("announcements").select("*").order("sort_order").then(({ data }) => setList((data ?? []) as A[]));
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({ message: msg, sort_order: list.length });
    if (error) toast.error(error.message); else { setMsg(""); load(); }
  };
  const toggle = async (a: A) => { await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id); load(); };
  const remove = async (id: string) => { await supabase.from("announcements").delete().eq("id", id); load(); };

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-6">Scrolling Messages</h1>
      <form onSubmit={add} className="flex gap-3 mb-6">
        <Input required placeholder="New scrolling message…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {list.map((a) => (
          <div key={a.id} className="p-4 flex items-center gap-4">
            <span className="flex-1">{a.message}</span>
            <Button size="sm" variant="outline" onClick={() => toggle(a)}>{a.is_active ? "Active" : "Hidden"}</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
