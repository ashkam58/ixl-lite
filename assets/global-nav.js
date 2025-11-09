(function(){
  // Robust base detection: derive root from this script's URL
  const scriptEl = document.currentScript || (document.scripts && document.scripts[document.scripts.length-1]);
  const scriptSrc = (scriptEl && scriptEl.src) ? scriptEl.src.replace(/\\/g, '/') : '';
  const assetsBase = scriptSrc.replace(/\/assets\/global-nav\.js$/, '/assets/');
  const root = assetsBase.replace(/\/assets\/$/, '/');
  const manifestUrl = root + 'manifest.json';

  function safeFetchJson(url){ return fetch(url, {cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error('no manifest'); return r.json(); }); }

  function makeLink(href, text, cls){ const a=document.createElement('a'); a.href=href; a.className = cls||''; a.textContent = text; return a; }
  function makeBtn(text, cls, disabled){ const b=document.createElement('button'); b.type='button'; b.className = cls||''; b.textContent = text; if(disabled) b.disabled = true; return b; }

  function shouldSkipInjection(){ // if page already has prev/next controls (ids used by engine), skip
    if(document.getElementById('prevTopic') || document.getElementById('nextTopic')) return true;
    // or if a global nav already exists
    if(document.querySelector('.global-nav')) return true;
    return false;
  }

  function injectNav(prevUrl, homeUrl, nextUrl){
    if(shouldSkipInjection()) return;
    const nav = document.createElement('div'); nav.className = 'global-nav';
    const style = document.createElement('style');
    style.textContent = `
      .global-nav{position:fixed; right:18px; bottom:18px; display:flex; gap:14px; z-index:9999; align-items:center;}
      .global-nav a, .global-nav button{display:inline-flex; align-items:center; gap:10px; padding:18px 22px; border-radius:16px; font-weight:700; text-decoration:none; color:#0f172a; background:linear-gradient(135deg,#a78bfa,#06b6d4); box-shadow:0 8px 22px rgba(2,6,23,0.12); border:0; font-size:1.15em; min-width:64px; min-height:48px; justify-content:center;}
      .global-nav a.ghost, .global-nav button.ghost{background:rgba(255,255,255,0.97); color:var(--text); border:1px solid rgba(2,6,23,0.06)}
      .global-nav a.home{background:linear-gradient(135deg,#06b6d4,#8b5cf6); color:white}
      .global-nav a:active, .global-nav button:active{transform:translateY(2px)}
      @media (max-width:720px){
        .global-nav{left:0; right:0; bottom:0; justify-content:center; width:100vw; gap:10px; padding:8px 0; border-radius:0; box-shadow:0 -2px 16px rgba(2,6,23,0.10); background:rgba(255,255,255,0.98);}
        .global-nav a, .global-nav button{padding:16px 0; font-size:1.1em; min-width:0; width:32vw; max-width:120px; min-height:44px; border-radius:14px;}
      }
    `;
    nav.appendChild(style);

    if(prevUrl) nav.appendChild(makeLink(prevUrl, '← Prev', 'prev-link'));
    else nav.appendChild(makeBtn('← Prev','ghost',true));

    // only show home if there isn't already a link to index present
    const hasHomeLink = !!document.querySelector('a[href$="index.html"], a[href="/"], a[href="./index.html"], a[href="../index.html"]');
    if(!hasHomeLink) nav.appendChild(makeLink(homeUrl, '🏠 Home', 'home'));

    if(nextUrl) nav.appendChild(makeLink(nextUrl, 'Next →', 'next-link'));
    else nav.appendChild(makeBtn('Next →','ghost',true));

    document.body.appendChild(nav);
  }

  // Build slug from location pathname
  function pageSlugFromPath(){
    const parts = location.pathname.replace(/\\/g,'/').split('/').filter(Boolean);
    const chap = parts.indexOf('chapters');
    if(chap === -1) return null;
    const slugParts = parts.slice(chap+1);
    let slug = slugParts.join('/').replace(/\.html$/,'');
    return slug;
  }

  safeFetchJson(manifestUrl).then(manifest=>{
    try{
      const slug = pageSlugFromPath();
      const homeUrl = root + 'index.html';
      if(!slug){ // not in chapters — still inject home if missing
        if(!document.querySelector('a[href$="index.html"]')) injectNav(null, homeUrl, null);
        return;
      }
      const idx = manifest.findIndex(m => m.slug === slug);
      if(idx === -1){ // try case-insensitive
        const li = manifest.findIndex(m => m.slug && m.slug.toLowerCase() === slug.toLowerCase());
        if(li !== -1) idx = li;
      }
      const prev = (typeof idx === 'number' && idx > 0) ? manifest[idx-1] : null;
      const next = (typeof idx === 'number' && idx !== -1 && idx < manifest.length-1) ? manifest[idx+1] : null;
      const prevUrl = prev ? (root + 'chapters/' + prev.slug + '.html') : null;
      const nextUrl = next ? (root + 'chapters/' + next.slug + '.html') : null;
      injectNav(prevUrl, root + 'index.html', nextUrl);
    }catch(e){
      // silent
      if(!document.querySelector('a[href$="index.html"]')) injectNav(null, root + 'index.html', null);
    }
  }).catch(()=>{
    // manifest missing — still inject home for convenience
    if(!document.querySelector('a[href$="index.html"]')) injectNav(null, root + 'index.html', null);
  });
})();
