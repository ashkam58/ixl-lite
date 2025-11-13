// Lightweight DOM confetti helper — creates colorful falling pieces and removes them
(function(){
  // Kid-friendly confetti: emojis, strips, sparkles, gentle physics and cleanup
  const EMOJIS = ['🎉','✨','🔹','🔸','⭐','🎈','�','�','🍩','🌈','🦄','🧸','🎀'];
  const PASTEL = ['#FFB3D9','#B3ECFF','#FFF1B3','#C8FFEC','#E6CCFF','#FFD8A8','#FFDFE6','#D9F0FF'];

  // inject minimal styles for confetti pieces
  const style = document.createElement('style');
  style.textContent = `
    .confetti-piece{ position:fixed; pointer-events:none; z-index:2147483646; will-change: transform, opacity; display:inline-flex; align-items:center; justify-content:center; }
    .confetti-strip{ width:10px; height:18px; border-radius:3px; box-shadow:0 2px 6px rgba(0,0,0,0.08); }
    @keyframes confetti-fall { to { transform: translate3d(var(--tx,0), var(--ty,300px), 0) rotate(var(--rot,0deg)); opacity:0 } }
  `;
  document.head.appendChild(style);

  function makeEmojiPiece(x,y,color,size,delay,duration){
    const el = document.createElement('div'); el.className='confetti-piece';
    el.textContent = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.fontSize = size + 'px'; el.style.opacity = 1; el.style.transformOrigin = 'center';
    el.style.transition = `opacity ${duration}ms linear ${delay}ms`;
    el.style.transform = `translate3d(0,0,0) rotate(${Math.random()*360}deg)`;
    el.style.setProperty('--tx', (Math.random()*2-1)*(80+Math.random()*220)+'px');
    el.style.setProperty('--ty', (160+Math.random()*420)+'px');
    el.style.setProperty('--rot', (Math.random()*720-360)+'deg');
    el.style.animation = `confetti-fall ${duration}ms cubic-bezier(.2,.9,.2,1) ${delay}ms forwards`;
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), duration + delay + 80);
    return el;
  }

  function makeStripPiece(x,y,color,width,height,delay,duration,rot){
    const el = document.createElement('div'); el.className='confetti-piece';
    const strip = document.createElement('div'); strip.className='confetti-strip';
    strip.style.width = width + 'px'; strip.style.height = height + 'px';
    strip.style.background = color; strip.style.transform = `rotate(${Math.random()*360}deg)`;
    el.appendChild(strip);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.setProperty('--tx', (Math.random()*2-1)*(100+Math.random()*260)+'px');
    el.style.setProperty('--ty', (180+Math.random()*460)+'px');
    el.style.setProperty('--rot', (rot || (Math.random()*720-360))+'deg');
    el.style.animation = `confetti-fall ${duration}ms cubic-bezier(.2,.9,.2,1) ${delay}ms forwards`;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), duration + delay + 80);
    return el;
  }

  function spawnConfettiAt(x,y,count=36,opts={}){
    const pieces = [];
    for(let i=0;i<count;i++){
      const delay = Math.floor(Math.random()*250);
      const duration = 900 + Math.floor(Math.random()*1600);
      const color = PASTEL[i % PASTEL.length];
      const size = 18 + Math.floor(Math.random()*30);
      // choose type: emoji (60%), strip (30%), sparkle dot (10%)
      const r = Math.random();
      if(r < 0.6){ pieces.push(makeEmojiPiece(x + (Math.random()*60-30), y + (Math.random()*30-15), color, size, delay, duration)); }
      else if(r < 0.9){ pieces.push(makeStripPiece(x + (Math.random()*70-35), y + (Math.random()*20-10), color, 8 + Math.floor(Math.random()*8), 14 + Math.floor(Math.random()*20), delay, duration)); }
      else { pieces.push(makeEmojiPiece(x + (Math.random()*60-30), y + (Math.random()*20-10), color, 12 + Math.floor(Math.random()*10), delay, duration)); }
    }
    return pieces;
  }

  // Public API: spawnConfetti(targetOrX, maybeY, maybeCount)
  window.spawnConfetti = function(targetOrX, maybeY, maybeCount){
    if(typeof targetOrX === 'number'){
      spawnConfettiAt(targetOrX, maybeY||120, maybeCount||36);
      return;
    }
    const el = targetOrX instanceof Event ? targetOrX.target : targetOrX;
    if(el && el.getBoundingClientRect){
      const r = el.getBoundingClientRect();
      spawnConfettiAt(Math.round(r.left + r.width/2), Math.round(r.top + r.height/2), maybeY||28);
      return;
    }
    spawnConfettiAt(window.innerWidth/2, window.innerHeight/4, maybeCount||48);
  };

  // full-screen celebration
  window.celebrate = function(count=96){
    spawnConfettiAt(window.innerWidth/2, window.innerHeight/4, count);
  };

  // click-to-celebrate for elements marked with data-confetti
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-confetti]');
    if(btn) {
      try{ window.spawnConfetti(btn); }catch(_){/* noop */}
    }
  });
})();
