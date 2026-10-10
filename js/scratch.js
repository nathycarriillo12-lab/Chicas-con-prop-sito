(() => {
  const card = document.querySelector('.verse-scratch');
  if (!card) return;
  const cover = card.querySelector('.scratch-layer');
  const reset = card.querySelector('.scratch-reset');
  const base = cover.getContext('2d');
  const spark = document.createElement('canvas');
  spark.className = 'scratch-sparkles';
  spark.setAttribute('aria-hidden','true');
  card.appendChild(spark);
  const fx = spark.getContext('2d');
  let active = false, last = null, revealed = false, particles = [], raf = 0, lastSpawn = 0;

  function setup() {
    const rect = card.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    [cover, spark].forEach(c => {
      c.width = Math.round(rect.width*dpr);
      c.height = Math.round(rect.height*dpr);
      c.style.width = rect.width+'px';
      c.style.height = rect.height+'px';
    });
    base.setTransform(dpr,0,0,dpr,0,0);
    fx.setTransform(dpr,0,0,dpr,0,0);
    paint();
  }
  function paint() {
    const w=card.clientWidth,h=card.clientHeight;
    base.globalCompositeOperation='source-over';
    base.clearRect(0,0,w,h);
    const g=base.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#674367');g.addColorStop(.52,'#8C6D86');g.addColorStop(1,'#A7AF97');
    base.fillStyle=g;base.fillRect(0,0,w,h);
    // Delicate, sparse stars on the cover
    for(let i=0;i<Math.max(18,Math.round(w/30));i++){
      const x=(i*79.13)%w,y=(i*43.71)%h;
      star(base,x,y,1.1+(i%3)*.45,'#F8E9D5',.6);
    }
    card.classList.remove('is-revealed');
    revealed=false;particles=[];last=null;
    fx.clearRect(0,0,w,h);
  }
  function star(c,x,y,r,color,alpha=1){
    c.save();c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();
    c.moveTo(x,y-r*2);c.lineTo(x+r*.45,y-r*.45);c.lineTo(x+r*2,y);
    c.lineTo(x+r*.45,y+r*.45);c.lineTo(x,y+r*2);c.lineTo(x-r*.45,y+r*.45);
    c.lineTo(x-r*2,y);c.lineTo(x-r*.45,y-r*.45);c.closePath();c.fill();c.restore();
  }
  function pos(e){const r=cover.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function burst(x,y,n=7){
    const colors=['#FFF6D5','#F5DCE3','#FFFFFF','#DCC5F0','#E8D9AF'];
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2,s=.35+Math.random()*1.9;
      particles.push({x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*12,
        vx:Math.cos(a)*s,vy:Math.sin(a)*s-.4,r:1+Math.random()*2.4,
        life:22+Math.random()*20,max:42,color:colors[Math.floor(Math.random()*colors.length)]});
    }
    if(!raf)raf=requestAnimationFrame(animate);
  }
  function reveal(p){
    if(revealed)return;
    base.save();base.globalCompositeOperation='destination-out';
    const count=last?Math.max(1,Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/5)):1;
    for(let i=0;i<=count;i++){
      const t=i/count,x=last?last.x+(p.x-last.x)*t:p.x,y=last?last.y+(p.y-last.y)*t:p.y;
      // Scattered tiny dots create a soft dust-cloud trail rather than a hard erased line
      for(let j=0;j<10;j++){
        const a=Math.random()*Math.PI*2,d=Math.random()*19,r=.8+Math.random()*2.4;
        base.beginPath();base.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,r,0,Math.PI*2);base.fill();
      }
      if(Math.random()>.45)burst(x,y,2);
    }
    base.restore();last=p;
    const now=performance.now();if(now-lastSpawn>65){burst(p.x,p.y,8);lastSpawn=now;}
    progress();
  }
  function progress(){
    if(revealed)return;
    try{
      const d=base.getImageData(0,0,cover.width,cover.height).data;let clear=0;
      for(let i=3;i<d.length;i+=4)if(d[i]<30)clear++;
      if(clear/(d.length/4)>.5){revealed=true;card.classList.add('is-revealed');base.clearRect(0,0,card.clientWidth,card.clientHeight);burst(card.clientWidth/2,card.clientHeight/2,45);}
    }catch(e){}
  }
  function animate(){
    const w=card.clientWidth,h=card.clientHeight;
    fx.clearRect(0,0,w,h);
    particles=particles.filter(p=>p.life>0);
    for(const p of particles){
      p.x+=p.vx;p.y+=p.vy;p.vx*=.98;p.vy=p.vy*.98+.015;p.life--;
      const a=Math.min(1,p.life/p.max);
      star(fx,p.x,p.y,p.r,p.color,a);
    }
    if(particles.length)raf=requestAnimationFrame(animate);else raf=0;
  }
  cover.addEventListener('pointerdown',e=>{active=true;last=null;cover.setPointerCapture?.(e.pointerId);reveal(pos(e));e.preventDefault();});
  cover.addEventListener('pointermove',e=>{if(!revealed&&(active||(e.pointerType==='mouse'&&e.buttons===0))){reveal(pos(e));e.preventDefault();}});
  const stop=()=>{active=false;last=null;};
  cover.addEventListener('pointerup',stop);cover.addEventListener('pointercancel',stop);
  cover.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')stop();});
  reset.addEventListener('click',paint);
  if('ResizeObserver'in window)new ResizeObserver(setup).observe(card);else window.addEventListener('resize',setup);
  setup();
})();