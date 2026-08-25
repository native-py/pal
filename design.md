# design.md — Global Design System

> Single source of truth untuk semua tools di repo ini.
> Setiap tool baru **wajib** mengikuti tokens & rules di sini. Jika ada kebutuhan yang belum tercakup, tambahkan ke dokumen ini dulu sebelum coding.

---

## 1. Design Philosophy

**Style: Command Line Interface (CLI) di dalam browser.**

Setiap tool harus terasa seperti program terminal yang dikemas rapi:

- **Monokrom penuh** — hanya skala abu-abu (grayscale). Hierarki dibentuk lewat *kontras terang-gelap*, bukan warna.
- **Font monospace di semua elemen** — heading, body, button, input. Tidak ada font sans-serif/serif.
- **Tajam & fungsional** — sudut kotak (radius 0), border 1px tegas, tanpa shadow dekoratif, tanpa gradien.
- **Copy bergaya terminal** — label lowercase, prefix `$` / `>` untuk prompt, notifikasi seperti log line (`[ok] copied`).
- **Zero-dependency** — tidak ada framework CSS/JS. HTML + CSS + vanilla JS murni agar cepat, awet, dan mudah di-deploy.

### Anti-patterns (dilarang)

| Dilarang | Alasan |
|---|---|
| Warna selain grayscale pada UI chrome | Merusak identitas monokrom |
| Border-radius > 2px | Melawan estetika terminal |
| Emoji sebagai ikon | Inkonsisten antar-platform |
| Font non-monospace | Melawan identitas |
| Animasi bounce/spring/parallax | Terasa "web", bukan "terminal" |
| Shadow / glow / gradient | Dekorasi tanpa fungsi |

> **Catatan:** konten hasil *output* tool (mis. swatch warna dari gambar) boleh berwarna apa adanya — yang monokrom adalah *kerangka UI*-nya.

---

## 2. Color Tokens

Dark theme saja (identitas terminal). Semua nilai sudah dicek kontrasnya terhadap latar.

### Grayscale Ramp

```css
:root {
  /* backgrounds */
  --bg-0: #0a0a0a;      /* halaman */
  --bg-1: #111111;      /* surface: card, panel */
  --bg-2: #1a1a1a;      /* raised: input, hover surface */
  --bg-3: #242424;      /* active / pressed */

  /* borders */
  --border:    #333333; /* default */
  --border-strong: #4d4d4d; /* hover, emphasized */

  /* text */
  --text-hi:  #ededed;  /* primary  — kontras ±16:1 di bg-0 */
  --text-mid: #a3a3a3;  /* secondary — kontras ±7:1 */
  --text-low: #6b6b6b;  /* muted/hint — hanya utk teks besar atau dekoratif */

  /* accent = inverse video (satu-satunya "warna aksen") */
  --inv-bg:   #ededed;
  --inv-text: #0a0a0a;
}
```

### Rules

- Aksen **hanya** berupa *inverse video* (teks gelap di atas terang): button primer, selection aktif, highlight penting.
- Status **tidak memakai warna** — pakai simbol teks: `[ok]`, `[warn]`, `[err]`, `…`.
- Jangan pernah hardcode hex di komponen; selalu pakai token.
- Kontras minimum: teks normal ≥ 4.5:1, teks besar ≥ 3:1, elemen interaktif vs background ≥ 3:1.

---

## 3. Typography

```css
:root {
  --font-mono: "JetBrains Mono", "Cascadia Code", "Fira Code", Consolas,
               ui-monospace, monospace;
}
```

Load via Google Fonts dengan `display=swap`; fallback stack wajib ada agar tool tetap tampil benar offline.

### Type Scale

| Token | Size | Line height | Weight | Usage |
|---|---|---|---|---|
| `--fs-display` | 28px | 1.2 | 700 | Judul halaman/tool |
| `--fs-title`   | 20px | 1.3 | 700 | Judul section |
| `--fs-body`    | 14px | 1.6 | 400 | Body, input, button |
| `--fs-sm`      | 12px | 1.5 | 400 | Label, hint, log |
| `--fs-xs`      | 11px | 1.4 | 400 | Meta, suffix |

### Rules

- Heading & label **lowercase** (`extract palette`, bukan `Extract Palette`) — khas prompt terminal.
- Angka/hex/kode selalu monospace (otomatis, karena semua font mono).
- Lebar baca maksimum ±72ch.

---

## 4. Spacing & Layout

Grid 8px (sub-scale 4px):

```css
:root {
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 16px;
  --sp-4: 24px; --sp-5: 32px; --sp-6: 48px;
}
```

- Container: `max-width: 960px; margin-inline: auto; padding-inline: var(--sp-3);`
- Gap antar-section: `--sp-6`. Antar-elemen dalam card: `--sp-2`–`--sp-3`.
- Mobile-first; layout uji di 375px, 768px, 1200px.

---

## 5. Shape & Borders

```css
:root {
  --radius: 0;        /* default — sudut tajam */
  --radius-chip: 2px; /* satu-satunya pengecualian: chip/badge */
  --border-w: 1px;
}
```

- Semua box memakai `border: var(--border-w) solid var(--border)`.
- Tanpa `box-shadow`. Kedalaman dibuat lewat lapisan `--bg-*`.

---

## 6. Components

Spec minimal yang wajib dipatuhi setiap tool. (Implementasi referensi: `css/style.css`.)

### Button

```
default : bg-2 · border · text-hi        hover: bg-3 + border-strong
primary : inv-bg · inv-text · tanpa border   (maks 1 per view)
ghost   : transparan · border transparan · text-mid  hover: text-hi + border
disabled: opacity .4 + cursor not-allowed
height 44px · padding-inline 16px · fs-body · transition 140ms
```

### Input / Select

```
bg-0 · border · text-hi · height 44px · padding-inline 12px
focus: border-color text-hi + outline none (border jadi indikator fokus)
placeholder: text-low
```

### Card / Panel

```
bg-1 · border · padding var(--sp-3)
header panel (opsional): baris title lowercase + garis border-bottom
```

### Dropzone

```
area besar bg-0 · border 1px dashed var(--border-strong)
state drag-over: border solid text-hi + bg-2
```

### Log line (toast/notif/status)

```
baris teks fs-sm di area log:  [ok] copied #ff0000
prefix menentukan status; muncul instan, hilang setelah 2s (fade 200ms)
```

### Chip / Badge

```
radius-chip · border · fs-xs · padding 2px 8px
aktif: inverse video
```

### Table / List output

```
header row: text-mid · border-bottom strong
row hover: bg-2 · nilai teknis (hex, %, dsb.) rata kanan
```

---

## 7. Interaction States

| State | Rule |
|---|---|
| Hover | ganti `--bg-*` naik 1 level + border-strong; **tanpa transform** |
| Active/pressed | `--bg-3`, durasi singkat |
| Focus (keyboard) | `outline: 2px solid var(--text-hi); outline-offset: 2px;` — tidak pernah dihapus |
| Disabled | opacity .4 + `cursor: not-allowed` + attr `disabled` asli |
| Loading | teks berjalan `processing…` / spinner karakter ASCII (braille dots), bukan GIF |

Semua elemen interaktif: min. tinggi sentuh 44×44px, feedback ≤ 150ms.

---

## 8. Motion

```css
:root { --dur-fast: 120ms; --dur-base: 160ms; --ease: ease-out; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
```

- Transisi hanya pada `background-color, border-color, color, opacity`.
- Satu-satunya animasi loop yang diizinkan: **caret blink** `1s step-end infinite`.
- Tanpa scroll-triggered animation.

---

## 9. Icons

- Inline SVG saja (tanpa library eksternal), grid 16px, stroke `1.5`, `currentColor`.
- Selalu `aria-hidden="true"` jika dekoratif; ikon fungsional wajib punya `aria-label`.

---

## 10. Accessibility Checklist (per tool)

- [ ] Navigasi keyboard penuh, urutan fokus logis
- [ ] Kontras teks ≥ 4.5:1 (token di atas sudah aman — jangan diganti sembarangan)
- [ ] Elemen non-warna: status memakai teks `[ok]/[err]`, bukan cuma warna
- [ ] Form control punya `<label>` eksplisit
- [ ] `prefers-reduced-motion` dihormati
- [ ] Uji di 375px width
