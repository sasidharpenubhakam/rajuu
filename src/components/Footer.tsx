import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl mb-2">Sathyabhaama</h3>
          <p className="text-sm opacity-80 italic mb-4">Wear Sathyabhaama, wear confidence.</p>
          <a
            href="https://instagram.com/sathyabhaama.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            <Instagram className="h-4 w-4" /> Follow @sathyabhaama.in
          </a>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gold">Shop</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/shop">All Sarees</Link></li>
            <li><Link to="/shop" search={{ category: "silk-sarees" }}>Silk Sarees</Link></li>
            <li><Link to="/shop" search={{ category: "bridal" }}>Bridal</Link></li>
            <li><Link to="/shop" search={{ category: "kurtis" }}>Kurtis</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gold">Help</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/account/orders">Track Order</Link></li>
            <li><Link to="/account">My Account</Link></li>
            <li><a href="#">Returns & Exchange</a></li>
            <li><a href="#">Shipping Policy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gold">Contact</h4>
          <a href="mailto:sathyabhaama.in@gmail.com" className="inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
            <Mail className="h-4 w-4" /> sathyabhaama.in@gmail.com
          </a>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Sathyabhaama. All rights reserved.
      </div>
    </footer>
  );
}
