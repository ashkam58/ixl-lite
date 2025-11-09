
// /engine/core.js
(function(){
  async function loadJSON(url){ const r = await fetch(url); return r.json(); }
  function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }

  async function loadTopic(cfg){
    const stateKey = `ixl:${cfg.topicId}`;
    const saved = JSON.parse(localStorage.getItem(stateKey) || "{}");
    const data = await loadJSON(cfg.dataUrl);   // array of {prompt, answer, hint}
    const manifest = await loadJSON(cfg.nav.manifestUrl);

    let i = saved.i || 0, score = saved.score || 0, attempts = saved.attempts || 0, streak = saved.streak || 0;

    function save(){ localStorage.setItem(stateKey, JSON.stringify({i,score,attempts,streak})); }

    function renderQ(){
      const q = data[i % data.length];
      cfg.promptEl.innerHTML = `<h2>${q.prompt}</h2>` + (q.modelHtml ? `<div>${q.modelHtml}</div>`:''); 
      cfg.answerEl.value = '';
      cfg.feedbackEl.textContent = '';
      cfg.feedbackEl.className = 'feedback';
      updateHud();
      cfg.answerEl.focus();
    }

    function updateHud(){
      cfg.scoreEl.textContent = score;
      cfg.attemptsEl.textContent = attempts;
      cfg.masteryEl.textContent = pct(score, Math.max(1, attempts)) + '%';
      cfg.streakEl.textContent = streak;
      save();
    }

    cfg.buttons.check.onclick = () => {
      const q = data[i % data.length];
      attempts++;
      const user = (cfg.answerEl.value ?? '').trim();
      const correct = String(q.answer).trim();
      if(user === correct){
        score++; streak++;
        cfg.feedbackEl.textContent = 'Correct!';
        cfg.feedbackEl.className = 'feedback ok';
        window.IxlUI.confetti(cfg.topicId);
        i++;
      }else{
        streak = 0;
        cfg.feedbackEl.textContent = (q.explainWrong || 'Try breaking it into simpler steps.');
        cfg.feedbackEl.className = 'feedback no';
      }
      updateHud();
      renderQ();
    };

    cfg.buttons.next.onclick = () => { i++; renderQ(); };
    cfg.buttons.skip.onclick = () => { i++; renderQ(); };
    cfg.buttons.hint.onclick = () => {
      const q = data[i % data.length];
      window.IxlUI.toast(q.hint || 'Look at place value or a simpler case.');
    };

    function navTo(offset){
      const here = cfg.topicId; // slug end
      const idx = manifest.findIndex(m => m.slug.endsWith(here));
      const next = manifest[idx + offset];
      if(next){ location.href = `../${next.slug}.html`; }
      else { window.IxlUI.toast('No more topics.'); }
    }
    cfg.nav.prevBtn.onclick = () => navTo(-1);
    cfg.nav.nextBtn.onclick = () => navTo(+1);

    renderQ();
  }

  window.IxlLite = { loadTopic };
})();
