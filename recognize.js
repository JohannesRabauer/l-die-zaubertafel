(function () {
  // Simple digit recognition using zone density features
  // Divides bounding box of drawing into a 5x5 grid, computes fill density per cell
  // Compares against reference templates for digits 0-9 and operators

  const BG_R = 45, BG_G = 90, BG_B = 39; // #2d5a27

  function getDrawingBounds(imageData, w, h) {
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (!isBg(imageData[i], imageData[i+1], imageData[i+2])) {
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

  function isBg(r, g, b) {
    return Math.abs(r - BG_R) < 40 && Math.abs(g - BG_G) < 40 && Math.abs(b - BG_B) < 40;
  }

  function getZoneFeatures(imageData, fullW, bounds, gridSize) {
    const features = new Array(gridSize * gridSize).fill(0);
    const cellW = bounds.w / gridSize;
    const cellH = bounds.h / gridSize;

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let count = 0, total = 0;
        const startX = Math.floor(bounds.minX + gx * cellW);
        const endX = Math.floor(bounds.minX + (gx + 1) * cellW);
        const startY = Math.floor(bounds.minY + gy * cellH);
        const endY = Math.floor(bounds.minY + (gy + 1) * cellH);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const i = (y * fullW + x) * 4;
            total++;
            if (!isBg(imageData[i], imageData[i+1], imageData[i+2])) count++;
          }
        }
        features[gy * gridSize + gx] = total > 0 ? count / total : 0;
      }
    }
    return features;
  }

  // Reference templates (5x5 density grids) for digits 0-9
  // Generated from typical handwriting patterns
  const GRID = 5;
  const TEMPLATES = {
    '0': [0,.6,1,.6,0, .8,0,0,0,.8, .8,0,0,0,.8, .8,0,0,0,.8, 0,.6,1,.6,0],
    '1': [0,0,.6,.2,0, 0,.6,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,.4,1,.4,0],
    '2': [0,.6,1,.6,0, .6,0,0,.2,.8, 0,0,.4,.8,0, 0,.6,.8,0,0, .8,1,1,1,.8],
    '3': [.4,.8,1,.6,0, 0,0,0,.2,.8, 0,.4,1,.6,0, 0,0,0,.2,.8, .4,.8,1,.6,0],
    '4': [0,0,0,.8,.2, 0,0,.6,.8,0, 0,.6,.2,.8,0, .8,1,1,1,.8, 0,0,0,.8,0],
    '5': [.8,1,1,1,.6, .8,0,0,0,0, .8,1,1,.6,0, 0,0,0,.2,.8, .8,1,1,.6,0],
    '6': [0,.4,1,.6,0, .6,.2,0,0,0, .8,.8,1,.6,0, .8,0,0,.2,.8, 0,.4,1,.6,0],
    '7': [.8,1,1,1,.8, 0,0,0,.6,.4, 0,0,.6,.2,0, 0,.6,0,0,0, .6,.2,0,0,0],
    '8': [0,.6,1,.6,0, .6,0,0,0,.6, 0,.6,1,.6,0, .6,0,0,0,.6, 0,.6,1,.6,0],
    '9': [0,.6,1,.4,0, .8,.2,0,0,.8, 0,.6,1,.8,.8, 0,0,0,.4,.6, 0,.6,1,.4,0],
  };

  function matchTemplate(features) {
    let bestDigit = null, bestScore = -Infinity;
    for (const [digit, template] of Object.entries(TEMPLATES)) {
      let score = 0;
      for (let i = 0; i < features.length; i++) {
        // Cosine-like similarity
        score += features[i] * template[i];
        score -= Math.abs(features[i] - template[i]) * 0.3;
      }
      if (score > bestScore) {
        bestScore = score;
        bestDigit = digit;
      }
    }
    return { digit: bestDigit, confidence: bestScore };
  }

  function segmentDigits(imageData, fullW, fullH) {
    // Find vertical gaps to segment multiple digits
    const bounds = getDrawingBounds(imageData, fullW, fullH);
    if (!bounds) return [];

    // Compute column density within bounds
    const colDensity = [];
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      let count = 0;
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        const i = (y * fullW + x) * 4;
        if (!isBg(imageData[i], imageData[i+1], imageData[i+2])) count++;
      }
      colDensity.push(count);
    }

    // Find segments by looking for gaps (columns with 0 or near-0 ink)
    const threshold = bounds.h * 0.05;
    const segments = [];
    let inSegment = false, segStart = 0;

    for (let i = 0; i < colDensity.length; i++) {
      if (!inSegment && colDensity[i] > threshold) {
        inSegment = true;
        segStart = i;
      } else if (inSegment && colDensity[i] <= threshold) {
        inSegment = false;
        segments.push({ startX: bounds.minX + segStart, endX: bounds.minX + i - 1 });
      }
    }
    if (inSegment) segments.push({ startX: bounds.minX + segStart, endX: bounds.maxX });

    // If no clear segmentation, treat as single digit
    if (segments.length === 0) return [bounds];

    // Convert segments to bounds
    return segments.map(seg => {
      let minY = fullH, maxY = 0;
      for (let x = seg.startX; x <= seg.endX; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          const i = (y * fullW + x) * 4;
          if (!isBg(imageData[i], imageData[i+1], imageData[i+2])) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return { minX: seg.startX, maxX: seg.endX, minY, maxY, w: seg.endX - seg.startX + 1, h: maxY - minY + 1 };
    }).filter(b => b.w > 5 && b.h > 5); // Filter tiny noise
  }

  function isLikelyMinus(bounds) {
    // A minus sign is much wider than tall
    return bounds.w > bounds.h * 2.5 && bounds.h < 20;
  }

  function recognize(canvasBuffer) {
    const w = canvasBuffer.width, h = canvasBuffer.height;
    if (w === 0 || h === 0) return '';
    const ctx = canvasBuffer.getContext('2d');
    const imageData = ctx.getImageData(0, 0, w, h).data;

    const segments = segmentDigits(imageData, w, h);
    if (segments.length === 0) return '';

    let result = '';
    for (const seg of segments) {
      if (isLikelyMinus(seg)) {
        result += '-';
        continue;
      }
      const features = getZoneFeatures(imageData, w, seg, GRID);
      const match = matchTemplate(features);
      if (match.confidence > 1.5) {
        result += match.digit;
      }
    }
    return result;
  }

  window.Recognize = { recognize };
})();
