
// /engine/ui.js
window.IxlUI = {
  toast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 1400);
  },
  confetti(topicId){
    // Use cartoon-themed confetti for multiplication topic
    let symbols = ['🎉','✨','🎈','⭐','💥'];
    if(topicId === 'multiplication'){
      symbols = ['🎉','🎊','🌟','🦸‍♀️','🦸‍♂️','🎭','🎪','🦄','🎈','⭐'];
    }
    
    for(let i=0;i<36;i++){
      const s = document.createElement('div');
      s.className = 'confetti';
      s.textContent = symbols[Math.floor(Math.random()*symbols.length)];
      s.style.left = Math.random()*100 + 'vw';
      s.style.animationDuration = (1 + Math.random()*1.8) + 's';
      document.body.appendChild(s);
      setTimeout(()=> s.remove(), 2600);
    }
  }
};
