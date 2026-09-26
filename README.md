# Three Dots & a Dash — Result Sheet Maker

Phase 1 foundation, revised after Claude review.

## Phase 1 scope
- Sheet: 4000×3000 (4:3) color base (color picker + HEX input, default #FFFFFF)
- Pattern layer: ONE transparent PNG chosen from assets/backgrounds/ (listed in patterns.json),
  stretched to the sheet; optional tint (all visible pixels → one color, alpha kept)
- Uploading a background image was removed (v1 projects migrate: uploaded image dropped)
- Project files store only the pattern file name, not the image
- Built-in procedural patterns (js/patterns/builtin.js, 28 patterns in 5 groups): color, opacity,
  scale (per-pattern minimum for complex shapes); random ones use a stored seed (changed only by
  "배치 다시 뽑기"), scattered ones use evenly spread (stratified) placement
- PROJECT_VERSION 3: pattern = { source: none | file | builtin }
- One Canvas 2D rendering pipeline shared by preview/export
- Preview renders at display scale × devicePixelRatio; export renders at native scale 1
- Asset registry keeps image binaries/decoded images outside live state
- Runtime state stores asset metadata/IDs only
- Self-contained JSON project save/load embeds assets only at serialization boundary
- Migration hook for future project versions
- Central editor config vs normalized sheet layout foundation
- Korean UI strings
- Unicode-safe filenames
- Unsaved-change warning
- Native-resolution PNG export

## Phase 2 — MD character + coaster
- Character PNG uploaded per commission (embedded in the project file); coaster PNGs from
  assets/coasters/ (coasters.json), stored by file name only
- state.components.md = { character: { asset, x, y, width }, coaster: { file, x, y, width }, linked }
  x/y = anchor (character bottom-center, coaster center) / design size; width = rendered width / design width
- Drag on the preview, Ctrl/⌘ + wheel to resize, panel slider/number, 위치 초기화,
  "캐릭터 이동 시 코스터도 같이 이동" (character moves → coaster follows; never the reverse)
- Editor overlay (MD area guide, selection) is a separate canvas, never exported
- PROJECT_VERSION 4

## Phase 3 — plate (coaster + doily), SD character, decor
- js/components/plate.js: procedural plate = outer zone (edge: 매끈/물결/레이스/톱니; perforations
  are a SEPARATE toggle) + inner zone (fill + built-in pattern sized to the plate), split by a ring line.
  Every numeric field clamped at the state boundary.
- MD coaster = none | PNG file | plate. SD doily is always a plate.
- SD section: SD character (same controls as MD), doily, decor symbols above the doily.
- One interaction controller (js/editor/interaction.js) + component adapters (js/editor/adapters.js);
  shared "받침 설정" panel (js/editor/plate-panel.js).
- PROJECT_VERSION 5

## Phase 3.1 — frame, tray, brand, curved decor, plate sync, fonts
- Sheet-level branding (components.brand: two lines + color, "brand" font role), drawn above MD / SD.
- MD presentation frame (arch / rect), SD tray (rounded / ellipse): components/boxes.js.
- Curved plate decor on both plates (components/decor-path.js: pure arc-length layout,
  grapheme-safe, auto-upright on the lower arc). Max 60 graphemes, enforced in the input.
- Edge styles: + 꽃잎 / 러플 / 뾰족 별 / 티켓 구멍 (lace silhouette ≠ lace perforations).
- "코스터와 도일리 디자인 맞추기": design fields sync; geometry (x/y/width/aspect) and pattern
  seeds never sync. Turning it on copies from the plate whose checkbox was clicked.
- SD linking is hierarchical: SD → doily + tray, doily → tray, tray alone.
- Fonts: js/fonts.js (roles) + css/fonts.css (@font-face template, files NOT bundled) +
  fonts-check.html (Canvas rendering / Mona12Emoji fallback check).
- PROJECT_VERSION 6

## v7 — user-selectable fonts
- js/fonts.js: FONTS (id → label, families, weights, fallback), FONT_ORDER, FONT_DEFAULTS
  (brand: puzzle, cocktailName: ahnchangho, receipt: mona, script: lovingu, decor: system).
- State stores font IDs only; unknown IDs → the element's default. Weight variants
  (Mona, Mulgyeol) are weights of one ID. Pixel emoji only in the "mona" stack.
- Shared picker: fontRow() in js/ui/controls.js. PROJECT_VERSION 7.

## v8 — MD frame / decorations / stickers
- js/components/shapes.js: one path generator (arch, rect, rounded, oval, pill) + inset + anchors.
- js/components/frame.js: MD background frame — fill (solid / linear gradient), border styles
  line / multi / offset / picture / pictureMat (all shapes).
- js/decor/*: MD decorations separate from the frame — corners (glyphs, built-in corner ornaments,
  or a folder sticker; one type mirrored to 4 anchors), top (sparkle cluster, bow, valance, moon,
  big sparkle), swirls, banner ribbon with curved text (draggable), optional outline.
- Stickers (sheet-level): js/stickers/builtin.js (18 code-drawn stickers) + optional folder
  assets/stickers/ (stickers.json; empty/absent is normal). Move / resize / rotate / flip /
  opacity / color / front-back.
- Brand letterSpacing + lineHeight; SD tray centered by default + "도일리 가운데로 맞추기".
- PROJECT_VERSION 8 (v7 files export pixel-identical).

## Phase 4 (v9) — Cocktail Card
- js/components/card.js: fixed internal layout (CARD_LAYOUT), draw order fill → image → list →
  divider → name / barcode / HEX / title → coating → border; measured dot leaders with one
  shared amount edge; overflow warning (never auto-shrinks).
- js/components/text-style.js: font + letterSpacing + effect normal / neon / comic
  (shadow values × renderScale → preview = export).
- js/components/barcode.js: ONE persistent components.barcode.seed shared with the receipt.
- components.order.hex: order information (card HEX + receipt ORDER), never a color binding.
- Illustration via the assets registry; scale × contain-fit, dx / dy relative to the slot.
- PROJECT_VERSION 9 (v8 files export identical: card hidden when migrated).

## Phase 5 (v10) — Receipt
- js/components/receipt.js: fixed board, content-length paper (two-pass layout → draw), header
  (DATE / ORDER = order.hex / CLIENT / SERVER), dynamic list / playlist sections, horizontal
  barcode (shared seed), persistent 8-digit code (string) or a real-date anniversary, footer.
  Overflow = editor warning only.
- js/components/leader.js: measured dot-leader rows (receipt only); song titles use a fixed skew.
- js/editor/receipt-panel.js: quick-add Keyword / Emoji / Mood-Playlist / Mood / Fashion-Style.
- New projects start with no sections. PROJECT_VERSION 10 (v9 files export identical).

## Editor shell convention
Panel sections follow layer order: 배경 → MD 캐릭터 → 칵테일 카드 → SD → 영수증,
with 저장 / 불러오기 / PNG 내보내기 in a sticky footer and sheet info in a status bar.
All shell colors/sizes are CSS custom properties in :root.

## Deliberately not implemented yet
Next: decoration polish (post-Phase-5 outline).

## Claude re-review focus
1. `assets.js`: registry lifecycle, decoded cache, JSON hydration.
2. `renderer.js`: stale-render guard and scaled preview/native export shared pipeline.
3. `state.js`: binaries absent from state; normalized sheet-layout convention.
4. `project-io.js`: serialization isolation + migration hook.
5. `app.js`: Korean UI, reduced ratio, Unicode filename, dirty state, preview scaling.
6. Confirm Phase 1 remains within Spec v2 scope.

## 내 패턴(폴더) 추가하는 법
1. `assets/backgrounds` 폴더에 투명 PNG를 넣어요 (4000×3000px 권장).
2. `assets/backgrounds/patterns.json`의 목록에 한 줄 추가해요.
   `{ "file": "파일이름.png", "name": "목록에 보일 이름" }` (줄 사이에 쉼표 필수)
3. 사이트에서 패턴 옆 ↻ 버튼을 눌러요.

## 코스터 추가하는 법
1. `assets/coasters` 폴더에 투명 PNG를 넣어요.
2. `assets/coasters/coasters.json` 목록에 `{ "file": "파일이름.png", "name": "목록에 보일 이름" }`을 추가해요.
3. 사이트에서 코스터 옆 ↻ 버튼을 눌러요.
