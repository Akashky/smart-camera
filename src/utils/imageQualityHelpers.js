
function downsampleGray(imageData, maxDim = 140) {
  const { width, height, data } = imageData;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const newW = Math.max(1, Math.floor(width * scale));
  const newH = Math.max(1, Math.floor(height * scale));
  const gray = new Float32Array(newW * newH);
  const alpha = new Uint8Array(newW * newH);

  const xStep = width / newW;
  const yStep = height / newH;

  let idx = 0;
  for (let y = 0; y < newH; y++) {
    const srcY = Math.floor(y * yStep);
    for (let x = 0; x < newW; x++) {
      const srcX = Math.floor(x * xStep);
      const i = (srcY * width + srcX) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      gray[idx] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      alpha[idx] = a;
      idx++;
    }
  }
  return { gray, alpha, width: newW, height: newH };
}

export function computeSharpnessScore(imageData) {
  const { gray, alpha, width, height } = downsampleGray(imageData, 160);

  // If too few valid pixels, return 0
  let validCount = 0;
  for (let i = 0; i < alpha.length; i++) if (alpha[i] > 20) validCount++;
  if (validCount < 25) return 0;

  // 4-neighbor discrete Laplacian (center*4 - sum(neighbors))
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (alpha[i] <= 20) continue; // outside mask
      const c = gray[i];
      const n1 = gray[i - width];
      const n2 = gray[i + width];
      const n3 = gray[i - 1];
      const n4 = gray[i + 1];
      if (alpha[i - width] <= 20 || alpha[i + width] <= 20 || alpha[i - 1] <= 20 || alpha[i + 1] <= 20) continue;
      const lap = c * 4 - (n1 + n2 + n3 + n4);
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const variance = sumSq / count;

  const mapped = Math.log10(variance + 1) / 2.2; // roughly 0..2 for practical ranges
  const score = Math.round(Math.max(0, Math.min(100, mapped * 100)));

  return score;
}


export function computeLightingScore(imageData) {
  const { gray, alpha } = downsampleGray(imageData, 120);
  const vals = [];
  for (let i = 0; i < gray.length; i++) {
    if (alpha[i] > 20) vals.push(gray[i]);
  }
  if (!vals.length) return 0;
  vals.sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  const median = vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid];
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;

  // Desired median ~100..160
  let score;
  if (median < 70) score = Math.round(20 + (median / 70) * 60); // 20..80
  else if (median > 180) score = Math.round(Math.max(30, 95 - ((median - 180) / 75) * 60)); // reduce if overexposed
  else score = 95;

  // penalize hotspots (mean >> median)
  const skew = mean - median;
  if (skew > 20) score = Math.max(30, score - Math.round((skew / 100) * 30));

  return Math.max(0, Math.min(100, score));
}

/**
 * Contrast score: std dev of luminance mapped to 0-100
 */
export function computeContrastScore(imageData) {
  const { gray, alpha } = downsampleGray(imageData, 120);
  const vals = [];
  for (let i = 0; i < gray.length; i++) if (alpha[i] > 20) vals.push(gray[i]);
  if (!vals.length) return 0;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  let variance = 0;
  for (let v of vals) variance += (v - mean) * (v - mean);
  variance /= vals.length;
  const std = Math.sqrt(variance);
  // std typical range 0..80 -> map to 0..100
  const score = Math.round(Math.max(0, Math.min(100, (std / 60) * 100)));
  return score;
}

/**
 * Final clarity: weighted blend
 */
export function computeClarity(lighting, sharpness, contrast) {
  const wSharp = 0.6;
  const wLight = 0.3;
  const wContrast = 0.1;
  let combined = lighting * wLight + sharpness * wSharp + contrast * wContrast;
  if (combined > 86 && sharpness > 85) combined = Math.min(100, combined + 4);
  return Math.round(Math.max(0, Math.min(100, combined)));
}
