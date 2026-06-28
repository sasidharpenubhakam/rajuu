import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-7xl text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">This page drifted away.</p>
        <a href="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 text-primary-foreground">Back home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl text-primary">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-primary px-5 py-2 text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sathyabhaama — Wear Confidence | Sarees & Ladies Wear" },
      { name: "description", content: "Shop exquisite sarees, kurtis and lehengas at Sathyabhaama. Silk, cotton, designer & bridal collections curated with love." },
      { property: "og:title", content: "Sathyabhaama — Wear Confidence | Sarees & Ladies Wear" },
      { property: "og:description", content: "Shop exquisite sarees, kurtis and lehengas at Sathyabhaama. Silk, cotton, designer & bridal collections curated with love." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Sathyabhaama — Wear Confidence | Sarees & Ladies Wear" },
      { name: "twitter:description", content: "Shop exquisite sarees, kurtis and lehengas at Sathyabhaama. Silk, cotton, designer & bridal collections curated with love." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ac38021a-6032-406f-9056-4e46565412a9/id-preview-c14c6d76--0e33d73e-ab54-4e93-b4d1-c78a309d5dec.lovable.app-1780345466015.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ac38021a-6032-406f-9056-4e46565412a9/id-preview-c14c6d76--0e33d73e-ab54-4e93-b4d1-c78a309d5dec.lovable.app-1780345466015.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && isAdmin && !path.startsWith("/admin") && path !== "/login") {
      router.navigate({ to: "/admin" });
    }
  }, [isAdmin, loading, path, router]);

  if (isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1"><Outlet /></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
