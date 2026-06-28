import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/")({ component: Account });

function Account() {
  const { user, signOut, loading } = useAuth();
  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) return <div className="container mx-auto px-4 py-20 text-center"><Link to="/login"><Button>Sign in</Button></Link></div>;
  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="font-display text-4xl text-primary mb-6">My Account</h1>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div><p className="text-xs text-muted-foreground">Email</p><p>{user.email}</p></div>
        <div className="flex gap-3 pt-4 border-t border-border">
          <Link to="/account/orders"><Button variant="outline">My Orders</Button></Link>
          <Link to="/wishlist"><Button variant="outline">Wishlist</Button></Link>
          <Button variant="ghost" onClick={signOut} className="ml-auto">Sign out</Button>
        </div>
      </div>
    </div>
  );
}
