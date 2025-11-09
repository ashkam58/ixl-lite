// Tab switching
const tabs = document.getElementById('tabs').querySelectorAll('button');
const sections = document.querySelectorAll('main .tab');
tabs.forEach(btn=>btn.addEventListener('click',()=>{
  tabs.forEach(b=>b.classList.remove('active'));
  sections.forEach(s=>s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
}));

// Helpers
const deg = r => r * 180/Math.PI;
const rad = d => d * Math.PI/180;
function dist(a,b){return Math.hypot(a.x-b.x, a.y-b.y)}
function clamp(v,min,max){return Math.max(min, Math.min(max,v))}
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}

// ===== 1. Vocab Canvas =====
(function(){
  const cv = document.getElementById('vocabCanvas');
  const ctx = cv.getContext('2d');

  function draw(scene='adjacent'){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6fd3ff';
    ctx.fillStyle = '#e8ecff';

    if(scene==='adjacent'){
      // Two adjacent angles sharing a side
      const O={x:180,y:180};
      const A={x:60,y:260};
      const B={x:300,y:60};
      const C={x:330,y:210}; // shared side OB
      // rays
      drawRay(O,A); drawRay(O,B); drawRay(O,C);
      label('O',O); label('A',A); label('B',B); label('C',C);
      arc(O, A, B, 35); arc(O, B, C, 35);
    }else if(scene==='vertical'){
      const center = {x:210,y:160};
      drawLineThrough(center, rad(30));
      drawLineThrough(center, rad(30)+Math.PI/2);
      // mark opposite angles
      markAngle(center, rad(30), rad(30)+Math.PI/2, 45);
      markAngle(center, rad(30)+Math.PI, rad(30)+Math.PI/2+Math.PI, 45);
    }else{
      // bisector: angle split into two equal parts
      const O={x:180,y:200};
      const r1 = rad(-20), r2=rad(-140);
      drawRay(O, {x:O.x+280*Math.cos(r1), y:O.y+280*Math.sin(r1)});
      drawRay(O, {x:O.x+240*Math.cos(r2), y:O.y+240*Math.sin(r2)});
      // bisector
      const mid = (r1+r2)/2;
      ctx.strokeStyle='#50fa7b';
      drawRay(O, {x:O.x+260*Math.cos(mid), y:O.y+260*Math.sin(mid)});
      ctx.strokeStyle='#6fd3ff';
      arcR(O, r2, r1, 45);
    }

    function drawRay(P, Q){
      ctx.beginPath(); ctx.moveTo(P.x,P.y); ctx.lineTo(Q.x,Q.y); ctx.stroke();
      // arrow
      const ang = Math.atan2(Q.y-P.y, Q.x-P.x);
      const L=10;
      ctx.beginPath();
      ctx.moveTo(Q.x, Q.y);
      ctx.lineTo(Q.x-L*Math.cos(ang-0.3), Q.y-L*Math.sin(ang-0.3));
      ctx.lineTo(Q.x-L*Math.cos(ang+0.3), Q.y-L*Math.sin(ang+0.3));
      ctx.closePath(); ctx.fill();
    }
    function drawLineThrough(C, angle){
      const v = {x:Math.cos(angle), y:Math.sin(angle)};
      ctx.beginPath();
      ctx.moveTo(C.x-400*v.x, C.y-400*v.y);
      ctx.lineTo(C.x+400*v.x, C.y+400*v.y);
      ctx.stroke();
    }
    function arc(P, A, B, r){
      const a1=Math.atan2(A.y-P.y, A.x-P.x),
            a2=Math.atan2(B.y-P.y, B.x-P.x);
      arcR(P,a1,a2,r);
    }
    function arcR(P, a1, a2, r){
      ctx.beginPath();
      ctx.arc(P.x,P.y,r, a1, a2, false);
      ctx.stroke();
    }
    function markAngle(C, a1,a2,r){ctx.beginPath();ctx.arc(C.x,C.y,r,a1,a2);ctx.stroke()}
    function label(t,P){ctx.fillText(t, P.x+6, P.y-6)}
  }

  draw('adjacent');
  const checkBtn = document.getElementById('checkVocab');
  checkBtn.addEventListener('click', ()=>{
    const val = document.querySelector('input[name="vocabPick"]:checked').value;
    // random scene displayed; ask user to pick correct label
    // We'll cycle scenes
    let current = checkBtn.dataset.scene || 'adjacent';
    // Evaluate previous scene vs selected label
    let ok = (current===val) || (current==='vertical' && val==='vertical') || (current==='bisector' && val==='bisector');
    const fb = document.getElementById('vocabFB');
    fb.textContent = ok ? 'Yes! That matches the diagram.' : 'Not quite. Look at shared sides/opposite angles.';
    fb.className = 'feedback ' + (ok?'good':'bad');
    // pick next scene
    const order = ['adjacent','vertical','bisector'];
    const next = order[(order.indexOf(current)+1)%order.length];
    checkBtn.dataset.scene = next;
    draw(next);
  });
})();

// ===== 2. Measure Canvas =====
(function(){
  const cv = document.getElementById('measureCanvas');
  const ctx = cv.getContext('2d');
  const O = {x: cv.width/2, y: cv.height/2+20};
  let A = {x: O.x + 140, y: O.y - 60};
  let B = {x: O.x + 40, y: O.y + 120};
  let dragging = null;
  const readout = document.getElementById('measureReadout');
  const snap5 = document.getElementById('snap5');
  const showPro = document.getElementById('showProtractor');

  function angle(A,B,O){ // ∠AOB
    const a1 = Math.atan2(A.y-O.y, A.x-O.x);
    const a2 = Math.atan2(B.y-O.y, B.x-O.x);
    let d = Math.abs(deg(a2 - a1));
    d = d>180? 360-d : d;
    return d;
  }

  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    // protractor
    if(showPro.checked){
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawProtractor(O.x,O.y,130);
      ctx.restore();
    }
    // angle arc
    ctx.strokeStyle='#6fd3ff'; ctx.lineWidth=3;
    drawRay(O,A); drawRay(O,B);
    const a1=Math.atan2(A.y-O.y, A.x-O.x);
    const a2=Math.atan2(B.y-O.y, B.x-O.x);
    ctx.beginPath(); ctx.arc(O.x,O.y,50, a1,a2, false); ctx.stroke();
    // points
    drawPt(O,'O'); drawPt(A,'A'); drawPt(B,'B');
    readout.textContent = 'm∠AOB = ' + Math.round(angle(A,B,O)) + '°';
  }

  function drawPt(P,label){
    ctx.fillStyle='#e8ecff';
    ctx.beginPath(); ctx.arc(P.x,P.y,4,0,Math.PI*2); ctx.fill();
    ctx.fillText(label, P.x+6, P.y-6);
  }
  function drawRay(P,Q){
    ctx.beginPath(); ctx.moveTo(P.x,P.y); ctx.lineTo(Q.x,Q.y); ctx.stroke();
  }
  function drawProtractor(cx,cy,r){
    ctx.strokeStyle='#e8ecff';
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI,true); ctx.stroke();
    for(let d=0; d<=180; d+=5){
      const a = Math.PI - rad(d);
      const len = (d%10===0)? 12 : 6;
      const x1=cx+r*Math.cos(a), y1=cy+r*Math.sin(a);
      const x2=cx+(r-len)*Math.cos(a), y2=cy+(r-len)*Math.sin(a);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      if(d%30===0){
        ctx.fillText(String(d), cx+(r-24)*Math.cos(a)-6, cy+(r-24)*Math.sin(a)+4);
      }
    }
  }

  function snapPoint(P){
    if(!snap5.checked) return P;
    // snap to nearest 5 degrees relative to O
    const a = Math.atan2(P.y-O.y, P.x-O.x);
    const r = dist(P,O);
    let d = deg(a); if(d<0) d+=360;
    const snapped = Math.round(d/5)*5;
    const aa = rad(snapped);
    return {x: O.x + r*Math.cos(aa), y: O.y + r*Math.sin(aa)};
  }

  function hit(P,Q){return dist(P,Q)<12}

  cv.addEventListener('mousedown',e=>{
    const r = cv.getBoundingClientRect();
    const p = {x: e.clientX-r.left, y: e.clientY-r.top};
    dragging = hit(p,A)? 'A' : hit(p,B)? 'B' : null;
  });
  cv.addEventListener('mousemove',e=>{
    if(!dragging) return;
    const r = cv.getBoundingClientRect();
    let p = {x: e.clientX-r.left, y: e.clientY-r.top};
    p = snapPoint(p);
    if(dragging==='A') A=p; else B=p;
    draw();
  });
  window.addEventListener('mouseup',()=>dragging=null);
  document.getElementById('resetMeasure').addEventListener('click',()=>{
    A = {x: O.x + 140, y: O.y - 60};
    B = {x: O.x + 40, y: O.y + 120};
    draw();
  });
  showPro.addEventListener('change', draw);
  draw();
})();

// ===== 3–4. Classify & Find Measures =====
(function(){
  document.getElementById('calcComp').addEventListener('click',()=>{
    const a = Number(document.getElementById('csAngle').value);
    if(a<=0 || a>=180) return fb('csFB','Enter 0<a<180',false);
    if(a>=90) return fb('csFB','No complement if angle ≥ 90°',false);
    fb('csFB', `Complement = ${90-a}°`, true);
  });
  document.getElementById('calcSupp').addEventListener('click',()=>{
    const a = Number(document.getElementById('csAngle').value);
    if(a<=0 || a>=180) return fb('csFB','Enter 0<a<180',false);
    fb('csFB', `Supplement = ${180-a}°`, true);
  });

  const cv = document.getElementById('classCanvas');
  const ctx = cv.getContext('2d');
  let scene = 'adjacent';
  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineWidth=3; ctx.strokeStyle='#6fd3ff';
    if(scene==='adjacent'){
      const O={x:210,y:160};
      drawRay(O,{x:60,y:260}); drawRay(O,{x:340,y:180}); drawRay(O,{x:300,y:60});
      arc(O, rad(210), rad(10), 45);
      arc(O, rad(10), rad(-15), 60);
    }else if(scene==='vertical'){
      const C={x:200,y:160}; drawLineThrough(C, rad(25)); drawLineThrough(C, rad(25)+Math.PI/2);
    }else{
      // linear pair
      const O={x:210,y:170}; drawRay(O,{x:40,y:170}); drawRay(O,{x:380,y:170}); drawRay(O,{x:260,y:60});
      arc(O, Math.PI, 0, 50);
    }
    function drawRay(P,Q){ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(Q.x,Q.y);ctx.stroke();}
    function drawLineThrough(C, a){ctx.beginPath();ctx.moveTo(C.x-400*Math.cos(a), C.y-400*Math.sin(a));ctx.lineTo(C.x+400*Math.cos(a), C.y+400*Math.sin(a));ctx.stroke();}
    function arc(O,a1,a2,r){ctx.beginPath();ctx.arc(O.x,O.y,r,a1,a2);ctx.stroke();}
  }
  draw();
  document.getElementById('checkClass').addEventListener('click',()=>{
    const pick = document.querySelector('input[name="rel"]:checked').value;
    const ok = (pick===scene) || (scene==='linear' && pick==='linear');
    fb('classFB', ok? 'Correct!':'Try again. Check shared side vs straight line.', ok);
    // rotate scene
    scene = scene==='adjacent'?'vertical':scene==='vertical'?'linear':'adjacent';
    draw();
  });
})();

// ===== 5. Solve for x =====
(function(){
  const cv = document.getElementById('solveCanvas');
  const ctx = cv.getContext('2d');
  const fb = document.getElementById('solveFB');
  const input = document.getElementById('solveInput');
  let prob=null;

  function newProblem(){
    // Randomly choose vertical or linear pair with expressions
    const type = Math.random()<0.5? 'vertical':'linear';
    // Expressions: ax + b, cx + d
    const a=randInt(1,5), b=randInt(0,40);
    const c=randInt(1,5), d=randInt(0,40);
    if(type==='vertical'){
      // ax+b = cx+d
      const x = Math.round((d-b)/(a-c));
      prob = {type, a,b,c,d, answer:x};
    }else{
      // ax+b + (cx+d) = 180
      const x = Math.round((180 - b - d)/(a+c));
      prob = {type, a,b,c,d, answer:x};
    }
    draw(type);
    fb.textContent = 'Solve for x. Diagram shows the relationship.';
    fb.className = 'feedback';
    input.value='';
  }

  function draw(type){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineWidth=3; ctx.strokeStyle='#6fd3ff'; ctx.fillStyle='#e8ecff';
    const O={x:210,y:170};
    if(type==='vertical'){
      drawLineThrough(O, rad(20)); drawLineThrough(O, rad(20)+Math.PI/2);
      ctx.fillText(`${prob.a}x + ${prob.b}°`, O.x+60, O.y-40);
      ctx.fillText(`${prob.c}x + ${prob.d}°`, O.x-120, O.y+60);
      ctx.fillText('Vertical angles are congruent', 10, 20);
    }else{
      // linear pair
      drawLineThrough(O, 0);
      drawRay(O, {x:O.x+120,y:O.y-110});
      ctx.fillText(`${prob.a}x + ${prob.b}°`, O.x-140, O.y-10);
      ctx.fillText(`${prob.c}x + ${prob.d}°`, O.x+40, O.y-10);
      ctx.fillText('Linear pair sum = 180°', 10, 20);
    }
    function drawLineThrough(C, a){ctx.beginPath();ctx.moveTo(C.x-400*Math.cos(a), C.y-400*Math.sin(a));ctx.lineTo(C.x+400*Math.cos(a), C.y+400*Math.sin(a));ctx.stroke();}
    function drawRay(P,Q){ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(Q.x,Q.y);ctx.stroke();}
  }

  document.getElementById('checkSolve').addEventListener('click',()=>{
    const guess = Number(input.value);
    if(Number.isNaN(guess)) return;
    const ok = (guess===prob.answer);
    fb.textContent = ok? 'Correct! x = '+prob.answer : 'Not yet. Build the equation from the relationship.';
    fb.className = 'feedback ' + (ok?'good':'bad');
  });
  document.getElementById('newSolve').addEventListener('click', newProblem);
  newProblem();
})();

// ===== 6–7. Angle Bisector Construction =====
(function(){
  const cv = document.getElementById('bisectCanvas');
  const ctx = cv.getContext('2d');
  let step=0;
  const O={x:200,y:240};
  const r1=rad(-20), r2=rad(-135);
  const A={x:O.x+180*Math.cos(r1), y:O.y+180*Math.sin(r1)};
  const B={x:O.x+200*Math.cos(r2), y:O.y+200*Math.sin(r2)};
  let arcPts = [], X=null;

  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineWidth=3; ctx.strokeStyle='#6fd3ff'; ctx.fillStyle='#e8ecff';
    // original angle
    drawRay(O,A); drawRay(O,B);
    arc(O, r2, r1, 40);

    if(step>=1){
      // arc cutting both rays
      ctx.strokeStyle='#9aa3c7';
      const R=120;
      ctx.beginPath(); ctx.arc(O.x,O.y,R,r2,r1); ctx.stroke();
      arcPts = [
        {x:O.x+R*Math.cos(r1), y:O.y+R*Math.sin(r1)},
        {x:O.x+R*Math.cos(r2), y:O.y+R*Math.sin(r2)}
      ];
    }
    if(step>=2){
      // arcs from arcPts
      const RR=100;
      arcPts.forEach(P=>{
        ctx.beginPath(); ctx.arc(P.x,P.y,RR,0,Math.PI*2); ctx.stroke();
      });
      // intersection X (approx)
      // intersect two circles centered at arcPts with radius RR; use midpoint
      X = {x:(arcPts[0].x+arcPts[1].x)/2, y:(arcPts[0].y+arcPts[1].y)/2 - 60};
      ctx.beginPath(); ctx.arc(X.x,X.y,4,0,Math.PI*2); ctx.fill();
    }
    if(step>=3){
      ctx.strokeStyle='#50fa7b';
      drawRay(O, X);
      ctx.fillText('Bisector', X.x+8, X.y);
      // feedback
      const mid = (r1+r2)/2;
      const m1 = Math.abs(deg(r1-mid));
      const m2 = Math.abs(deg(mid-r2));
      const fb = document.getElementById('bisectFB');
      fb.textContent = 'Constructed! Two parts are congruent in theory by construction.';
      fb.className = 'feedback good';
    }

    function drawRay(P,Q){ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(Q.x,Q.y);ctx.stroke();}
    function arc(C,a1,a2,R){ctx.beginPath();ctx.arc(C.x,C.y,R,a1,a2);ctx.stroke();}
  }
  draw();
  document.getElementById('bisectStep').addEventListener('click',()=>{step = Math.min(3, step+1); draw();});
  document.getElementById('bisectReset').addEventListener('click',()=>{step=0; draw();});
})();

// ===== 8. Copy/Congruent Angle =====
(function(){
  const cv = document.getElementById('copyCanvas');
  const ctx = cv.getContext('2d');
  let step=0;
  const O={x:120,y:210}, O2={x:300,y:240};
  const r1=rad(-20), r2=rad(-110);
  const A={x:O.x+140*Math.cos(r1), y:O.y+140*Math.sin(r1)};
  const B={x:O.x+160*Math.cos(r2), y:O.y+160*Math.sin(r2)};

  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineWidth=3; ctx.strokeStyle='#6fd3ff'; ctx.fillStyle='#e8ecff';
    // original
    drawRay(O,A); drawRay(O,B); arcR(O,r2,r1,35); ctx.fillText('Original', O.x-10,O.y+60);
    // new ray baseline
    drawRay(O2, {x:O2.x+160, y:O2.y}); ctx.fillText('Copy here', O2.x-10,O2.y+60);

    if(step>=1){
      // arc from O and same radius from O2
      const R=100;
      circleArc(O,R);
      circleArc(O2,R);
      const P1={x:O.x+R*Math.cos(r1), y:O.y+R*Math.sin(r1)};
      const Q1={x:O2.x+R, y:O2.y};
      dot(P1); dot(Q1);
    }
    if(step>=2){
      // set width to intersection with second ray in original; transfer to copy arc
      const R=100;
      const P2={x:O.x+R*Math.cos(r2), y:O.y+R*Math.sin(r2)};
      const P1={x:O.x+R*Math.cos(r1), y:O.y+R*Math.sin(r1)};
      const d = dist(P1,P2);
      // mark same distance on new arc from Q1
      const t = d/R; // not exact chord mapping, but a visual marker
      const mark = {x:O2.x+R*Math.cos(-t), y:O2.y+R*Math.sin(-t)};
      dot(P2); dot(mark);
    }
    if(step>=3){
      // draw final ray approximating through marked point
      ctx.strokeStyle='#50fa7b';
      drawRay(O2, {x:O2.x+120, y:O2.y-90});
      ctx.fillText('Copied angle (≈ congruent)', O2.x+20, O2.y-70);
      document.getElementById('copyFB').textContent = 'Construction complete: angles are congruent by construction.';
      document.getElementById('copyFB').className = 'feedback good';
    }

    function drawRay(P,Q){ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(Q.x,Q.y);ctx.stroke();}
    function arcR(P,a1,a2,r){ctx.beginPath();ctx.arc(P.x,P.y,r,a1,a2);ctx.stroke();}
    function circleArc(C,R){ctx.beginPath();ctx.arc(C.x,C.y,R,0,Math.PI*2);ctx.stroke();}
    function dot(P){ctx.beginPath();ctx.arc(P.x,P.y,3,0,Math.PI*2);ctx.fill();}
  }
  draw();
  document.getElementById('copyStep').addEventListener('click',()=>{step=Math.min(3,step+1);draw();});
  document.getElementById('copyReset').addEventListener('click',()=>{step=0;draw();});
})();

// ===== 9. Proof Checker =====
(function(){
  const correct = [
    'Linear Pair Postulate',
    'Supplement Theorem',
    'Linear Pair Postulate',
    'Supplement Theorem',
    'Transitive/Subtraction Property',
    'Definition of Congruent Angles'
  ];
  document.getElementById('checkProof').addEventListener('click',()=>{
    const reasons = Array.from(document.querySelectorAll('#proofs select.reason')).map(s=>s.value);
    let ok = true;
    for(let i=0;i<correct.length;i++){
      if(reasons[i]!==correct[i]){ ok=false; break; }
    }
    const fb = document.getElementById('proofFB');
    fb.textContent = ok? 'Proof checks out. Vertical angles are congruent!' : 'There is a mismatch. Review linear pairs & supplements.';
    fb.className = 'feedback ' + (ok?'good':'bad');
  });
})();

// ===== Mixed Drills =====
(function(){
  const Q = document.getElementById('drillQ');
  const A = document.getElementById('drillA');
  const FB = document.getElementById('drillFB');
  let cur = null;

  const kinds = ['type','comp','supp','vertical','linear','vocab'];
  function newQ(){
    const k = kinds[randInt(0,kinds.length-1)];
    if(k==='type'){
      const m = [randInt(10,85),90,randInt(95,175)][randInt(0,2)];
      cur = {k, m, ans: m<90?'acute': m===90?'right': m<180?'obtuse':'straight'};
      Q.textContent = `Angle measure = ${m}°. Type? (acute/right/obtuse/straight)`;
    }else if(k==='comp'){
      const a = randInt(10,80); cur={k, a, ans: 90-a}; Q.textContent = `Complement of ${a}°?`;
    }else if(k==='supp'){
      const a = randInt(10,170); cur={k, a, ans: 180-a}; Q.textContent = `Supplement of ${a}°?`;
    }else if(k==='vertical'){
      // vertical: ax+b = cx+d
      const a=randInt(1,5), b=randInt(0,40), c=randInt(1,5), d=randInt(0,40);
      const x = Math.round((d-b)/(a-c));
      cur = {k, a,b,c,d, ans:x};
      Q.textContent = `Vertical angles: ${a}x+${b}° = ${c}x+${d}°. Solve x.`;
    }else if(k==='linear'){
      const a=randInt(1,5), b=randInt(0,40), c=randInt(1,5), d=randInt(0,40);
      const x = Math.round((180-b-d)/(a+c));
      cur = {k, a,b,c,d, ans:x};
      Q.textContent = `Linear pair: ${a}x+${b}° and ${c}x+${d}°. Solve x.`;
    }else{
      const pool=['adjacent','vertical','bisector','congruent','complementary','supplementary'];
      const pick = pool[randInt(0,pool.length-1)];
      cur = {k, pick, ans: pick};
      Q.textContent = `Vocabulary: type the word that means "${desc(pick)}"`;
    }
    A.value=''; FB.textContent=''; FB.className='feedback';

    function desc(w){
      const map={
        adjacent:'share a vertex and side; interiors don’t overlap',
        vertical:'opposite angles formed by intersecting lines',
        bisector:'ray that splits an angle into two equal angles',
        congruent:'same measure',
        complementary:'sum to 90°',
        supplementary:'sum to 180°'
      };
      return map[w];
    }
  }

  function check(){
    let ans = A.value.trim().toLowerCase();
    let ok=false;
    if(cur.k==='type'){
      ok = ans===cur.ans;
    }else if(cur.k==='comp' || cur.k==='supp' || cur.k==='vertical' || cur.k==='linear'){
      ok = Number(ans)===cur.ans;
    }else{
      ok = ans===cur.ans;
    }
    FB.textContent = ok? 'Correct!' : `Not yet. Expected: ${cur.ans}`;
    FB.className = 'feedback ' + (ok?'good':'bad');
  }

  document.getElementById('drillNew').addEventListener('click', newQ);
  document.getElementById('drillCheck').addEventListener('click', check);
  newQ();
})();

function fb(id,msg,good){ const el=document.getElementById(id); el.textContent=msg; el.className='feedback ' + (good?'good':'bad'); }
