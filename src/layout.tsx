import type { FC, PropsWithChildren } from "hono/jsx";
import type { SeoMeta } from "./lib/seo";
import type { SessionUser } from "./lib/types";
import { SITE_NAME } from "./lib/constants";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
// CSS is built separately via `vite build --mode client` → /static/client.css

type LayoutProps = PropsWithChildren<{ meta: SeoMeta; currentPath?: string; user?: SessionUser | null; notificationCount?: number }>;

export const Layout: FC<LayoutProps> = ({ meta, currentPath, user, notificationCount, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.url} />

        {/* Open Graph */}
        <meta property="og:type" content={meta.type} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.url} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:site_name" content={SITE_NAME} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.ogImage} />

        {/* Fonts are self-hosted via @font-face in globals.css — zero third-party requests */}

        {/* Styles */}
        <link rel="stylesheet" href="/static/client.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* Theme init — must be in <head> to prevent FOUC */}
        <script src="/static/theme-init.js" />
      </head>
      <body class="flex min-h-screen flex-col bg-background text-foreground font-sans text-sm antialiased">
        {/* WCAG 2.4.1: Skip to main content link */}
        <a href="#main-content" class="skip-to-main">Skip to main content</a>
        <Header currentPath={currentPath} user={user} notificationCount={notificationCount} />
        <main id="main-content" tabindex={-1} class="flex-1 outline-none">{children}</main>
        <Footer />
        {/* WCAG 4.1.3: aria-live region for dynamic status messages */}
        <div id="live-region" aria-live="polite" aria-atomic="true" class="sr-only" />
        <ClientScript />
      </body>
    </html>
  );
};

const ClientScript: FC = () => (
  <script src="/static/client.js" defer />
);
