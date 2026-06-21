(function () {
  const BG_R = 45, BG_G = 90, BG_B = 39;
  let templates = null;

  function isBg(r, g, b) {
    return Math.abs(r - BG_R) < 45 && Math.abs(g - BG_G) < 45 && Math.abs(b - BG_B) < 45;
  }

  function getBounds(data, w, h) {
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (!isBg(data[i], data[i + 1], data[i + 2])) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    if (!found) return null;
    return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function toBinary28(data, fullW, bounds) {
    const grid = new Uint8Array(28 * 28);
    const S = 22;
    const scale = Math.min(S / bounds.w, S / bounds.h);
    const dw = Math.round(bounds.w * scale);
    const dh = Math.round(bounds.h * scale);
    const ox = Math.floor((28 - dw) / 2);
    const oy = Math.floor((28 - dh) / 2);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const sx = Math.floor(bounds.minX + x / scale);
        const sy = Math.floor(bounds.minY + y / scale);
        const i = (sy * fullW + sx) * 4;
        if (!isBg(data[i], data[i + 1], data[i + 2])) {
          grid[(oy + y) * 28 + (ox + x)] = 1;
        }
      }
    }
    return dilate(grid);
  }

  function dilate(grid) {
    // Slight dilation to thicken thin strokes
    const out = new Uint8Array(784);
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        if (grid[y * 28 + x]) {
          out[y * 28 + x] = 1;
          if (x > 0) out[y * 28 + x - 1] = 1;
          if (x < 27) out[y * 28 + x + 1] = 1;
          if (y > 0) out[(y - 1) * 28 + x] = 1;
          if (y < 27) out[(y + 1) * 28 + x] = 1;
        }
      }
    }
    return out;
  }

  function features(grid) {
    const f = [];
    // 4x4 zone densities (16 features)
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        let c = 0;
        for (let dy = 0; dy < 7; dy++) {
          for (let dx = 0; dx < 7; dx++) {
            const y = gy * 7 + dy, x = gx * 7 + dx;
            if (y < 28 && x < 28 && grid[y * 28 + x]) c++;
          }
        }
        f.push(c / 49);
      }
    }
    // Horizontal crossing count per quarter (4)
    for (let q = 0; q < 4; q++) {
      let cr = 0;
      for (let row = q * 7; row < (q + 1) * 7 && row < 28; row++) {
        let prev = 0;
        for (let x = 0; x < 28; x++) {
          if (grid[row * 28 + x] && !prev) cr++;
          prev = grid[row * 28 + x];
        }
      }
      f.push(cr / 14);
    }
    // Vertical crossing per quarter (4)
    for (let q = 0; q < 4; q++) {
      let cr = 0;
      for (let col = q * 7; col < (q + 1) * 7 && col < 28; col++) {
        let prev = 0;
        for (let y = 0; y < 28; y++) {
          if (grid[y * 28 + col] && !prev) cr++;
          prev = grid[y * 28 + col];
        }
      }
      f.push(cr / 14);
    }
    // Center of mass (2)
    let cx = 0, cy = 0, tot = 0;
    for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
      if (grid[y * 28 + x]) { cx += x; cy += y; tot++; }
    }
    f.push(tot > 0 ? cx / tot / 28 : 0.5);
    f.push(tot > 0 ? cy / tot / 28 : 0.5);
    // Fill ratio
    f.push(tot / 784);
    return f; // 16+4+4+2+1 = 27 features
  }

  // Generate templates by rendering digits with different fonts/styles
  function generateTemplates() {
    const c = document.createElement('canvas');
    c.width = 60; c.height = 80;
    const ctx = c.getContext('2d');
    const tpls = {};
    const fonts = ['sans-serif', 'serif', 'monospace'];
    const styles = ['normal', 'italic'];
    const sizes = [52, 58, 48];

    for (let d = 0; d <= 9; d++) {
      tpls[d] = [];
      for (const font of fonts) {
        for (const style of styles) {
          for (const size of sizes) {
            ctx.fillStyle = `rgb(${BG_R},${BG_G},${BG_B})`;
            ctx.fillRect(0, 0, 60, 80);
            ctx.fillStyle = '#ffffff';
            ctx.font = `${style} ${size}px ${font}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(d), 30, 42);

            const imgData = ctx.getImageData(0, 0, 60, 80).data;
            const bounds = getBoundsGeneric(imgData, 60, 80);
            if (!bounds) continue;
            const grid = toBinary28Generic(imgData, 60, bounds);
            tpls[d].push(features(dilate(grid)));
          }
        }
      }
    }
    return tpls;
  }

  function getBoundsGeneric(data, w, h) {
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i] > 128 || data[i + 1] > 128 || data[i + 2] > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    if (!found) return null;
    return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function toBinary28Generic(data, fullW, bounds) {
    const grid = new Uint8Array(784);
    const S = 22;
    const scale = Math.min(S / bounds.w, S / bounds.h);
    const dw = Math.round(bounds.w * scale);
    const dh = Math.round(bounds.h * scale);
    const ox = Math.floor((28 - dw) / 2);
    const oy = Math.floor((28 - dh) / 2);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const sx = Math.floor(bounds.minX + x / scale);
        const sy = Math.floor(bounds.minY + y / scale);
        const i = (sy * fullW + sx) * 4;
        if (data[i] > 128 || data[i + 1] > 128 || data[i + 2] > 128) {
          grid[(oy + y) * 28 + (ox + x)] = 1;
        }
      }
    }
    return grid;
  }

  function ensureTemplates() {
    if (!templates) templates = generateTemplates();
  }

  function matchDigit(feat) {
    let best = '0', bestDist = Infinity;
    for (const [digit, samples] of Object.entries(templates)) {
      for (const tpl of samples) {
        let dist = 0;
        for (let i = 0; i < feat.length; i++) {
          const d = feat[i] - tpl[i];
          dist += d * d;
        }
        if (dist < bestDist) { bestDist = dist; best = digit; }
      }
    }
    return { digit: best, dist: bestDist };
  }

  function segmentDigits(data, fullW, fullH) {
    const bounds = getBounds(data, fullW, fullH);
    if (!bounds) return [];

    const cols = [];
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      let c = 0;
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        const i = (y * fullW + x) * 4;
        if (!isBg(data[i], data[i + 1], data[i + 2])) c++;
      }
      cols.push(c);
    }

    const gapThresh = bounds.h * 0.03;
    const minGap = Math.max(4, bounds.w * 0.04);
    const segs = [];
    let inSeg = false, start = 0, gap = 0;

    for (let i = 0; i < cols.length; i++) {
      if (cols[i] > gapThresh) {
        if (!inSeg) { inSeg = true; start = i; }
        gap = 0;
      } else {
        gap++;
        if (inSeg && gap > minGap) {
          segs.push({ s: start, e: i - gap });
          inSeg = false;
        }
      }
    }
    if (inSeg) segs.push({ s: start, e: cols.length - 1 });
    if (!segs.length) return [bounds];

    return segs.map(seg => {
      const sx = bounds.minX + seg.s, ex = bounds.minX + seg.e;
      let minY = fullH, maxY = 0;
      for (let x = sx; x <= ex; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          const i = (y * fullW + x) * 4;
          if (!isBg(data[i], data[i + 1], data[i + 2])) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return { minX: sx, maxX: ex, minY, maxY, w: ex - sx + 1, h: maxY - minY + 1 };
    }).filter(b => b.w > 3 && b.h > 3);
  }

  function recognize(canvasBuffer) {
    const w = canvasBuffer.width, h = canvasBuffer.height;
    if (!w || !h) return '';
    ensureTemplates();
    const data = canvasBuffer.getContext('2d').getImageData(0, 0, w, h).data;
    const segments = segmentDigits(data, w, h);
    if (!segments.length) return '';

    let result = '';
    for (const seg of segments) {
      if (seg.w > seg.h * 2.5) { result += '-'; continue; }
      if (seg.w < 8 && seg.h < 8) { result += '.'; continue; }
      const grid = toBinary28(data, w, seg);
      const feat = features(grid);
      const m = matchDigit(feat);
      result += m.digit;
    }
    return result;
  }

  window.Recognize = { recognize };
})();
