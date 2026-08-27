# pal — Image Color Palette Extractor

![License](https://img.shields.io/badge/license-MIT-black?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-0-black?style=flat-square)
![Built with](https://img.shields.io/badge/built%20with-vanilla%20js-black?style=flat-square)

**pal** extracts the dominant colors from any image and turns them into a clean,
copyable palette — entirely in your browser. No uploads, no accounts, no build
step, no dependencies.

<!-- Screenshot tip: add an image of the app here, e.g. ![screenshot](docs/screenshot.png) -->

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Browser Support](#browser-support)
- [Privacy](#privacy)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Three ways to load an image** — click to browse, drag & drop, or paste
  directly from the clipboard (`Ctrl+V`).
- **Median-cut quantization** — perceptually balanced palettes of 3–12 colors,
  re-extracted instantly as you adjust the count.
- **Dominance percentages** — every swatch shows its share of the image.
- **One-click copy** — click any swatch to copy its hex value.
- **Bulk export** — copy the whole palette as CSS custom properties or JSON,
  or download it as a PNG strip.
- **100% client-side** — images are processed locally and never leave your machine.

## Getting Started

### Prerequisites

Any modern browser is enough to *use* the tool. To run it locally you need one
of the following static servers:

| Option | Requirement |
|---|---|
| `node serve.js` | [Node.js](https://nodejs.org) (any recent version) |
| `python -m http.server` | Python 3 |

> **Why a server?** The app uses native ES modules, which browsers refuse to
> load over `file://`. Any static server solves this.

### Installation

```sh
git clone https://github.com/<your-username>/pal.git
cd pal
node serve.js        # → http://localhost:8000
```

Alternative without Node:

```sh
python -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

### Deploying to GitHub Pages

No build step is required — the repository *is* the website.

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to *Deploy from a branch*, choose your branch and `/ (root)`.
4. Your tool will be live at `https://<your-username>.github.io/pal/`.

## Usage

### 1. Load an image

- Click the drop zone and pick a file, **or**
- Drag & drop an image anywhere onto the drop zone, **or**
- Paste an image from the clipboard with `Ctrl+V` (great for screenshots).

Supported formats: PNG, JPEG, WebP, GIF (first frame).

### 2. Tune the palette

Use the **colors** slider to request between 3 and 12 colors. The palette
re-extracts automatically ~150 ms after you stop dragging.

### 3. Copy colors

Click any swatch to copy its hex value (e.g. `#2b2d42`). A log line confirms
every action.

### 4. Export the palette

| Button | Output |
|---|---|
| **copy as css variables** | Ready-to-paste CSS custom properties |
| **copy as json** | Structured JSON with hex, RGB, and weight |
| **export palette as png** | A downloadable PNG strip with hex labels |

CSS output looks like this:

```css
:root {
  --pal-1: #2b2d42;
  --pal-2: #8d99ae;
  --pal-3: #edf2f4;
}
```

JSON output looks like this:

```json
{
  "palette": [
    { "hex": "#2b2d42", "rgb": [43, 45, 66], "weight": 41.2 },
    { "hex": "#8d99ae", "rgb": [141, 153, 174], "weight": 23.7 }
  ]
}
```

## How It Works

The palette is extracted with the classic **median cut** algorithm:

1. The image is drawn to an offscreen canvas and downscaled so its longest
   edge is ≤ 200 px.
2. Up to 10,000 opaque pixels are sampled into RGB triplets.
3. All samples start in one box. Repeatedly, the box with the widest channel
   range (R, G, or B) is split at the median of that channel until the
   requested number of boxes exists.
4. Each box is averaged into a single color, sorted by population
   (dominance), and reported with its percentage share.

This runs in a few milliseconds even for large photos, because sampling is
capped regardless of input resolution.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Markup | Semantic HTML5 | No framework needed |
| Styling | Plain CSS + custom properties | Tokens defined once in [`design.md`](design.md) |
| Logic | Vanilla JS (ES modules) | Zero dependencies, zero build step |
| Color extraction | Custom median-cut (~90 LOC) | Small, auditable, library-free |
| Dev server | `serve.js` (~60 LOC, Node stdlib) | Reproducible local setup |
| Hosting | GitHub Pages | Static files deploy as-is |

## Project Structure

```
pal/
├── index.html          # single-page markup
├── css/style.css       # design tokens + components
├── js/extract.js       # median-cut algorithm (pure, DOM-free)
├── js/app.js           # UI wiring: intake, render, clipboard, export
├── serve.js            # zero-dependency dev server
├── design.md           # monochrome command-line design system
├── PLAN.md             # feature plan & roadmap
└── README.md
```

## Browser Support

Works in all evergreen browsers that support ES modules (Chrome, Edge,
Firefox, Safari — current versions). Clipboard access uses the async
Clipboard API where available, with a fallback for older contexts.

## Privacy

All processing happens locally in your browser. Images are read with the
File API and never transmitted anywhere. The only outbound request is the
JetBrains Mono webfont from Google Fonts (a system font stack is used as a
fallback when offline).

## Roadmap

Planned for v2 — see [`PLAN.md`](PLAN.md):

- Lock individual colors and re-extract around them
- Eyedropper directly on the preview image
- Palette history via `localStorage`
- HSL / OKLCH output formats

## Contributing

Issues and pull requests are welcome. Please keep changes aligned with
[`design.md`](design.md) — the design system is the contract for this repo.

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).
..
