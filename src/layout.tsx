import type { FC, PropsWithChildren } from "hono/jsx";
import type { SeoMeta } from "./lib/seo";
import type { SessionUser } from "./lib/types";
import { SITE_NAME } from "./lib/constants";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
// CSS is built separately via `vite build --mode client` → /static/client.css

type LayoutProps = PropsWithChildren<{ meta: SeoMeta; currentPath?: string; user?: SessionUser | null }>;

export const Layout: FC<LayoutProps> = ({ meta, currentPath, user, children }) => {
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

        {/* Fonts — JetBrains Mono (heading/mono) + Roboto Slab (body), non-blocking */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Roboto+Slab:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
          media="print"
          onload="this.media='all'"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Roboto+Slab:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>

        {/* Styles */}
        <link rel="stylesheet" href="/static/client.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* Theme init — must be in <head> to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
      </head>
      <body class="bg-background text-foreground font-sans text-xs antialiased">
        <Header currentPath={currentPath} user={user} />
        <main class="min-h-[calc(100vh-3rem)]">{children}</main>
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
/* --- Theme toggle --- */
function toggleTheme(){
  document.documentElement.classList.toggle('dark');
  try{localStorage.setItem('theme',document.documentElement.classList.contains('dark')?'dark':'light')}catch(e){}
}
document.getElementById('theme-toggle')?.addEventListener('click',toggleTheme);
document.getElementById('theme-toggle-mobile')?.addEventListener('click',toggleTheme);

/* --- Mobile nav --- */
document.getElementById('mobile-nav-toggle')?.addEventListener('click',function(){
  document.getElementById('mobile-nav')?.classList.toggle('hidden');
});

/* --- Copy buttons (swap only the text label, keep SVG icons) --- */
document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('[data-copy]'):null;
  if(!btn)return;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(btn.dataset.copy).then(function(){
      var label=null;
      for(var i=btn.childNodes.length-1;i>=0;i--){
        if(btn.childNodes[i].nodeType===3){label=btn.childNodes[i];break;}
      }
      if(label){var o=label.textContent;label.textContent='Copied!';setTimeout(function(){label.textContent=o},1500);}
    }).catch(function(){});
  }
});

/* --- Install tabs --- */
document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('[data-tab]'):null;
  if(!btn||!btn.closest('.install-tabs'))return;
  var tab=btn.dataset.tab,container=btn.closest('.install-tabs');
  container.querySelectorAll('[data-tab]').forEach(function(b){
    b.classList.toggle('border-b-foreground',b.dataset.tab===tab);
    b.classList.toggle('border-b-transparent',b.dataset.tab!==tab);
    b.classList.toggle('text-muted-foreground',b.dataset.tab!==tab);
  });
  container.querySelectorAll('[data-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.panel!==tab);
  });
});

/* --- OS detection + toggle --- */
(function(){
  var os=/Win/.test(navigator.platform)?'windows':'unix';
  document.querySelectorAll('[data-os-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.osPanel!==os);
  });
  document.querySelectorAll('[data-os-toggle]').forEach(function(b){
    b.classList.toggle('text-muted-foreground',b.dataset.osToggle!==os);
    b.classList.toggle('font-medium',b.dataset.osToggle===os);
  });
})();

document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('[data-os-toggle]'):null;
  if(!btn)return;
  var os=btn.dataset.osToggle;
  var container=btn.closest('.os-toggle');
  if(!container||!container.parentElement)return;
  var scope=container.parentElement;
  scope.querySelectorAll('[data-os-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.osPanel!==os);
  });
  container.querySelectorAll('[data-os-toggle]').forEach(function(b){
    b.classList.toggle('text-muted-foreground',b.dataset.osToggle!==os);
    b.classList.toggle('font-medium',b.dataset.osToggle===os);
  });
});

/* --- Copy code blocks in prose (read from <code>, not <pre>) --- */
document.querySelectorAll('.prose pre').forEach(function(pre){
  var code=pre.querySelector('code');
  var btn=document.createElement('button');
  btn.textContent='Copy';
  btn.className='absolute top-2 right-2 px-2 py-0.5 text-xs bg-background border border-border text-muted-foreground hover:text-foreground';
  btn.setAttribute('data-copy-btn','');
  btn.onclick=function(){
    var text=code?code.textContent:pre.textContent||'';
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text||'').then(function(){
        btn.textContent='Copied!';
        setTimeout(function(){btn.textContent='Copy'},1500);
      }).catch(function(){});
    }
  };
  pre.style.position='relative';
  pre.appendChild(btn);
});
`,
    }}
  />
);
