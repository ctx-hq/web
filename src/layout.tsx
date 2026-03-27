import type { FC, PropsWithChildren } from "hono/jsx";
import type { SeoMeta } from "./lib/seo";
import { SITE_NAME } from "./lib/constants";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
// CSS is built separately via `vite build --mode client` → /static/client.css

type LayoutProps = PropsWithChildren<{ meta: SeoMeta }>;

export const Layout: FC<LayoutProps> = ({ meta, children }) => {
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

        {/* Styles */}
        <link rel="stylesheet" href="/static/client.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body class="bg-background text-foreground font-sans text-xs antialiased">
        <Header />
        <main class="min-h-[calc(100vh-5rem)]">{children}</main>
        <Footer />
        <ClientScript />
      </body>
    </html>
  );
};

const ClientScript: FC = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
// Theme
(function(){
  var t=localStorage.getItem('theme');
  if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))
    document.documentElement.classList.add('dark');
})();
document.getElementById('theme-toggle')?.addEventListener('click',function(){
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme',document.documentElement.classList.contains('dark')?'dark':'light');
});

// Copy buttons
document.addEventListener('click',function(e){
  var btn=e.target.closest('[data-copy]');
  if(!btn)return;
  navigator.clipboard.writeText(btn.dataset.copy).then(function(){
    var o=btn.textContent;btn.textContent='Copied!';
    setTimeout(function(){btn.textContent=o},1500);
  });
});

// Install tabs
document.addEventListener('click',function(e){
  var btn=e.target.closest('[data-tab]');
  if(!btn||!btn.closest('.install-tabs'))return;
  var tab=btn.dataset.tab,container=btn.closest('.install-tabs');
  container.querySelectorAll('[data-tab]').forEach(function(b){
    b.classList.toggle('border-b-foreground',b.dataset.tab===tab);
    b.classList.toggle('text-muted-foreground',b.dataset.tab!==tab);
  });
  container.querySelectorAll('[data-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.panel!==tab);
  });
});
`,
    }}
  />
);
