import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "login" | "register"; redirect?: string } => ({
    mode: s.mode === "register" ? "register" : s.mode === "login" ? "login" : undefined,
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") ? s.redirect : undefined,
  }),
  head: () => ({ meta: [
    {"title": "Sign In \u2014 CyberTown Tech"},
    {"name": "description", "content": "Sign in or create your CyberTown Tech account."},
    {"property": "og:title", "content": "Sign In \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Sign in or create your CyberTown Tech account."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setIsRegister(mode === "register"); }, [mode]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) window.location.href = redirect ?? "/"; });
  }, [navigate, redirect]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        if (redirect) window.location.href = redirect;
        else navigate({ to: "/" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }


  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + (redirect ?? "/dashboard") });
    if (result.error) { toast.error("Google sign in failed"); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 bg-grid opacity-[0.07]" />
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-ash hover:text-cream transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="CyberTown" className="w-14 h-14 rounded-full mx-auto ring-1 ring-stone/40 mb-4" />
          <h1 className="text-3xl font-display font-semibold tracking-tight">{isRegister ? "Create account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-2">{isRegister ? "Join CyberTown Tech" : "Sign in to your dashboard"}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-7 space-y-4">
          <button onClick={handleGoogle} disabled={loading} className="w-full h-11 rounded-lg border border-border hover:border-stone bg-obsidian text-cream text-sm font-medium flex items-center justify-center gap-3 transition disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#fff" d="M21.35 11.1h-9.18v2.95h5.27c-.23 1.37-1.62 4-5.27 4-3.17 0-5.76-2.62-5.76-5.85S8.99 6.35 12.17 6.35c1.8 0 3.01.77 3.7 1.42l2.52-2.44C16.79 3.84 14.7 3 12.17 3 6.95 3 2.75 7.2 2.75 12.4S6.95 21.8 12.17 21.8c7.04 0 9.4-4.95 9.4-7.49 0-.5-.06-.88-.22-1.21z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border" />OR<div className="flex-1 h-px bg-border" /></div>
          <form onSubmit={handleEmail} className="space-y-3">
            {isRegister && (
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className="w-full h-11 px-4 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm" />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email address" className="w-full h-11 px-4 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Password" className="w-full h-11 px-4 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm" />
            <button disabled={loading} className="w-full h-11 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegister ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            {isRegister ? "Already have an account? " : "New to CyberTown? "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-cream hover:underline">
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
