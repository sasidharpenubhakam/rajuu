import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inr, slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

interface Cat { id: string; name: string }
interface Prod {
  id: string; name: string; slug: string; price: number; stock: number; is_active: boolean;
  category_id: string | null; images: string[];
}

function AdminProducts() {
  const [list, setList] = useState<Prod[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [edit, setEdit] = useState<Partial<Prod> & { description?: string; compare_at_price?: number | null; sizes?: string; colors?: string; fabric?: string; occasion?: string; imagesInput?: string } | null>(null);

  const load = async () => {
    const { data } = await supabase.from("products").select("id,name,slug,price,stock,is_active,category_id,images").order("created_at", { ascending: false });
    setList((data ?? []) as Prod[]);
  };
  useEffect(() => {
    load();
    supabase.from("categories").select("id,name").order("sort_order").then(({ data }) => setCats((data ?? []) as Cat[]));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const payload = {
      name: edit.name!, slug: edit.slug || slugify(edit.name!), description: edit.description || null,
      price: Number(edit.price), compare_at_price: edit.compare_at_price ? Number(edit.compare_at_price) : null,
      stock: Number(edit.stock ?? 0), category_id: edit.category_id || null,
      sizes: (edit.sizes || "Free Size").split(",").map((s) => s.trim()).filter(Boolean),
      colors: (edit.colors || "").split(",").map((s) => s.trim()).filter(Boolean),
      fabric: edit.fabric || null, occasion: edit.occasion || null,
      images: (edit.imagesInput || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      is_active: edit.is_active !== false,
    };
    const { error } = edit.id
      ? await supabase.from("products").update(payload).eq("id", edit.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEdit(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const openEdit = async (p?: Prod) => {
    if (!p) return setEdit({ name: "", price: 0, stock: 1, is_active: true, imagesInput: "" });
    const { data } = await supabase.from("products").select("*").eq("id", p.id).single();
    if (!data) return;
    setEdit({
      ...(data as any),
      description: data.description ?? "",
      fabric: data.fabric ?? "",
      occasion: data.occasion ?? "",
      sizes: (data.sizes ?? []).join(", "),
      colors: (data.colors ?? []).join(", "),
      imagesInput: (data.images ?? []).join("\n"),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-primary">Products</h1>
        <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
          <DialogTrigger asChild><Button onClick={() => openEdit()}><Plus className="h-4 w-4 mr-2" />Add Product</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} Product</DialogTitle></DialogHeader>
            {edit && (
              <form onSubmit={save} className="space-y-4">
                <div><Label>Name</Label><Input required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Price (₹)</Label><Input type="number" required value={edit.price ?? 0} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
                  <div><Label>Compare-at price (₹)</Label><Input type="number" value={edit.compare_at_price ?? ""} onChange={(e) => setEdit({ ...edit, compare_at_price: Number(e.target.value) })} /></div>
                  <div><Label>Stock</Label><Input type="number" required value={edit.stock ?? 1} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></div>
                  <div>
                    <Label>Category</Label>
                    <Select value={edit.category_id ?? "__none__"} onValueChange={(v) => setEdit({ ...edit, category_id: v === "__none__" ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Uncategorized</SelectItem>
                        {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fabric</Label><Input value={edit.fabric ?? ""} onChange={(e) => setEdit({ ...edit, fabric: e.target.value })} /></div>
                  <div><Label>Occasion</Label><Input value={edit.occasion ?? ""} onChange={(e) => setEdit({ ...edit, occasion: e.target.value })} /></div>
                </div>
                <div><Label>Sizes (comma-separated)</Label><Input value={edit.sizes ?? ""} onChange={(e) => setEdit({ ...edit, sizes: e.target.value })} placeholder="Free Size, S, M, L" /></div>
                <div><Label>Colors (comma-separated)</Label><Input value={edit.colors ?? ""} onChange={(e) => setEdit({ ...edit, colors: e.target.value })} placeholder="Red, Maroon, Gold" /></div>
                <div>
                  <Label>Upload images (Cloudinary)</Label>
                  <Input type="file" accept="image/*" multiple onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    const cloudName = "dxwjvnhjr";
                    const preset = "ml_default";
                    const uploaded: string[] = [];
                    toast.info(`Uploading ${files.length} image(s)…`);
                    for (const file of files) {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("upload_preset", preset);
                      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
                      const json = await res.json();
                      if (json.secure_url) uploaded.push(json.secure_url);
                      else { toast.error(json.error?.message ?? "Upload failed (set preset to Unsigned in Cloudinary)"); return; }
                    }
                    const existing = (edit.imagesInput ?? "").trim();
                    setEdit({ ...edit, imagesInput: existing ? `${existing}\n${uploaded.join("\n")}` : uploaded.join("\n") });
                    toast.success(`${uploaded.length} image(s) uploaded`);
                    e.target.value = "";
                  }} />
                  <p className="text-xs text-muted-foreground mt-1">Or paste URLs below (one per line)</p>
                </div>
                <div><Label>Image URLs</Label><Textarea rows={4} value={edit.imagesInput ?? ""} onChange={(e) => setEdit({ ...edit, imagesInput: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={4} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet — click Add Product.</td></tr>}
            {list.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 flex items-center gap-3">
                  {p.images?.[0] && <img src={p.images[0]} className="w-10 h-12 object-cover rounded" alt="" />}
                  {p.name}
                </td>
                <td className="p-3">{inr(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{p.is_active ? "Active" : "Hidden"}</td>
                <td className="p-3 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
