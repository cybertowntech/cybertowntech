import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/context/CartContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-display font-semibold text-cream glitch">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in CyberTown</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-cream px-4 py-2 text-sm font-medium text-obsidian hover:bg-ash transition">
          Back to home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-cream px-4 py-2 text-sm text-obsidian hover:bg-ash">Try again</button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CyberTown Tech" },
      { name: "description", content: "Digital goods and web development services from Malaysia." },
      { name: "author", content: "CyberTown Store" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "CyberTown Store" },
      { property: "og:title", content: "CyberTown Tech" },
      { name: "twitter:title", content: "CyberTown Tech" },
      { property: "og:description", content: "Digital goods and web development services from Malaysia." },
      { name: "twitter:description", content: "Digital goods and web development services from Malaysia." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/a44Kqh7Br7gPyofnpZ91PbvxTD43/social-images/social-1780619584491-6055398009392009074.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/a44Kqh7Br7gPyofnpZ91PbvxTD43/social-images/social-1780619584491-6055398009392009074.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function AuthListener() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <AuthListener />
        <Toaster theme="dark" position="top-right" richColors />
        <Outlet />
      </CartProvider>
    </QueryClientProvider>
  );
}
