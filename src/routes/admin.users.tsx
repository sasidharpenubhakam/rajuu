import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"grant" | "revoke" | null>(null);

  const run = async (action: "grant" | "revoke") => {
    if (!email.trim()) return toast.error("Enter an email");
    setLoading(action);
    const fn = action === "grant" ? "grant_admin_by_email" : "revoke_admin_by_email";
    const { error } = await (supabase as any).rpc(fn, { _email: email.trim().toLowerCase() });
    setLoading(null);
    if (error) return toast.error(error.message);
    toast.success(action === "grant" ? "Admin role granted" : "Admin role revoked");
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary">Manage Admins</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grant or revoke admin access by user email. The user must already have an account.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 max-w-lg space-y-4">
        <div>
          <Label>User email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => run("grant")} disabled={loading !== null}>
            {loading === "grant" ? "Granting..." : "Grant admin"}
          </Button>
          <Button onClick={() => run("revoke")} disabled={loading !== null} variant="outline">
            {loading === "revoke" ? "Revoking..." : "Revoke admin"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: <code>sathyabhaama@admin.com</code> is the permanent super-admin and cannot be revoked.
        </p>
      </div>
    </div>
  );
}
