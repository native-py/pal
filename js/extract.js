// pal — js/extract.js
// Median-cut color quantization. Pure functions, no DOM.

const MAX_SAMPLES = 10000;

/**
 * Convert canvas ImageData into an array of [r, g, b] samples,
 * skipping transparent pixels and capping the sample count.
 */
export function getSamples(imageData) {
  const { data, width, height } = imageData;
  const total = width * height;
  const stride = Math.max(1, Math.floor(total / MAX_SAMPLES));
  const samples = [];

  for (let i = 0; i < total; i += stride) {
    const o = i * 4;
    if (data[o + 3] < 128) continue;
    samples.push([data[o], data[o + 1], data[o + 2]]);
  }

  return samples;
}

function boxBounds(box) {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (let i = 0; i < box.length; i++) {
    const r = box[i][0], g = box[i][1], b = box[i][2];
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (g < minG) minG = g; if (g > maxG) maxG = g;
    if (b < minB) minB = b; if (b > maxB) maxB = b;
  }

  return {
    ranges: [maxR - minR, maxG - minG, maxB - minB],
    spread: Math.max(maxR - minR, maxG - minG, maxB - minB),
  };
}

function toHex(r, g, b) {
  const h = (n) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Median cut: repeatedly split the color box with the widest channel
 * range at its median until we have `count` boxes, then average each.
 * Returns colors sorted by dominance (share of samples).
 *
 * @param {number[][]} samples - [[r,g,b], ...]
 * @param {number} count - requested palette size
 * @returns {{hex: string, r: number, g: number, b: number, weight: number}[]}
 */
export function medianCut(samples, count) {
  if (!samples.length || count < 1) return [];

  const boxes = [samples];

  while (boxes.length < count) {
    let target = -1;
    let bestSpread = 0;

    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].length < 2) continue;
      const { spread } = boxBounds(boxes[i]);
      if (spread > bestSpread) {
        bestSpread = spread;
        target = i;
      }
    }

    // No splittable box left (flat image) — stop early.
    if (target === -1) break;

    const box = boxes[target];
    const { ranges } = boxBounds(box);
    const channel = ranges.indexOf(Math.max(...ranges));

    box.sort((a, z) => a[channel] - z[channel]);
    const mid = box.length >> 1;
    boxes.splice(target, 1, box.slice(0, mid), box.slice(mid));
  }

  // Average each box into one color; merge exact duplicates by hex.
  const merged = new Map();
  let totalWeight = 0;

  for (const box of boxes) {
    let sr = 0, sg = 0, sb = 0;
    for (const p of box) {
      sr += p[0]; sg += p[1]; sb += p[2];
    }
    const n = box.length;
    if (!n) continue;

    const hex = toHex(Math.round(sr / n), Math.round(sg / n), Math.round(sb / n));
    const entry = merged.get(hex) || { hex, sumR: 0, sumG: 0, sumB: 0, count: 0 };
    entry.sumR += sr; entry.sumG += sg; entry.sumB += sb;
    entry.count += n;
    merged.set(hex, entry);
    totalWeight += n;
  }

  return [...merged.values()]
    .map((c) => ({
      hex: c.hex,
      r: Math.round(c.sumR / c.count),
      g: Math.round(c.sumG / c.count),
      b: Math.round(c.sumB / c.count),
      weight: +((c.count / totalWeight) * 100).toFixed(1),
    }))
    .sort((a, z) => z.weight - a.weight);
}
