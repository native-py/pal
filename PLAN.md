# PLAN.md — Tool #1: Color Palette Extractor

> Rencana fitur & teknis. Eksekusi mengikuti `design.md`.
> Nama tool: **pal** — image → color palette, di browser.

---

## 1. Ringkasan

Upload gambar (drag-drop / klik / paste), tool mengekstrak warna-warna dominan menjadi palet. Semua proses di browser (client-side), tidak ada upload ke server.

## 2. Fitur

### MVP (v1 — wajib)

| # | Fitur | Detail |
|---|---|---|
| 1 | Input gambar | 3 cara: klik untuk browse · drag & drop · paste dari clipboard (`Ctrl+V`) |
| 2 | Preview gambar | Thumbnail gambar asli setelah dimuat |
| 3 | Ekstraksi palet | Algoritma **median cut** di atas canvas; sampling maks ±10.000 px agar tetap instan |
| 4 | Jumlah warna | Kontrol 3–12 warna (default 6) |
| 5 | Tampilan hasil | Baris swatch besar; tiap swatch menampilkan hex + rgb + persentase dominasi |
| 6 | Copy per warna | Klik swatch → copy hex → log line `[ok] copied #xxxxxx` |
| 7 | Copy semua | Tombol format: CSS variables / JSON |
| 8 | Export PNG | Unduh strip palet sebagai gambar PNG (canvas) |

### v2 (nanti, jangan dibuat dulu)

- Lock warna lalu re-extract
- Eyedropper pada preview gambar
- Riwayat palet via localStorage
- Konversi HSL/OKLCH

### Non-goals

- Edit gambar, filter, crop
- Akun/penyimpanan cloud
- Dukungan video

## 3. Tech Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Markup | HTML5 semantik | Tanpa framework — sesuai prinsip zero-dependency di design.md |
| Style | CSS murni + custom properties | Tokens dari design.md dipakai langsung sebagai CSS variables |
| Logic | Vanilla JS (ES2020+, module) | Tanpa build step, tanpa node_modules |
| Font | JetBrains Mono via Google Fonts | Sesuai design.md §3; ada fallback system mono |
| Ekstraksi warna | Median cut sendiri (~80 baris) | Hasil lebih baik daripada bucket-counting; tanpa library |
| Hosting | GitHub Pages | Static files saja — push langsung jalan |
| Ikon | Inline SVG | Sesuai design.md §9 |

**Struktur file**

```
/
├── index.html          # markup tunggal
├── css/style.css       # tokens + components (mengikuti design.md)
├── js/extract.js       # median cut algorithm (pure, tanpa DOM)
├── js/app.js           # UI wiring: input, render, copy, export
├── design.md           # design system global
├── PLAN.md             # dokumen ini
└── README.md           # intro + screenshot + cara deploy
```

## 4. Alur Aplikasi

```
[dropzone] ──klik/drop/paste──▶ load file ──▶ draw ke canvas (downscale)
                                                      │
                          slider jumlah warna ──▶ median cut
                                                      │
                              render swatches ◀──────┘
                                      │
                    klik swatch ──▶ copy hex ──▶ [log line]
                    tombol export ──▶ PNG strip / CSS vars / JSON
```

## 5. Batasan Teknis

- Format diterima: PNG, JPG, WebP, GIF (frame pertama). Validasi `file.type`.
- Gambar besar di-downscale ke sisi terpanjang ±200px sebelum sampling.
- Canvas `getImageData` butuh gambar same-origin — semua input berasal dari file lokal/paste, jadi aman.
- Copy memakai `navigator.clipboard` dengan fallback `execCommand` untuk context non-secure.

## 6. Definition of Done (v1)

- [ ] Semua fitur MVP berfungsi di Chrome & Firefox desktop
- [ ] Layout utuh di 375px
- [ ] Keyboard-only bisa menyelesaikan seluruh alur
- [ ] Checklist aksesibilitas design.md §10 lolos
- [ ] README siap + repo bisa diaktifkan GitHub Pages tanpa setting tambahan
