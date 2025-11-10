// assets/global-nav.js (fallback pager)
(function(){
  // Skip if new nav already ran
  if(document.body && document.body.getAttribute('data-nav-ready')==='1') return;

  const scriptEl = document.currentScript || (document.scripts && document.scripts[document.scripts.length-1]);
  const scriptSrc = (scriptEl && scriptEl.src) ? scriptEl.src.replace(/\\/g, '/') : '';
  const assetsBase = scriptSrc.replace(/\/assets\/global-nav\.js$/, '/assets/');
  const root = assetsBase.replace(/\/assets\/$/, '/');
  const manifestUrl = root + 'manifest.json';

  function pageSlug(){
    const parts = location.pathname.replace(/\\/g,'/').split('/').filter(Boolean);
    const i = parts.indexOf('chapters');
    if(i === -1) return null;
    return parts.slice(i+1).join('/').replace(/\.html$/,'');
  }

  function injectHeaderPager(prevUrl, nextUrl){
    let pager = document.querySelector('.pager');
    if(!pager){ pager = document.createElement('div'); pager.className='pager'; document.body.prepend(pager); }
    const mk = (lbl, href, cls)=>{ const el = document.createElement(href?'a':'span'); el.className=cls; el.textContent=lbl; if(href) el.href=href; return el; };
    pager.innerHTML='';
    pager.appendChild(mk('Prev', prevUrl, 'prev'));
    pager.appendChild(mk('Next', nextUrl, 'next'));
  }

  fetch(manifestUrl, {cache:'no-cache'})
    .then(r=>r.json())
    .then(manifest=>{
      const slug = pageSlug();
      if(!slug) return; // index: no pager
      let idx = manifest.findIndex(m=> m.slug===slug);
      if(idx === -1){ const li = manifest.findIndex(m=> m.slug && m.slug.toLowerCase()===slug.toLowerCase()); if(li!==-1) idx = li; }
      const prev = idx>0 ? manifest[idx-1] : null;
      const next = (idx!==-1 && idx<manifest.length-1) ? manifest[idx+1] : null;
      const prevUrl = prev ? (root + 'chapters/' + prev.slug + '.html') : null;
      const nextUrl = next ? (root + 'chapters/' + next.slug + '.html') : null;
      injectHeaderPager(prevUrl, nextUrl);
    })
    .catch(()=>{/*silent*/});
})();

