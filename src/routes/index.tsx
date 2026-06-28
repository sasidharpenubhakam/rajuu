import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import logo from "../assests/sathyabhaama logo.jpeg";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [featured, setFeatured] = useState<ProductCardData[]>([]);
  const [cats, setCats] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    supabase.from("products").select("id,slug,name,price,compare_at_price,images,fabric,stock")
      .eq("is_active", true).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => setFeatured((data ?? []) as ProductCardData[]));
    supabase.from("categories").select("name,slug").order("sort_order")
      .then(({ data }) => setCats(data ?? []));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-brand text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-gold uppercase tracking-[0.3em] text-xs mb-4">New Collection 2026</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6">
              Wear Confidence,<br /><span className="text-gradient-gold">Wear Sathyabhaama</span>
            </h1>
            <p className="text-lg opacity-90 mb-8 max-w-md">
              Heritage sarees, hand-picked kurtis and bridal lehengas — crafted to make every woman feel like royalty.
            </p>
            <div className="flex gap-3">
              <Link to="/shop"><Button size="lg" className="bg-gold text-primary hover:bg-gold/90">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              {/* <Link to="/shop" search={{ category: "bridal" }}><Button size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">Bridal Edit</Button></Link> */}
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-80 flex items-center justify-center">

              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-gold/30 blur-3xl animate-pulse"></div>

              {/* Rotating Ring */}
              <div className="absolute w-72 h-72 rounded-full border-2 border-gold/40 animate-spin-slow"></div>

              {/* Sparkle Stars */}
              <Sparkles className="absolute top-4 left-12 w-6 h-6 text-yellow-300 animate-sparkle-1" />
              <Sparkles className="absolute top-14 right-10 w-5 h-5 text-yellow-400 animate-sparkle-2" />
              <Sparkles className="absolute bottom-8 left-6 w-6 h-6 text-yellow-300 animate-sparkle-3" />
              <Sparkles className="absolute bottom-12 right-8 w-5 h-5 text-yellow-400 animate-sparkle-4" />
              <Sparkles className="absolute left-2 top-1/2 w-7 h-7 text-yellow-300 animate-sparkle-2" />
              <Sparkles className="absolute right-2 top-1/2 w-7 h-7 text-yellow-300 animate-sparkle-1" />

              {/* Logo */}
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-yellow-300 shadow-2xl">
                <img
                  src={logo}
                  alt="Sathyabhaama"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { icon: Truck, label: "Free shipping above ₹1499" },
            { icon: ShieldCheck, label: "100% Authentic" },
            { icon: RotateCcw, label: "7-Day Easy Returns" },
            { icon: Sparkles, label: "1000+ Curated Designs" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-accent" />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-accent uppercase tracking-widest text-xs">Shop by</p>
            <h2 className="font-display text-3xl md:text-4xl text-primary">Categories</h2>
          </div>
          <Link to="/shop" className="text-sm text-accent hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {cats.map((c) => (
            <Link key={c.slug} to="/shop" search={{ category: c.slug }}
              className="aspect-square rounded-full bg-gradient-to-br from-secondary to-muted hover:from-gold/30 hover:to-accent/30 transition flex items-center justify-center text-center px-3 border border-border">
              <span className="font-display text-sm text-primary">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-accent uppercase tracking-widest text-xs">Just in</p>
            <h2 className="font-display text-3xl md:text-4xl text-primary">New Arrivals</h2>
          </div>
          <Link to="/shop" className="text-sm text-accent hover:underline">Shop all →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No products yet. Admin can add products from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}     