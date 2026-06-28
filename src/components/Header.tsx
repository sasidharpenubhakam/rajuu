import { Link, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouterState();
  const [cartCount, setCartCount] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) { setCartCount(0); return; }
    const load = async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      setCartCount((data ?? []).reduce((a, r) => a + r.quantity, 0));
    };
    load();
    const ch = supabase
      .channel("cart-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, router.location.pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) window.location.href = `/shop?q=${encodeURIComponent(q.trim())}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        <Link to="/" className="shrink-0"><Logo /></Link>

        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xl items-center gap-2 rounded-full border border-input bg-card px-4 py-2 focus-within:border-accent transition">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for sarees, fabric, occasion..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <nav className="flex items-center gap-1 ml-auto">
          <Link to="/wishlist" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Wishlist"><Heart className="h-5 w-5" /></Button>
          </Link>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="Cart"><ShoppingBag className="h-5 w-5" /></Button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild><Link to="/account">My Account</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/orders">My Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/wishlist">Wishlist</Link></DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><Settings className="h-4 w-4 mr-2" />Admin Panel</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login"><Button variant="default" size="sm" className="ml-2">Sign in</Button></Link>
          )}
        </nav>
      </div>

      <div className="border-t border-border/60 bg-card/40">
        <div className="container mx-auto flex items-center gap-6 overflow-x-auto px-4 py-2 text-sm">
          <Link to="/" className="hover:text-accent whitespace-nowrap">Home</Link>
          <Link to="/shop" className="hover:text-accent whitespace-nowrap">All Sarees</Link>
          <Link to="/shop" search={{ category: "silk-sarees" }} className="hover:text-accent whitespace-nowrap">Silk</Link>
          <Link to="/shop" search={{ category: "cotton-sarees" }} className="hover:text-accent whitespace-nowrap">Cotton</Link>
          {/* <Link to="/shop" search={{ category: "designer-sarees" }} className="hover:text-accent whitespace-nowrap">Designer</Link> */}
          {/* <Link to="/shop" search={{ category: "bridal" }} className="hover:text-accent whitespace-nowrap">Bridal</Link> */}
          <Link to="/shop" search={{ category: "kurtis" }} className="hover:text-accent whitespace-nowrap">Kurtis</Link>
          <Link to="/shop" search={{ category: "lehengas" }} className="hover:text-accent whitespace-nowrap">Lehengas</Link>
        </div>
      </div>
    </header>
  );
}
