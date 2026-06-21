(function () {
  const BG = '#2d5a27';
  let canvas, ctx, buffer, bufCtx;
  let drawing = false;
  let tool = 'chalk';
  let color = 'white';
  let lineWidth = 4;
  let lastX, lastY;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    canvas.style.touchAction = 'none';

    buffer = document.createElement('canvas');
    bufCtx = buffer.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
    const h = canvas.clientHeight || 300;
    if (w === 0 || h === 0) return;

    const temp = document.createElement('canvas');
    temp.width = buffer.width || 1;
    temp.height = buffer.height || 1;
    temp.getContext('2d').drawImage(buffer, 0, 0);

    canvas.width = w;
    canvas.height = h;
    buffer.width = w;
    buffer.height = h;

    bufCtx.fillStyle = BG;
    bufCtx.fillRect(0, 0, w, h);
    if (temp.width > 1 && temp.height > 1) bufCtx.drawImage(temp, 0, 0);

    ctx.drawImage(buffer, 0, 0);
  }

  function onDown(e) {
    e.preventDefault();
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const x = e.offsetX;
    const y = e.offsetY;

    if (tool === 'eraser') {
      bufCtx.save();
      bufCtx.beginPath();
      bufCtx.arc(x, y, 20, 0, Math.PI * 2);
      bufCtx.fillStyle = BG;
      bufCtx.fill();
      bufCtx.restore();
    } else {
      drawChalkLine(lastX, lastY, x, y);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(buffer, 0, 0);
    lastX = x;
    lastY = y;
  }

  function onUp(e) {
    drawing = false;
  }

  function drawChalkLine(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(Math.floor(dist), 1);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t + (Math.random() * 2 - 1);
      const y = y0 + (y1 - y0) * t + (Math.random() * 2 - 1);
      const alpha = 0.5 + Math.random() * 0.5;

      bufCtx.save();
      bufCtx.globalAlpha = alpha;
      bufCtx.fillStyle = color;
      bufCtx.beginPath();
      bufCtx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
      bufCtx.fill();
      bufCtx.restore();
    }
  }

  function setTool(t) {
    tool = t;
  }

  function setColor(c) {
    color = c;
  }

  function clear(animated) {
    if (!animated) {
      bufCtx.fillStyle = BG;
      bufCtx.fillRect(0, 0, buffer.width, buffer.height);
      ctx.drawImage(buffer, 0, 0);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const duration = 500;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const x = progress * w;

      ctx.drawImage(buffer, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, x, h);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        bufCtx.fillStyle = BG;
        bufCtx.fillRect(0, 0, w, h);
        ctx.drawImage(buffer, 0, 0);
      }
    }

    requestAnimationFrame(frame);
  }

  window.Tafel = { init, setTool, setColor, clear, resize, setLineWidth: (w) => { lineWidth = w; } };
})();
