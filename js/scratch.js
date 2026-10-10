(() => {
  const card = document.querySelector('.verse-scratch');
  if (!card) return;
  const canvas = card.querySelector('.scratch-layer');
  const reset = card.querySelector('.scratch-reset');
  const ctx = canvas.getContext('2d');
  let scratching = false;
  let last = null;
  let revealed = false;
  const radius = 24;

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
    grad.addColorStop(0, '#6C3F61');
    grad.addColorStop(.52, '#8C6D86');
    grad.addColorStop(1, '#A7AF97');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Soft botanical accents on the scratch coating
    ctx.globalAlpha = .18;
    ctx.strokeStyle = '#FFF8F1';
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const x = w * (.1 + i * .13);
      ctx.beginPath();
      ctx.ellipse(x, h * (.22 + (i % 3) * .22), 18, 7, -.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    card.classList.remove('is-revealed');
    revealed = false;
  }

  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function erase(point) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = radius * 2;
    ctx.beginPath();
    if (last) {
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
    } else {
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + .1, point.y + .1);
    }
    ctx.stroke();
    last = point;
    checkProgress();
  }

  function checkProgress() {
    if (revealed) return;
    try {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      const total = pixels.length / 4;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < 30) clear++;
      if (clear / total > .43) {
        revealed = true;
        card.classList.add('is-revealed');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch (_) {}
  }

  canvas.addEventListener('pointerdown', e => {
    scratching = true;
    last = null;
    canvas.setPointerCapture?.(e.pointerId);
    erase(pointFromEvent(e));
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (scratching) {
      erase(pointFromEvent(e));
      e.preventDefault();
    }
  });
  const stop = () => { scratching = false; last = null; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') stop(); });
  // Mouse hover scratches as requested; touch and pen also work.
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && e.buttons === 0 && !revealed) erase(pointFromEvent(e));
  });
  reset.addEventListener('click', () => {
    const rect = card.getBoundingClientRect();
    paintCover(rect.width, rect.height);
    last = null;
  });
  if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(card);
  else window.addEventListener('resize', sizeCanvas);
  sizeCanvas();
})();