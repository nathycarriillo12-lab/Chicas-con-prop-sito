(() => {
  const card = document.querySelector('.verse-scratch');
  if (!card) return;
  const canvas = card.querySelector('.scratch-layer');
  const reset = card.querySelector('.scratch-reset');
  const ctx = canvas.getContext('2d');
  let scratching = false, last = null, revealed = false;
  let particles = [], raf = 0, lastTrailAt = 0;

  function sizeCanvas() {
    const rect = card.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintCover(rect.width, rect.height);
  }
  function paintCover(w, h) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#5C3A63');
    grad.addColorStop(.5, '#806482');
    grad.addColorStop(1, '#A7AF97');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Subtle stardust and botanical details on the cover
    ctx.globalAlpha = .5;
    for (let i = 0; i < Math.max(24, Math.round(w / 12)); i++) {
      const x = (i * 67.17) % w, y = (i * 37.71) % h;
      drawStar(x, y, 1.2 + (i % 3) * .45, '#F9E8F3', .75);
    }
    ctx.globalAlpha = 1;
    card.classList.remove('is-revealed');
    revealed = false;
    particles = [];
    last = null;
  }
  function drawStar(x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y-r*1.8); ctx.lineTo(x+r*.35, y-r*.35);
    ctx.lineTo(x+r*1.8, y); ctx.lineTo(x+r*.35, y+r*.35);
    ctx.lineTo(x, y+r*1.8); ctx.lineTo(x-r*.35, y+r*.35);
    ctx.lineTo(x-r*1.8, y); ctx.lineTo(x-r*.35, y-r*.35);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function point(e) {
    const rect = canvas.getBoundingClientRect();
    return {x:e.clientX-rect.left,y:e.clientY-rect.top};
  }
  function spawn(x,y,amount=8) {
    const colors=['#FFF7D6','#F5DCE3','#FFFFFF','#D9C4E8','#E8D9AF'];
    for(let i=0;i<amount;i++){
      const angle=Math.random()*Math.PI*2, speed=.45+Math.random()*2.2;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-.35,
        r:1.1+Math.random()*2.5,life:24+Math.random()*26,max:50,
        color:colors[Math.floor(Math.random()*colors.length)]});
    }
    if(!raf) raf=requestAnimationFrame(animate);
  }
  function revealAlong(p) {
    // Small, separate circles create a dissolving, Thanos-like dust trail rather than a solid scratch.
    ctx.save();
    ctx.globalCompositeOperation='destination-out';
    const points = last ? Math.max(1,Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/7)) : 1;
    for(let i=0;i<=points;i++){
      const t=points===0?1:i/points;
      const x=last?last.x+(p.x-last.x)*t:p.x;
      const y=last?last.y+(p.y-last.y)*t:p.y;
      for(let j=0;j<3;j++){
        const a=Math.random()*Math.PI*2, d=Math.random()*11;
        ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,2+Math.random()*5,0,Math.PI*2);ctx.fill();
      }
      if(Math.random()>.28) spawn(x,y,2);
    }
    ctx.restore();
    last=p;
    if(performance.now()-lastTrailAt>45){spawn(p.x,p.y,5);lastTrailAt=performance.now();}
    checkProgress();
  }
  function checkProgress() {
    if(revealed) return;
    try{
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let clear=0;for(let i=3;i<data.length;i+=4) if(data[i]<30) clear++;
      if(clear/(data.length/4)>.48){
        revealed=true;card.classList.add('is-revealed');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        spawn(card.clientWidth*.5,card.clientHeight*.5,55);
      }
    }catch(_){}
  }
  function animate(){
    ctx.save();
    ctx.globalCompositeOperation='source-over';
    particles=particles.filter(p=>p.life>0);
    for(const p of particles){
      p.x+=p.vx;p.y+=p.vy;p.vx*=.985;p.vy=p.vy*.985+.012;p.life--;
      const alpha=Math.max(0,p.life/p.max);
      drawStar(p.x,p.y,p.r,p.color,alpha);
    }
    ctx.restore();
    if(particles.length) raf=requestAnimationFrame(animate); else raf=0;
  }
  canvas.addEventListener('pointerdown',e=>{scratching=true;last=null;canvas.setPointerCapture?.(e.pointerId);revealAlong(point(e));e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{
    if(revealed)return;
    if(scratching || (e.pointerType==='mouse' && e.buttons===0)){revealAlong(point(e));e.preventDefault();}
  });
  const stop=()=>{scratching=false;last=null;};
  canvas.addEventListener('pointerup',stop);
  canvas.addEventListener('pointercancel',stop);
  canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')stop();});
  reset.addEventListener('click',()=>paintCover(card.clientWidth,card.clientHeight));
  if('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(card);
  else window.addEventListener('resize',sizeCanvas);
  sizeCanvas();
})();