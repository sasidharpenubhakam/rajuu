import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); return toast.error(error.message); }
    const uid = data.user?.id;
    let isAdmin = false;
    if (uid) {
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      isAdmin = !!roleRow;
    }
    setLoading(false);
    toast.success("Welcome back!");
    navigate({ to: isAdmin ? "/admin" : "/" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message);
    else if (!result.redirected) navigate({ to: "/" });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-3xl text-primary text-center">Welcome back</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Sign in to your Sathyabhaama account</p>

        <Button onClick={onGoogle} variant="outline" className="w-full mt-6">Continue with Google</Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" /></div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign in"}</Button>
        </form>
        <p className="mt-6 text-center text-sm">
          New here? <Link to="/signup" className="text-accent hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
