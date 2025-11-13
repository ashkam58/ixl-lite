// assets/nav.js
// Unified, data-driven navigation built from manifest.json
(function(){
  const root = (function(){
    // infer root from this script path
    const s = document.currentScript || (document.scripts && document.scripts[document.scripts.length-1]);
    const src = (s && s.src) ? s.src.replace(/\\/g,'/') : '';
    return src ? src.replace(/\/assets\/nav\.js$/, '/') : './';
  })();

  const manifestUrl = root + 'manifest.json';

  function by(arr, key){
    return arr.reduce((m, x)=>{ const k = key(x); (m[k]||(m[k]=[])).push(x); return m; },{});
  }

  function niceLabel(segment){
    if(/^grade\d+$/i.test(segment)) return segment.replace(/^grade/i,'Grade ');
    const map = { geometry:'Geometry', abacus:'Abacus', chess:'Chess', python:'Python' };
    return map[segment] || (segment.charAt(0).toUpperCase()+segment.slice(1));
  }

  function computeNav(manifest){
    // derive subject from slug's first segment
    const withParts = manifest.map(m => {
      const parts = (m.slug||'').split('/');
      return Object.assign({}, m, { parts, subject: parts[0]||'' });
    });

    // group math grades (gradeN), keep others as is
    const mathItems = withParts.filter(m => /^grade\d+$/i.test(m.subject));
    const otherItems = withParts.filter(m => !/^grade\d+$/i.test(m.subject));
    const mathByGrade = by(mathItems, m=>m.subject); // grade3, grade7, ...
    const subjects = [];
    if(Object.keys(mathByGrade).length){
      subjects.push({ key:'math', label:'Math', grades: Object.keys(mathByGrade).sort(), itemsByGrade: mathByGrade });
    }
    // add non-math subjects
    const othersBySubject = by(otherItems, m=>m.subject);
    Object.keys(othersBySubject).sort().forEach(k=>{
      subjects.push({ key:k, label:niceLabel(k), grades:null, items: othersBySubject[k]});
    });

    // ensure Python appears even if no manifest entries yet
    if(!subjects.some(s=>s.key==='python')){
      subjects.push({ key:'python', label:'Python', grades:null, items: [] });
    }

    // compute derived filters: grades, levels, tags
    const gradeKeys = Array.from(new Set(withParts
      .map(m=>m.parts[0])
      .filter(p=>/^grade\d+$/i.test(String(p)))
    )).sort();
    const levels = Array.from(new Set(withParts.map(m=>m.level).filter(Boolean)));
    const tagCounts = {};
    withParts.forEach(m=> (m.tags||[]).forEach(t=>{ const k=String(t).toLowerCase(); tagCounts[k]=(tagCounts[k]||0)+1; }));
    const tags = Object.keys(tagCounts).sort((a,b)=> tagCounts[b]-tagCounts[a]).slice(0,12);

    return { subjects, flat: withParts, filterMeta: { gradeKeys, levels, tags } };
  }

  function pageSlug(){
    const parts = location.pathname.replace(/\\/g,'/').split('/').filter(Boolean);
    const chap = parts.indexOf('chapters');
    if(chap === -1) return null;
    return parts.slice(chap+1).join('/').replace(/\.html$/,'');
  }

  function linkFor(slug){ return root + 'chapters/' + slug + '.html'; }

  function isHome(){
    const p = location.pathname.replace(/\\/g,'/');
    if(p.includes('/chapters/')) return false;
    return /\/index\.html?$/i.test(p) || /\/$/.test(p);
  }

  function buildTopbar(subjectModel){
    const bar = document.querySelector('.topbar .wrap');
    if(!bar) return;

    // brand (ensure exists)
    if(!bar.querySelector('.brand')){
      const a = document.createElement('a'); a.href = root + 'index.html'; a.className='brand';
      a.innerHTML = '<span class="logo" aria-hidden="true"></span><span>IXL-lite</span>';
      bar.prepend(a);
    }

    // subjects dropdown (desktop)
    let subj = bar.querySelector('.subjects');
    if(!subj){ subj = document.createElement('nav'); subj.className='subjects'; subj.setAttribute('aria-label','Subjects'); bar.insertBefore(subj, bar.querySelector('.site-search')||null); }
    subj.innerHTML='';

    subjectModel.subjects.forEach(s=>{
      const btn = document.createElement('button');
      btn.type='button'; btn.className='subject-btn'; btn.textContent = s.label;
      btn.addEventListener('click',()=> {
        if(isHome()){
          document.dispatchEvent(new CustomEvent('ixl:subject', {detail:{subject: s.key}}));
        }
        if(s.key==='python' && (!s.items || s.items.length===0)){
          // Navigate to python lab when no manifest topics yet
          location.href = root + 'chapters/python/index.html';
        } else {
          openMegaMenu(s);
        }
      });
      subj.appendChild(btn);
    });

    // mobile toggle
    let hamb = bar.querySelector('.hamburger');
    if(!hamb){ hamb = document.createElement('button'); hamb.className='hamburger'; hamb.setAttribute('aria-label','Open menu'); hamb.textContent='☰'; bar.appendChild(hamb); }
    hamb.addEventListener('click',()=> toggleDrawer(subjectModel));
  }

  function ensureContainers(){
    // subject submenu container
    let sub = document.getElementById('subjectSubmenu');
    if(!sub){ sub = document.createElement('div'); sub.id='subjectSubmenu'; sub.className='subject-submenu'; sub.hidden = true; document.querySelector('.topbar')?.appendChild(sub); }
    // mobile drawer
    let drawer = document.getElementById('mobileMenu');
    if(!drawer){ drawer = document.createElement('div'); drawer.id='mobileMenu'; drawer.className='mobile-drawer'; drawer.hidden = true; drawer.setAttribute('aria-hidden','true'); drawer.innerHTML='<div class="drawer-inner"></div>'; document.querySelector('.topbar')?.appendChild(drawer); }
  }

  function openMegaMenu(subject){
    const panel = document.getElementById('subjectSubmenu');
    if(!panel) return;
    const close = ()=>{ panel.hidden = true; panel.setAttribute('aria-hidden','true'); panel.innerHTML=''; document.removeEventListener('click', outside); };
    const outside = (e)=>{ if(!panel.contains(e.target) && !e.target.closest('.subject-btn')) close(); };

    const wrap = document.createElement('div'); wrap.className='submenu-inner';
    const title = document.createElement('div'); title.className='submenu-title'; title.textContent = subject.label + ' — Explore';
    wrap.appendChild(title);

    const actions = document.createElement('div'); actions.className='submenu-actions';

    if(subject.grades){
      subject.grades.sort().forEach(gr =>{
        const btn = document.createElement('a');
        btn.className='btn primary';
        btn.href = root + 'index.html#' + gr;
        btn.textContent = niceLabel(gr);
        btn.addEventListener('click', (e)=>{
          if(isHome()){
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('ixl:grade', {detail:{grade: gr}}));
          }
        });
        actions.appendChild(btn);
      });
    }else{
      // show top 6 topics
      (subject.items||[]).slice(0,6).forEach(item=>{
        const a = document.createElement('a'); a.className='btn'; a.href = linkFor(item.slug); a.textContent = item.title.replace(/^[^•]*•\s*/,''); actions.appendChild(a);
      });
    }
    wrap.appendChild(actions);
    const note = document.createElement('div'); note.className='submenu-note muted'; note.textContent='Use Search to find any topic quickly';
    wrap.appendChild(note);

    panel.innerHTML=''; panel.appendChild(wrap); panel.hidden=false; panel.setAttribute('aria-hidden','false');
    setTimeout(()=> document.addEventListener('click', outside),0);
  }

  function toggleDrawer(model){
    const drawer = document.getElementById('mobileMenu');
    if(!drawer) return;
    const inner = drawer.querySelector('.drawer-inner');
    if(drawer.getAttribute('data-built') !== '1'){
      inner.innerHTML='';
      const h = document.createElement('h3'); h.textContent='Browse'; inner.appendChild(h);
      model.subjects.forEach(s=>{
        const g = document.createElement('div'); g.className='drawer-group';
        const t = document.createElement('div'); t.className='drawer-title'; t.textContent=s.label; g.appendChild(t);
        const links = document.createElement('div'); links.className='drawer-links';
        if(s.grades){
          s.grades.sort().forEach(gr=>{
            const a = document.createElement('a'); a.className='drawer-btn'; a.href = root + 'index.html#'+gr; a.textContent = niceLabel(gr);
            a.addEventListener('click', (e)=>{ if(isHome()){ e.preventDefault(); document.dispatchEvent(new CustomEvent('ixl:grade', {detail:{grade: gr}})); }});
            links.appendChild(a);
          });
        }else{
          (s.items||[]).slice(0,6).forEach(item=>{
            const a = document.createElement('a'); a.className='drawer-btn'; a.href = linkFor(item.slug); a.textContent=item.title; links.appendChild(a);
          });
        }
        g.appendChild(links); inner.appendChild(g);
      });
      drawer.setAttribute('data-built','1');
    }
    const nowHidden = drawer.hidden;
    drawer.hidden = !nowHidden;
    drawer.setAttribute('aria-hidden', String(!nowHidden));
  }

  function buildSidebar(model){
  // Only on index page or root
  if(!(location.pathname === '/' || /\/index\.html?$/.test(location.pathname))) return;
    const container = document.getElementById('sidebar');
    if(!container) return;
    container.innerHTML = '';

    const header = document.createElement('div'); header.className='filter-header';
    const h = document.createElement('h3'); h.textContent = 'Filters'; header.appendChild(h);
    const clear = document.createElement('button'); clear.type='button'; clear.className='clear-filters'; clear.textContent='Clear Filters'; header.appendChild(clear);
    container.appendChild(header);

    // Courses (subjects)
    const courses = document.createElement('section'); courses.className='filter-group';
    courses.innerHTML = '<div class="group-title">Courses</div>';
    const courseList = document.createElement('div'); courseList.className='filter-list';
    const subjectKeys = Array.from(new Set(model.subjects.map(s=>s.key)));
    subjectKeys.forEach(key=>{
      const id = 'f-sub-'+key;
      const row = document.createElement('label'); row.className='filter-option'; row.setAttribute('for', id);
      row.innerHTML = `<input id="${id}" type="checkbox" data-filter="subject" value="${key}"><span>${niceLabel(key)}</span>`;
      courseList.appendChild(row);
    });
    courses.appendChild(courseList); container.appendChild(courses);

    // Grade group
    const grades = document.createElement('section'); grades.className='filter-group';
    grades.innerHTML = '<div class="group-title">Grade</div>';
    const gradeList = document.createElement('div'); gradeList.className='filter-list';
    (model.filterMeta.gradeKeys||[]).forEach(gr=>{
      const id = 'f-gr-'+gr;
      const row = document.createElement('label'); row.className='filter-option'; row.setAttribute('for', id);
      row.innerHTML = `<input id="${id}" type="checkbox" data-filter="grade" value="${gr}"><span>${niceLabel(gr)}</span>`;
      gradeList.appendChild(row);
    });
    grades.appendChild(gradeList); container.appendChild(grades);

    // Level group
    const levels = document.createElement('section'); levels.className='filter-group';
    levels.innerHTML = '<div class="group-title">Skill Level</div>';
    const levelList = document.createElement('div'); levelList.className='filter-list';
    (model.filterMeta.levels||[]).forEach(lv=>{
      const id = 'f-lv-'+lv;
      const row = document.createElement('label'); row.className='filter-option'; row.setAttribute('for', id);
      row.innerHTML = `<input id="${id}" type="checkbox" data-filter="level" value="${lv}"><span>${lv}</span>`;
      levelList.appendChild(row);
    });
    levels.appendChild(levelList); container.appendChild(levels);

    // Top tags
    const tags = document.createElement('section'); tags.className='filter-group';
    tags.innerHTML = '<div class="group-title">Topics</div>';
    const tagList = document.createElement('div'); tagList.className='filter-list';
    (model.filterMeta.tags||[]).forEach(tg=>{
      const id = 'f-tag-'+tg;
      const row = document.createElement('label'); row.className='filter-option'; row.setAttribute('for', id);
      row.innerHTML = `<input id="${id}" type="checkbox" data-filter="tag" value="${tg}"><span>${tg}</span>`;
      tagList.appendChild(row);
    });
    tags.appendChild(tagList); container.appendChild(tags);

    // Wire changes: gather checked values and emit ixl:filters
    function emit(){
      const inputs = container.querySelectorAll('input[type="checkbox"][data-filter]');
      const out = { subjects:[], grades:[], levels:[], tags:[] };
      inputs.forEach(inp=>{ if(inp.checked){ const k = inp.getAttribute('data-filter'); out[k+'s']?.push(inp.value); }});
      document.dispatchEvent(new CustomEvent('ixl:filters', {detail: out}));
    }
    container.addEventListener('change', (e)=>{ const t = e.target; if(t && t.matches('input[type="checkbox"][data-filter]')) emit(); });
    clear.addEventListener('click', ()=>{ container.querySelectorAll('input[type="checkbox"]').forEach(i=> i.checked=false); emit(); });

    // Build filter toolbar + drawer for mobile
    buildFilterToolbar(container);
  }

  function buildFilterToolbar(sidebarEl){
    const host = document.querySelector('.container'); if(!host) return;
    let bar = document.querySelector('.filter-toolbar');
    if(!bar){
      bar = document.createElement('div'); bar.className='filter-toolbar';
      const btn = document.createElement('button'); btn.type='button'; btn.className='btn'; btn.textContent='Filters';
      bar.appendChild(btn); host.prepend(bar);
      btn.addEventListener('click', ()=> openFilterDrawer(sidebarEl));
    }
  }

  function openFilterDrawer(sidebarEl){
    let drawer = document.getElementById('filterDrawer');
    if(!drawer){ drawer = document.createElement('div'); drawer.id='filterDrawer'; drawer.className='filter-drawer'; drawer.hidden = true; document.body.appendChild(drawer); }
    // Clone sidebar filters into drawer
    drawer.innerHTML = '';
    const inner = document.createElement('div');
    inner.innerHTML = sidebarEl.innerHTML;

    const ensureUniqueIds = ()=>{
      const clones = inner.querySelectorAll('input[type="checkbox"][data-filter]');
      clones.forEach((input, idx)=>{
        const originalId = input.getAttribute('id') || `filter-${idx}`;
        input.dataset.sourceId = originalId;
        const cloneId = `drawer-${originalId}-${idx}`;
        input.id = cloneId;
        const label = input.closest('label');
        if(label){ label.setAttribute('for', cloneId); }
      });
    };
    ensureUniqueIds();

    // Add actions
    const actions = document.createElement('div'); actions.className='filter-actions';
    const closeBtn = document.createElement('button'); closeBtn.className='btn'; closeBtn.textContent='Close';
    const applyBtn = document.createElement('button'); applyBtn.className='btn primary'; applyBtn.textContent='Apply';
    actions.appendChild(closeBtn); actions.appendChild(applyBtn);
    inner.appendChild(actions);
    drawer.appendChild(inner);
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-modal','true');
    drawer.setAttribute('aria-label','Filters');

    const copyStatesFromSidebar = ()=>{
      const src = sidebarEl.querySelectorAll('input[type="checkbox"][data-filter]');
      const dst = drawer.querySelectorAll('input[type="checkbox"][data-filter]');
      const map = new Map(); src.forEach(s=> map.set(s.id, s.checked));
      dst.forEach(d=>{
        const id = d.dataset.sourceId || d.id;
        if(map.has(id)) d.checked = map.get(id);
      });
    };
    const copyStatesToSidebar = ()=>{
      const src = drawer.querySelectorAll('input[type="checkbox"][data-filter]');
      const map = new Map(); src.forEach(s=> map.set(s.dataset.sourceId || s.id, s.checked));
      const dst = sidebarEl.querySelectorAll('input[type="checkbox"][data-filter]');
      dst.forEach(d=>{
        const id = d.id;
        if(map.has(id)) d.checked = map.get(id);
      });
    };

    copyStatesFromSidebar();
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden','false');

    const emitFromDrawer = ()=>{
      const inputs = drawer.querySelectorAll('input[type="checkbox"][data-filter]');
      const out = { subjects:[], grades:[], levels:[], tags:[] };
      inputs.forEach(inp=>{ if(inp.checked){ const k = inp.getAttribute('data-filter'); out[k+'s']?.push(inp.value); }});
      document.dispatchEvent(new CustomEvent('ixl:filters', {detail: out}));
    };

    const cloneClear = inner.querySelector('.clear-filters');
    if(cloneClear){
      cloneClear.addEventListener('click', ()=>{
        drawer.querySelectorAll('input[type="checkbox"][data-filter]').forEach(i=> i.checked = false);
        copyStatesToSidebar();
        emitFromDrawer();
      });
    }

    const closeDrawer = ()=>{
      drawer.hidden = true;
      drawer.setAttribute('aria-hidden','true');
    };

    // Auto-apply and close the drawer when a filter is selected on mobile
    drawer.onchange = (e)=>{
      const t = e.target;
      if(t && t.matches('input[type="checkbox"][data-filter]')){
        copyStatesToSidebar();
        emitFromDrawer();
        closeDrawer();
      }
    };
    // Explicit controls
    closeBtn.addEventListener('click', closeDrawer);
    applyBtn.addEventListener('click', ()=>{ copyStatesToSidebar(); emitFromDrawer(); closeDrawer(); });
    // Escape to close
    drawer.onkeydown = (e)=>{ if(e.key==='Escape'){ closeDrawer(); } };
  }

  function buildBreadcrumb(model){
    const slug = pageSlug(); if(!slug) return;
    let crumb = document.querySelector('.breadcrumb');
    if(!crumb){ crumb = document.createElement('nav'); crumb.className='breadcrumb'; document.body.prepend(crumb); }
    const parts = slug.split('/');
    let subject = parts[0];
    const grade = /^grade\d+$/i.test(subject) ? subject : null;
    const subjectLabel = grade ? 'Math' : niceLabel(subject);
    const item = model.flat.find(x=>x.slug===slug);

    function a(href, txt){ const el=document.createElement('a'); el.href=href; el.textContent=txt; return el; }
    function sep(){ const s=document.createElement('span'); s.className='sep'; s.textContent='›'; return s; }

    crumb.innerHTML='';
    crumb.appendChild(a(root+'index.html','Home'));
    crumb.appendChild(sep());
    crumb.appendChild(a(root+'index.html#'+(grade||subject), subjectLabel));
    if(grade){ crumb.appendChild(sep()); crumb.appendChild(a(root+'index.html#'+grade, niceLabel(grade))); }
    if(item){ crumb.appendChild(sep()); const cur=document.createElement('span'); cur.textContent=item.title; crumb.appendChild(cur); }
  }

  function buildPager(model){
    const slug = pageSlug(); if(!slug) return;
    const idx = model.flat.findIndex(x=>x.slug===slug);
    if(idx === -1) return;
    const prev = idx>0 ? model.flat[idx-1] : null;
    const next = idx<model.flat.length-1 ? model.flat[idx+1] : null;
    let pager = document.querySelector('.pager');
    if(!pager){ pager = document.createElement('div'); pager.className='pager'; document.body.prepend(pager); }
    pager.innerHTML='';
    const mk = (lbl, href, cls)=>{ const el = document.createElement(href?'a':'span'); el.className=cls; el.textContent=lbl; if(href) el.href=href; return el; };
    pager.appendChild(mk('Prev', prev?linkFor(prev.slug):null, 'prev'));
    pager.appendChild(mk('Next', next?linkFor(next.slug):null, 'next'));
    document.documentElement.setAttribute('data-pager','1');
  }

  function keyboardShortcuts(model){
    document.addEventListener('keydown', (e)=>{
      if(e.key === '/'){
        const q = document.getElementById('q') || document.getElementById('q-mobile');
        if(q){ q.focus(); q.select(); e.preventDefault(); }
      }
      if(e.key === '['){
        const slug = pageSlug(); if(!slug) return;
        const idx = model.flat.findIndex(x=>x.slug===slug); if(idx>0){ location.href = linkFor(model.flat[idx-1].slug); }
      }
      if(e.key === ']'){
        const slug = pageSlug(); if(!slug) return;
        const idx = model.flat.findIndex(x=>x.slug===slug); if(idx!==-1 && idx<model.flat.length-1){ location.href = linkFor(model.flat[idx+1].slug); }
      }
    });
  }

  function ensureSearch(){
    // simple search wiring using manifest titles
    function wire(inputId){
      const input = document.getElementById(inputId);
      if(!input) return;
      const btn = input.form && input.form.querySelector('button');
      const go = ()=>{ const q=input.value.trim().toLowerCase(); if(!q) return; document.dispatchEvent(new CustomEvent('ixl:search', {detail:{q}})); };
      if(btn) btn.addEventListener('click', go);
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ go(); e.preventDefault(); }});
    }
    wire('q'); wire('q-mobile');
  }

  function searchBinding(model){
    document.addEventListener('ixl:search', (ev)=>{
      // On chapters: navigate to first hit; on home: let the page filter
      if(isHome()) return;
      const q = (ev.detail?.q || '').toLowerCase();
      const hit = model.flat.find(m => (m.title||'').toLowerCase().includes(q) || (m.slug||'').toLowerCase().includes(q) || (m.tags||[]).join(',').toLowerCase().includes(q));
      if(hit) location.href = linkFor(hit.slug);
    });
  }

  function init(model){
    ensureContainers();
    buildTopbar(model);
    buildSidebar(model);
    buildBreadcrumb(model);
    buildPager(model);
    ensureSearch();
    searchBinding(model);
    document.body.setAttribute('data-nav-ready','1');
  }

  fetch(manifestUrl, {cache:'no-cache'})
    .then(r=>r.json())
    .then(data=> computeNav(data))
    .then(model=>{ init(model); })
    .catch(()=>{
      // graceful: still mark ready so global fallback doesn’t show floating FAB
      document.body.setAttribute('data-nav-ready','1');
    });
})();
