import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User as UserIcon, Shield, Menu, X, ShoppingCart } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { toast } from "sonner";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function SiteNav({ transparent = false }: { transparent?: boolean }) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();

  async function signOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  function closeMobile() { setMenuOpen(false); }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-border/50 ${transparent ? "bg-background/40" : "bg-background/80"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={closeMobile} className="flex items-center gap-3 group">
          <img src={logo} alt="CyberTown" className="w-9 h-9 rounded-full ring-1 ring-stone/40 group-hover:ring-stone transition" />
          <span className="font-display font-semibold tracking-tight text-cream">
            CyberTown<span className="text-stone"> · Tech</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-ash/80">
          <Link to="/" className="hover:text-cream transition">Home</Link>
          <Link to="/products" className="hover:text-cream transition">Products</Link>
          <Link to="/cart" className="hover:text-cream transition">Cart</Link>
          <Link to="/dashboard" className="hover:text-cream transition">Dashboard</Link>
          {isAdmin && <Link to="/admin" className="hover:text-cream transition flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Admin</Link>}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative inline-flex md:hidden items-center justify-center w-9 h-9 rounded-md border border-border text-ash hover:text-cream transition" aria-label="Cart">
            <ShoppingCart className="w-4 h-4" />
            {count > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cream text-obsidian text-[10px] font-medium flex items-center justify-center">{count}</span>}
          </Link>

          {!user ? (
            <>
              <Link to="/auth" className="hidden sm:inline-flex items-center px-4 h-9 rounded-md text-sm text-ash hover:text-cream transition">Sign in</Link>
              <Link to="/auth" search={{ mode: "register" }} className="hidden sm:inline-flex items-center px-4 h-9 rounded-md text-sm bg-cream text-obsidian font-medium hover:bg-ash transition">Get started</Link>
            </>
          ) : (
            <div className="relative hidden md:block">
              <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 px-3 h-9 rounded-md text-sm border border-border hover:border-stone transition">
                <UserIcon className="w-4 h-4" /> <span className="hidden sm:inline truncate max-w-[120px]">{user.email}</span>
              </button>
              {open && (
                <div className="absolute right-0 top-11 w-48 bg-card border border-border rounded-lg shadow-lg p-1 z-50">
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded hover:bg-muted">Dashboard</Link>
                  {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded hover:bg-muted">Admin panel</Link>}
                  <button onClick={signOut} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border text-ash hover:text-cream transition"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1 text-sm">
            <Link to="/" onClick={closeMobile} className="px-3 py-3 rounded-md hover:bg-muted text-cream">Home</Link>
            <Link to="/products" onClick={closeMobile} className="px-3 py-3 rounded-md hover:bg-muted text-cream">Products</Link>
            <Link to="/cart" onClick={closeMobile} className="px-3 py-3 rounded-md hover:bg-muted text-cream flex items-center justify-between">
              <span>Cart</span>
              {count > 0 && <span className="px-2 h-5 inline-flex items-center rounded-full bg-cream text-obsidian text-[10px]">{count}</span>}
            </Link>
            <Link to="/dashboard" onClick={closeMobile} className="px-3 py-3 rounded-md hover:bg-muted text-cream">Dashboard</Link>
            {isAdmin && (
              <Link to="/admin" onClick={closeMobile} className="px-3 py-3 rounded-md hover:bg-muted text-cream flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            <div className="my-2 h-px bg-border/60" />
            {!user ? (
              <div className="flex gap-2">
                <Link to="/auth" onClick={closeMobile} className="flex-1 text-center px-4 h-10 inline-flex items-center justify-center rounded-md border border-border text-ash">Sign in</Link>
                <Link to="/auth" search={{ mode: "register" }} onClick={closeMobile} className="flex-1 text-center px-4 h-10 inline-flex items-center justify-center rounded-md bg-cream text-obsidian font-medium">Get started</Link>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
                <button onClick={signOut} className="px-3 py-3 rounded-md hover:bg-muted text-left text-cream flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
