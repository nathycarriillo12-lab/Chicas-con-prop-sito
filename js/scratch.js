(() => {
  const card=document.querySelector('.verse-scratch'); if(!card)return;
  const cover=card.querySelector('.scratch-layer'),reset=card.querySelector('.scratch-reset');
  const base=cover.getContext('2d');
  let active=false,last=null,revealed=false,particles=[],raf=0,lastSpawn=0;
  let passStart=null,passes=0,travel=0;
  const isTouch=() => window.matchMedia('(pointer: coarse)').matches;
  const brush=() => isTouch() ? 46 : 27;
  const passesNeeded=() => isTouch() ? 2 : 4;
  const passDistance=() => card.clientWidth*(isTouch()?.30:.36);

  const spark=document.createElement('canvas');spark.className='scratch-sparkles';spark.setAttribute('aria-hidden','true');card.appendChild(spark);
  const fx=spark.getContext('2d');

  function setup(){
    const rect=card.getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1);
    [cover,spark].forEach(c=>{c.width=Math.round(rect.width*dpr);c.height=Math.round(rect.height*dpr);c.style.width=rect.width+'px';c.style.height=rect.height+'px';});
    base.setTransform(dpr,0,0,dpr,0,0);fx.setTransform(dpr,0,0,dpr,0,0);paint();
  }
  function star(c,x,y,r,color,alpha=1){
    c.save();c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();
    c.moveTo(x,y-r*2);c.lineTo(x+r*.45,y-r*.45);c.lineTo(x+r*2,y);c.lineTo(x+r*.45,y+r*.45);c.lineTo(x,y+r*2);c.lineTo(x-r*.45,y+r*.45);c.lineTo(x-r*2,y);c.lineTo(x-r*.45,y-r*.45);c.closePath();c.fill();c.restore();
  }
  function paint(){
    const w=card.clientWidth,h=card.clientHeight;base.globalCompositeOperation='source-over';base.clearRect(0,0,w,h);
    const g=base.createLinearGradient(0,0,w,h);g.addColorStop(0,'#674367');g.addColorStop(.52,'#8C6D86');g.addColorStop(1,'#A7AF97');base.fillStyle=g;base.fillRect(0,0,w,h);
    for(let i=0;i<Math.max(24,Math.round(w/25));i++){const x=(i*79.13)%w,y=(i*43.71)%h;star(base,x,y,1.1+(i%3)*.45,'#F8E9D5',.7);}
    card.classList.remove('is-revealed','is-fully-revealed');card.style.setProperty('--scratch-progress','0');revealed=false;particles=[];last=null;passes=0;travel=0;passStart=null;fx.clearRect(0,0,w,h);
  }
  function pos(e){const r=cover.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function burst(x,y,n=10){
    const colors=['#FFF6D5','#F5DCE3','#FFFFFF','#DCC5F0','#E8D9AF'];
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=.3+Math.random()*2;
      particles.push({x:x+(Math.random()-.5)*brush()*.9,y:y+(Math.random()-.5)*brush()*.9,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.35,r:1+Math.random()*2.5,life:25+Math.random()*22,max:47,color:colors[Math.floor(Math.random()*colors.length)]});}
    if(!raf)raf=requestAnimationFrame(animate);
  }
  function reveal(p){
    if(revealed)return;
    const count=last?Math.max(1,Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/8)):1;
    base.save();base.globalCompositeOperation='destination-out';
    for(let i=0;i<=count;i++){
      const t=i/count,x=last?last.x+(p.x-last.x)*t:p.x,y=last?last.y+(p.y-last.y)*t:p.y;
      // Broad, soft brush made of many small particles; no hard circular scratch
      for(let j=0;j<100;j++){const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*brush(),r=.8+Math.random()*3.4;base.beginPath();base.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,r,0,Math.PI*2);base.fill();}
      if(Math.random()>.25)burst(x,y,4);
    }
    base.restore();last=p;
    const now=performance.now();if(now-lastSpawn>45){burst(p.x,p.y,16);lastSpawn=now;}
    if(passStart)travel+=Math.hypot(p.x-passStart.x,p.y-passStart.y);
    const progress=Math.min(0.94,(passes+Math.min(1,travel/passDistance()))/passesNeeded());
    card.style.setProperty('--scratch-progress',String(progress));
    passStart=p;
  }
  function finishPass(){
    if(passStart&&travel>passDistance()){
      passes++;
      const progress=Math.min(0.94,passes/passesNeeded());
      card.style.setProperty('--scratch-progress',String(progress));
      if(passes>=passesNeeded())finishReveal();
    }
    passStart=null;travel=0;last=null;
  }
  function finishReveal(){
    if(revealed)return;
    revealed=true;
    // The remaining coating dissolves in a gentle cloud instead of disappearing instantly.
    const w=card.clientWidth,h=card.clientHeight;
    const image=base.getImageData(0,0,cover.width,cover.height);
    const d=image.data,step=4;
    for(let y=0;y<cover.height;y+=Math.max(8,Math.floor(brush/2))){
      for(let x=0;x<cover.width;x+=Math.max(8,Math.floor(brush/2))){
        const px=Math.min(cover.width-1,x),py=Math.min(cover.height-1,y),idx=(py*cover.width+px)*4;
        if(d[idx+3]>20)burst(x/(cover.width/w),y/(cover.height/h),2);
      }
    }
    card.classList.add('is-revealed');
    card.style.setProperty('--scratch-progress','1');
    let start=null,duration=1500;
    function dissolve(ts){
      if(!start)start=ts;const t=Math.min(1,(ts-start)/duration);
      base.globalCompositeOperation='destination-out';
      // Fade the remaining cover smoothly; the prompt text is hidden separately.
      base.fillStyle='rgba(0,0,0,0.055)';base.fillRect(0,0,w,h);
      if(t<1)requestAnimationFrame(dissolve);else {base.clearRect(0,0,w,h);card.classList.add('is-fully-revealed');}
    }
    requestAnimationFrame(dissolve);
  }
  function animate(){
    const w=card.clientWidth,h=card.clientHeight;fx.clearRect(0,0,w,h);particles=particles.filter(p=>p.life>0);
    for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vx*=.98;p.vy=p.vy*.98+.012;p.life--;star(fx,p.x,p.y,p.r,p.color,Math.min(1,p.life/p.max));}
    if(particles.length)raf=requestAnimationFrame(animate);else raf=0;
  }
  cover.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!revealed){passStart=pos(e);travel=0;last=null;}});
  cover.addEventListener('pointerdown',e=>{if(revealed)return;active=true;passStart=pos(e);travel=0;last=null;cover.setPointerCapture?.(e.pointerId);reveal(pos(e));e.preventDefault();});
  cover.addEventListener('pointermove',e=>{if(revealed)return;if(active||(e.pointerType==='mouse'&&e.buttons===0)){const p=pos(e);if(!passStart)passStart=p;reveal(p);e.preventDefault();}});
  const stop=()=>{if(active)finishPass();active=false;last=null;};
  cover.addEventListener('pointerup',stop);cover.addEventListener('pointercancel',stop);
  cover.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!active)finishPass();else if(e.pointerType==='mouse'&&active)stop();});
  reset.addEventListener('click',paint);
  if('ResizeObserver'in window)new ResizeObserver(setup).observe(card);else window.addEventListener('resize',setup);
  setup();
})();