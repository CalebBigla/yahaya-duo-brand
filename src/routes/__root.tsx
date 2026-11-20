import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import appCss from "../styles.css?url";
// The two font files every public page needs above the fold (Latin subsets). Preloading
// them lets the browser fetch them alongside the CSS instead of after it.
import frauncesLatin from "@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url";
import manropeLatin from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { AdvisorButton } from "@/components/site/AdvisorButton";
import { LoadingState } from "@/components/site/LoadingState";
// The admin shell (sidebar, command palette, live notifications, dialogs) is only
// downloaded when someone opens /admin, not by every public visitor.
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
import { AdminRouteSkeleton } from "@/components/admin/SkeletonLoader";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme";
import { AdminAuthContext, type AdminAuthState } from "@/components/admin/AdminAuthContext";
import { checkAdminAccess, InactivityManager } from "@/lib/auth";
import { site, toE164 } from "@/lib/site";
import { brand } from "@/lib/brand";
import { Compass, Home, MessageCircle } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="site-public flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center px-5 py-24 sm:py-32">
        <div className="container-page">
          <div className="mx-auto max-w-xl text-center">
            <Compass className="mx-auto h-8 w-8 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
            <p className="t-eyebrow mt-6 text-accent-ink">Error 404</p>
            <h1 className="t-h2 mt-3 text-primary">This page has moved or no longer exists</h1>
            <p className="t-body mt-4 text-muted-foreground">
              The link may be out of date. Start from the homepage, or tell us what you were looking for.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/"
                className="btn-interactive inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
              >
                <Home className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Go to the homepage
              </Link>
              <Link
                to="/contact"
                className="btn-interactive inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/25 px-6 text-sm font-semibold text-primary hover:border-primary"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Contact us
              </Link>
            </div>
            <nav aria-label="Popular pages" className="mt-14 border-t border-border pt-8">
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 t-small">
                <li><Link to={brand.desks.travel.path} className="link-draw text-primary">{brand.desks.travel.name}</Link></li>
                <li><Link to={brand.desks.trade.path} className="link-draw text-primary">{brand.desks.trade.name}</Link></li>
                <li><Link to="/about" className="link-draw text-primary">About</Link></li>
                <li><Link to="/quote" className="link-draw text-primary">Enquire</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: site.name,
  alternateName: "Yahaya General Contracts",
  description:
    "Registered Nigerian company offering visa processing, flight bookings and tour packages alongside oil and gas trade, import/export, sourcing and procurement.",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    addressCountry: "NG",
  },
  telephone: site.phones.map(toE164),
  email: site.email,
  areaServed: "Nigeria",
  // Same list the footer and contact page show (site.hours), so they never disagree.
  openingHoursSpecification: site.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  })),
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Yahaya Travel and Trade Co Ltd | Yola, Adamawa" },
      {
        name: "description",
        content:
          "Yahaya Travel and Trade Co Ltd (RC 9295358) - Professional travel management and international trade facilitation in Jimeta-Yola, Adamawa. Services include visa processing, flight bookings, hotel reservations, tour packages, travel consultancy, oil & gas trade, import-export wholesaling, sourcing & procurement, and trade consultancy with compliance support.",
      },
      { name: "author", content: site.name },
      { property: "og:site_name", content: site.name },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", href: frauncesLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: manropeLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessJsonLd),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: RoutePendingState,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-W9KR17WE93"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-W9KR17WE93');
          `
        }} />
      </head>
      <body>
        {children}
        <Toaster position="top-right" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  
  // Check if current route is admin route
  const isAdminRoute = router.state.location.pathname.startsWith('/admin');

  // Admin routes should not have public site navbar/footer
  if (isAdminRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {['/admin/login', '/admin/forgot-password', '/admin/reset-password'].some((path) => router.state.location.pathname.startsWith(path))
            ? <Outlet />
            : <AdminDashboardShell />}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Public routes get navbar and footer
  return (
    <QueryClientProvider client={queryClient}>
      <div className="site-public flex min-h-screen flex-col">
        <Navbar />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <Footer />
        <AdvisorButton />
      </div>
    </QueryClientProvider>
  );
}

function AdminDashboardShell() {
  const navigate = useNavigate();
  const router = useRouter();
  const [auth, setAuth] = useState<AdminAuthState>({ status: 'checking', user: null });

  useEffect(() => {
    let inactivityManager: InactivityManager | null = null;
    let active = true;
    void checkAdminAccess().then((result) => {
      if (!active) return;
      if (!result.isAdmin) {
        if (result.error === 'DATABASE_ERROR') {
          setAuth({ status: 'error', user: null, errorMessage: 'Unable to verify admin access. Please try again.' });
        } else {
          void navigate({ to: '/admin/login' });
        }
        return;
      }
      setAuth({ status: 'authenticated', user: result.user });
      inactivityManager = new InactivityManager();
    });
    return () => {
      active = false;
      inactivityManager?.destroy();
    };
  }, [navigate]);

  const shellUser = auth.status === 'authenticated' ? auth.user : null;
  if (auth.status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900" aria-live="polite" aria-busy="true">
        <p className="sr-only">Verifying access and loading the admin dashboard.</p>
        <AdminRouteSkeleton pathname="/admin" />
      </div>
    );
  }

  if (auth.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div role="alert" className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p>{auth.errorMessage}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded bg-red-700 px-4 py-2 font-medium text-white">Reload page</button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<AdminShellFallback pathname={router.state.location.pathname} />}>
      <AdminLayout adminUser={shellUser}>
        <AdminAuthContext.Provider value={auth}>
          <Outlet />
        </AdminAuthContext.Provider>
      </AdminLayout>
    </Suspense>
  );
}

function RoutePendingState() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isAdminModule = pathname.startsWith("/admin") && !/^\/admin\/(login|forgot-password|reset-password)/.test(pathname);

  if (!isAdminModule) return <LoadingState />;

  return (
    <ThemeProvider>
      <Suspense fallback={<AdminShellFallback pathname={pathname} />}>
        <AdminLayout adminUser={null}>
          <div aria-live="polite" aria-busy="true">
            <p className="sr-only">Loading admin page.</p>
            <AdminRouteSkeleton pathname={pathname} />
          </div>
        </AdminLayout>
      </Suspense>
    </ThemeProvider>
  );
}

/** Shown for the moment the admin shell's code is downloading. */
function AdminShellFallback({ pathname }: { pathname: string }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950" aria-live="polite" aria-busy="true">
      <p className="sr-only">Loading the admin dashboard.</p>
      <AdminRouteSkeleton pathname={pathname} />
    </div>
  );
}
