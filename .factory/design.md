# Reading Resume visual system

## Direction and rationale

**Luminous glass data landscape.** Reading can feel like moving through a dense field, while a saved sentence is a trustworthy coordinate. The interface turns that idea into a quiet night landscape: ink-blue depth, translucent reading planes, and one warm citron “place light.” The effect is spatial and specific without competing with page text. The extension itself uses the same tokens more sparingly so the reader’s article remains primary.

The central interaction grammar is **mark → orient → continue**. A small bookmark-shaped control marks the current sentence, a stable horizontal strip makes the sentence legible, and a fine progress rail carries the eye forward. Glass is used only for controls that float above another page or plane; ordinary content is not boxed by default.

## Palette

| Token | Dark / extension | Light | Purpose |
| --- | --- | --- | --- |
| Night | `#07151A` | `#F1F7F4` | Page background |
| Deep current | `#0C252B` | `#E4F0EC` | Recessed surface |
| Glass | `rgba(19, 53, 59, .78)` | `rgba(255, 255, 255, .82)` | Floating surface |
| Paper | `#F4F5EA` | `#10272B` | Primary text |
| Mist | `#B7CBC7` | `#496561` | Secondary text |
| Place light | `#D7F36A` | `#496600` | Primary action / saved anchor |
| Tide | `#63D8CF` | `#08756E` | Links / progress / focus |
| Amber | `#FFC66D` | `#865100` | Caution / offline |
| Coral | `#FF8E83` | `#A12B29` | Error / destructive state |
| Success | `#83E5B2` | `#196B49` | Confirmed state |

All body text and interactive states meet WCAG AA against their intended backgrounds. Color is always paired with an icon, label, or status sentence.

## Typography

- **Long-form and display:** `Georgia`, `Charter`, `Cambria`, serif. The familiar open shapes and differentiated letterforms fit sustained reading without claiming a medical benefit.
- **Interface:** `Atkinson Hyperlegible`, locally self-hosted, falling back to `Verdana`, `Arial`, sans-serif. It is used for short controls, status, and numerals. The font is SIL OFL-licensed and included in the repository (54 KB, below the font budget).
- Scale: 14, 16, 18, 22, 32, 52 px. Body never drops below 16 px; the in-page strip defaults to 20 px with 1.65 leading. Reading line length stays between 45 and 72 characters where controllable.

## Space, shape, and depth

- 4 px base rhythm, most gaps 8 / 12 / 16 / 24 / 32 / 48 / 72 px.
- Controls are at least 44 × 44 px. Corners are 10 px for controls and 20–28 px for floating planes.
- Borders use cool translucent whites in dark mode and deep-teal translucency in light mode.
- Shadows are broad and low-opacity, paired with a one-pixel inner highlight. Blur never carries essential contrast.
- At 390 px, secondary navigation condenses, feature pairs stack, and decorative landscape layers are cropped. The reading strip stacks its actions without covering the sentence.

## Motion policy

Controls respond in 160 ms; the saved coordinate settles in 240 ms with transform and opacity only. The strip enters from the lower edge because it belongs to the current viewport. There are no looping animations. Under `prefers-reduced-motion: reduce`, all translations and smooth scrolling become instant, while opacity/state changes remain.

## Original asset plan and prompt sheet

One generated hero landscape explains the product metaphor: a single warm sentence coordinate persisting through a dark translucent field. Hand-authored SVG icons cover functional controls because they must remain precise at small sizes.

**Shared art direction prompt:**

> Use case: stylized-concept. Asset type: wide landing-page hero illustration. Primary request: an abstract luminous glass data landscape representing a reader reliably returning to one exact sentence after interruption. Scene: layered translucent horizontal reading planes receding into an ink-blue nocturnal field, with one warm citron marker illuminating a precise line and a delicate turquoise route reconnecting to it. Style: refined editorial 3D illustration, frosted glass, subtle grain, soft refraction, tactile but not glossy corporate stock art. Composition: wide 3:2 frame, main marker in the right-center, quiet negative space on the left for page copy, no interface screenshot. Lighting: low-key bioluminescent edge light, calm and reassuring. Palette: deep ink teal, sea-glass turquoise, pale paper, citron. Avoid: people, hands, brains, medical symbols, books with fake writing, legible text, logos, brands, gradients as empty decoration, excessive bloom, watermark. No text, no watermark, no logos.

### Provenance

- `assets/src/reading-coordinate.png` and optimized derivatives: generated 2026-08-28 with the factory Azure image deployment (`factory-image`) using the prompt above. Original to Reading Resume; no third-party source material.
- `site/public/fonts/atkinson-hyperlegible-regular.ttf`: Atkinson Hyperlegible, Copyright 2020 Braille Institute of America, SIL Open Font License 1.1; source: Google Fonts repository.
- Functional icons are original inline SVG paths authored for this product.

## Imagery acceptance criteria

The selected image must contain no accidental text, symbols, seams, human anatomy, third-party marks, or misleading UI. The warm marker must remain obvious at small mobile crops, and the background must leave sufficient quiet space for readable HTML copy.
