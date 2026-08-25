// pal — js/app.js
// UI wiring: image intake, extraction, rendering, clipboard, export.

import { getSamples, medianCut } from "./extract.js";

const $ = (sel) => document.querySelector(sel);

const els = {
  dropzone: $("#dropzone"),
  fileInput: $("#file-input"),
  inputSection: $("#input-section"),
  workspace: $("#workspace"),
  results: $("#results-section"),
  preview: $("#preview"),
  count: $("#color-count"),
  countOut: $("#count-out"),
  swatches: $("#swatches"),
  resultsMeta: $("#results-meta"),
  log: $("#log"),
  btnReplace: $("#btn-replace"),
  btnCopyCss: $("#btn-copy-css"),
  btnCopyJson: $("#btn-copy-json"),
  btnExportPng: $("#btn-export-png"),
};

const MAX_EDGE = 200; // work canvas edge for sampling
const PNG_CELL_W = 200;
const PNG_CELL_H = 400;

let samples = null;
let currentColors = [];
let extractTimer = 0;

// ------------------------------------------------------------
// logging
// ------------------------------------------------------------

function log(message, status = "ok") {
  const line = document.createElement("p");
  line.className = `log-line${status === "err" ? " err" : ""}`;

  const tag = document.createElement("span");
  tag.className = "status";
  tag.textContent = `[${status}]`;
  line.append(tag, message);

  els.log.prepend(line);
  while (els.log.children.length > 4) els.log.lastChild.remove();

  setTimeout(() => {
    line.classList.add("fade");
    setTimeout(() => line.remove(), 200);
  }, 2400);
}

// ------------------------------------------------------------
// clipboard
// ------------------------------------------------------------

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.className = "visually-hidden";
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

// ------------------------------------------------------------
// image intake
// ------------------------------------------------------------

function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    log("unsupported file type", "err");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => loadImage(reader.result, file.name);
  reader.onerror = () => log("failed to read file", "err");
  reader.readAsDataURL(file);
}

function loadImage(src, name) {
  const img = new Image();
  img.onload = () => acceptImage(img, src, name);
  img.onerror = () => log("failed to decode image", "err");
  img.src = src;
}

function acceptImage(img, src, name) {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  samples = getSamples(ctx.getImageData(0, 0, w, h));
  if (!samples.length) {
    log("no visible pixels found", "err");
    return;
  }

  els.preview.src = src;
  els.inputSection.hidden = true;
  els.workspace.hidden = false;
  els.results.hidden = false;
  setExportEnabled(true);
  extract();

  const dims = `${img.naturalWidth}×${img.naturalHeight}`;
  log(`loaded ${name ? `"${name}" · ` : ""}${dims}`);
}

function reset() {
  clearTimeout(extractTimer);
  samples = null;
  currentColors = [];
  els.workspace.hidden = true;
  els.results.hidden = true;
  els.inputSection.hidden = false;
  els.preview.removeAttribute("src");
  els.swatches.replaceChildren();
  els.log.replaceChildren();
  setExportEnabled(false);
}

function setExportEnabled(on) {
  for (const btn of [els.btnCopyCss, els.btnCopyJson, els.btnExportPng]) {
    btn.disabled = !on;
  }
}

// ------------------------------------------------------------
// extraction + rendering
// ------------------------------------------------------------

function extract() {
  if (!samples) return;
  const count = Number(els.count.value);
  els.countOut.textContent = String(count);
  currentColors = medianCut(samples, count);
  renderSwatches();
}

function renderSwatches() {
  els.swatches.replaceChildren();

  for (const c of currentColors) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.setAttribute("aria-label", `copy ${c.hex} to clipboard`);
    btn.innerHTML = `
      <span class="swatch-color" style="background:${c.hex}"></span>
      <span class="swatch-info">
        <span class="swatch-hex">${c.hex}</span>
        <span class="swatch-sub">rgb(${c.r}, ${c.g}, ${c.b}) · ${c.weight}%</span>
      </span>`;
    btn.addEventListener("click", async () => {
      await copyText(c.hex);
      log(`copied ${c.hex}`);
    });
    els.swatches.append(btn);
  }

  const n = currentColors.length;
  els.resultsMeta.textContent = `${n} color${n === 1 ? "" : "s"} · click a swatch to copy`;
}

// ------------------------------------------------------------
// exports
// ------------------------------------------------------------

async function copyCss() {
  const vars = currentColors
    .map((c, i) => `  --pal-${i + 1}: ${c.hex};`)
    .join("\n");
  await copyText(`:root {\n${vars}\n}`);
  log(`copied css variables (${currentColors.length})`);
}

async function copyJson() {
  const data = JSON.stringify(
    {
      palette: currentColors.map((c) => ({
        hex: c.hex,
        rgb: [c.r, c.g, c.b],
        weight: c.weight,
      })),
    },
    null,
    2,
  );
  await copyText(data);
  log(`copied json (${currentColors.length})`);
}

function relativeLuminance(c) {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

async function exportPng() {
  const canvas = document.createElement("canvas");
  canvas.width = PNG_CELL_W * currentColors.length;
  canvas.height = PNG_CELL_H;

  const ctx = canvas.getContext("2d");
  ctx.font = "600 18px monospace";
  ctx.textAlign = "center";

  currentColors.forEach((c, i) => {
    const x = i * PNG_CELL_W;
    ctx.fillStyle = c.hex;
    ctx.fillRect(x, 0, PNG_CELL_W, PNG_CELL_H);

    ctx.fillStyle = relativeLuminance(c) > 0.55 ? "#0a0a0a" : "#ededed";
    ctx.fillText(c.hex, x + PNG_CELL_W / 2, PNG_CELL_H - 18);
  });

  canvas.toBlob((blob) => {
    if (!blob) {
      log("export failed", "err");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pal-palette.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    log("exported pal-palette.png");
  }, "image/png");
}

// ------------------------------------------------------------
// events
// ------------------------------------------------------------

els.dropzone.addEventListener("click", () => els.fileInput.click());

els.dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    els.fileInput.click();
  }
});

els.fileInput.addEventListener("change", () => {
  handleFile(els.fileInput.files[0]);
  els.fileInput.value = "";
});

["dragenter", "dragover"].forEach((type) =>
  els.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropzone.classList.add("is-dragover");
  }),
);

["dragleave", "drop"].forEach((type) =>
  els.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("is-dragover");
  }),
);

els.dropzone.addEventListener("drop", (e) => {
  handleFile(e.dataTransfer.files[0]);
});

document.addEventListener("paste", (e) => {
  const items = [...(e.clipboardData?.items || [])];
  const item = items.find((i) => i.type.startsWith("image/"));
  if (item) handleFile(item.getAsFile());
});

els.count.addEventListener("input", () => {
  clearTimeout(extractTimer);
  extractTimer = setTimeout(extract, 150);
});

els.btnReplace.addEventListener("click", reset);
els.btnCopyCss.addEventListener("click", copyCss);
els.btnCopyJson.addEventListener("click", copyJson);
els.btnExportPng.addEventListener("click", exportPng);
