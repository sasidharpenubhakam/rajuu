import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Package, Tag, Megaphone, ShoppingBag, LayoutDashboard, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/login" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) return <div className="container mx-auto px-4 py-20 text-center">Checking access…</div>;

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/users", label: "Admins", icon: Users },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-1 flex flex-col">
        <h2 className="font-display text-2xl text-primary mb-4">Admin</h2>
        {links.map((l) => {
          const active = path === l.to;
          return (
            <Link key={l.to} to={l.to} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          );
        })}
        <div className="pt-4 mt-4 border-t border-border">
          <p className="px-3 text-xs text-muted-foreground truncate mb-2">{user.email}</p>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>
      <div><Outlet /></div>
    </div>
  );
}
