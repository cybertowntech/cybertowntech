import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User as UserIcon, Shield } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { toast } from "sonner";
import { useState } from "react";

export default function SiteNav({ transparent = false }: { transparent?: boolean }) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-border/50 ${transparent ? "bg-background/40" : "bg-background/80"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="CyberTown" className="w-9 h-9 rounded-full ring-1 ring-stone/40 group-hover:ring-stone transition" />
          <span className="font-display font-semibold tracking-tight text-cream">
            CyberTown<span className="text-stone"> · Tech</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ash/80">
          <Link to="/" className="hover:text-cream transition">Home</Link>
          <Link to="/products" className="hover:text-cream transition">Products</Link>
          {user && <Link to="/dashboard" className="hover:text-cream transition">Dashboard</Link>}
          {isAdmin && <Link to="/admin" className="hover:text-cream transition flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Admin</Link>}
        </nav>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/auth" className="hidden sm:inline-flex items-center px-4 h-9 rounded-md text-sm text-ash hover:text-cream transition">Sign in</Link>
              <Link to="/auth" search={{ mode: "register" }} className="inline-flex items-center px-4 h-9 rounded-md text-sm bg-cream text-obsidian font-medium hover:bg-ash transition">Get started</Link>
            </>
          ) : (
            <div className="relative">
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
        </div>
      </div>
    </header>
  );
}
