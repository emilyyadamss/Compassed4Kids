---
version: alpha
name: Penumbra
description: A clean, minimal dark design system built around fine hairline borders, atmospheric surfaces, and an editorial serif-meets-grotesk type pairing.
colors:
  primary: "#E8E5DC"
  primary-hover: "#FFFFFF"
  on-primary: "#08080A"
  secondary: "#9BA0AB"
  tertiary: "#5C6068"
  neutral: "#F4F4F5"
  background: "#08080A"
  surface: "#101013"
  surface-inset: "#17171C"
  surface-raised: "#1B1B21"
  on-surface: "#F4F4F5"
  on-surface-muted: "#9BA0AB"
  border: "#23232A"
  border-strong: "#2E2E36"
  focus: "#E8E5DC"
  error: "#E47C7C"
typography:
  font-display: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif"
  font-ui: "'Inter', 'Helvetica Neue', Arial, sans-serif"
  font-mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace"
  display-xl:
    family: "{typography.font-display}"
    size: "72px"
    weight: 400
    line-height: 1.02
    tracking: "-0.02em"
  display-lg:
    family: "{typography.font-display}"
    size: "56px"
    weight: 400
    line-height: 1.05
    tracking: "-0.02em"
  headline-lg:
    family: "{typography.font-display}"
    size: "40px"
    weight: 400
    line-height: 1.1
    tracking: "-0.01em"
  headline-md:
    family: "{typography.font-display}"
    size: "28px"
    weight: 400
    line-height: 1.15
    tracking: "-0.01em"
  title-md:
    family: "{typography.font-ui}"
    size: "18px"
    weight: 600
    line-height: 1.35
    tracking: "-0.005em"
  body-md:
    family: "{typography.font-ui}"
    size: "15px"
    weight: 400
    line-height: 1.55
    tracking: "0em"
  body-sm:
    family: "{typography.font-ui}"
    size: "13px"
    weight: 400
    line-height: 1.5
    tracking: "0em"
  label-sm:
    family: "{typography.font-ui}"
    size: "12px"
    weight: 500
    line-height: 1.3
    tracking: "0.02em"
  eyebrow:
    family: "{typography.font-ui}"
    size: "11px"
    weight: 500
    line-height: 1.2
    tracking: "0.16em"
    transform: uppercase
  mono-sm:
    family: "{typography.font-mono}"
    size: "12px"
    weight: 400
    line-height: 1.45
rounded:
  none: "0px"
  xs: "2px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
  "4xl": "72px"
  gutter: "24px"
  section: "96px"
borders:
  hairline: "1px solid {colors.border}"
  strong: "1px solid {colors.border-strong}"
  focus-ring: "1px solid {colors.focus}"
elevation:
  flat: "none"
  inset-highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
  raised: "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 30px rgba(0, 0, 0, 0.45)"
  glow: "0 0 0 6px rgba(232, 229, 220, 0.08)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "10px 18px"
    height: "40px"
    border: "1px solid rgba(255, 255, 255, 0.12)"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    elevation: "{elevation.glow}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "10px 18px"
    height: "40px"
    border: "{borders.hairline}"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    border: "{borders.strong}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
    border: "1px solid transparent"
  input-field:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    height: "40px"
    border: "{borders.hairline}"
  input-field-focus:
    border: "{borders.focus-ring}"
    elevation: "{elevation.glow}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
    border: "{borders.hairline}"
  card-signature:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
    border: "{borders.hairline}"
    elevation: "{elevation.inset-highlight}"
  checkbox:
    backgroundColor: "{colors.surface-inset}"
    rounded: "{rounded.xs}"
    size: "16px"
    border: "{borders.hairline}"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border: "1px solid {colors.primary}"
  tabs-base:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-sm}"
    padding: "10px 4px"
    border: "1px solid transparent"
  tabs-active:
    textColor: "{colors.on-surface}"
    border: "1px solid {colors.on-surface}"
---

## Overview

Penumbra is a quiet, editorial dark interface system. It treats the screen like a clouded night sky: a single onyx surface, three soft elevation tiers, hairline borders, and one warm-white accent that does all of the highlighting. A modern serif display sits above a precise grotesk to give every layout an editorial calm without giving up density or clarity.

The system is intentionally restrained. There is no chromatic accent, no decorative gradient, and no drop shadow that is not load-bearing. Hierarchy is built from value, type, and negative space — never from color saturation. The result is a framework-agnostic toolkit that ships well-formed semantic HTML, copyable CSS classes, and a single signature surface that carries the visual mood.

## Colors

The palette is monochromatic by design. Surfaces step up in lightness by roughly six percent at each tier, which keeps the page legible at low ambient brightness without crushing detail.

| Token | Hex | Role |
| --- | --- | --- |
| `background` | `#08080A` | Obsidian page and root surface |
| `surface` | `#101013` | Graphite cards and panels |
| `surface-inset` | `#17171C` | Slate inputs, code, recessed regions |
| `surface-raised` | `#1B1B21` | Floating menus and hover states |
| `border` | `#23232A` | Default 1px hairline rule |
| `border-strong` | `#2E2E36` | Emphasis border for focus and hover |
| `on-surface` | `#F4F4F5` | Vellum primary text and high-contrast foreground |
| `on-surface-muted` | `#9BA0AB` | Moonstone secondary text |
| `tertiary` | `#5C6068` | Muted helper text and disabled controls |
| `primary` | `#E8E5DC` | Beacon warm-white accent for actions and focus |
| `on-primary` | `#08080A` | Text/icon color on the warm-white accent |
| `error` | `#E47C7C` | Reserved for inline validation only |

Accessibility: `on-surface` on `background` clears 19:1, and `on-surface-muted` clears 5.6:1, exceeding WCAG AA for body text. The `primary` accent on `background` clears 14:1, and `on-primary` on `primary` clears 14.9:1 for buttons.

## Typography

Three families work together: Instrument Serif for display, Inter for the entire UI surface, and JetBrains Mono for code and identifiers. Display sizes are large and lightly tracked so the serif can breathe; UI levels stay tight and even so dense layouts remain scannable.

- Display headlines mix roman with optional italic for emphasis.
- The eyebrow style uses uppercase Inter with 0.16em tracking and sits above headlines or atop cards.
- Body copy targets 15px / 1.55 line-height as the default reading rhythm.
- Mono is reserved for code, kbd, and tabular metadata so typographic texture stays distinctive.

Refer to the typography front matter for the full type scale. Each entry exposes family, size, weight, line-height, and tracking so downstream tooling can rebuild the scale without reading prose.

## Layout

Penumbra is built on a 4px base unit. The spacing scale grows geometrically — `4, 8, 12, 16, 24, 32, 48, 72` — and a dedicated `gutter` (24px) and `section` (96px) token govern grid rhythm and page sectioning.

- Cards use 24px (`spacing.xl`) of internal padding by default and 32px (`spacing.2xl`) for signature surfaces.
- Form controls use 10–14px of internal padding to keep a fixed 40px control height across buttons, inputs, and selects.
- Page gutters sit at 24px on mobile, opening to a centered 1120px max-width on desktop. The page never exceeds 1200px wide so line-length remains comfortable.
- Section gaps default to 96px to give serif headlines the room they need to read as display copy.

## Elevation & Depth

The system is intentionally flat. Cards lift off the page using a single surface step plus a hairline border — not a drop shadow.

- `elevation.flat` is the default for static surfaces.
- `elevation.inset-highlight` adds a 1px top-edge highlight to give pill buttons and signature cards a faint tactile lip.
- `elevation.raised` is reserved for floating menus, dialogs, and the primary CTA. It combines the inset highlight with a soft, low-opacity drop shadow.
- `elevation.glow` is an accent-colored ring at 8% opacity, applied only on hover of the primary CTA and on focused inputs.

There are no colored or saturated shadows anywhere in the system.

## Shapes

Penumbra uses a small, deliberate radius scale: `2, 6, 10, 14, 20, 999`. Each value has a specific job:

- `xs (2px)` — checkboxes, badges, micro-controls.
- `sm (6px)` — inputs, selects, segmented controls.
- `md (10px)` — standard cards and panels.
- `lg (14px)` — signature surfaces and modal dialogs.
- `xl (20px)` — hero illustration containers only.
- `full (999px)` — pill buttons, tag chips, avatars.

Border weight never exceeds 1px. The system relies on color value, not stroke weight, to express emphasis.

## Components

All components extend the same vocabulary: hairline border, single accent, pill or 6/10px radius, and Inter for any UI label.

- **Button.** Pill-shaped (999px radius), 40px tall. Primary uses the warm-white `primary` token with onyx text and a subtle white inset highlight. Secondary is transparent with a hairline border. Ghost drops the border entirely and is reserved for tertiary actions. Hover swaps to `primary-hover` and adds the accent glow.
- **Input.** 40px tall, 6px radius, slate-filled with a hairline border. Placeholder uses `on-surface-muted`. Focus replaces the hairline with the warm-white focus ring and adds an accent glow at 8% opacity.
- **Card.** Graphite surface at 10px radius with a hairline border and 24px padding. Eyebrow labels (uppercase Inter, 0.16em tracking) live above the title.
- **Checkbox.** 16px square with 2px radius and a hairline border. Checked state inverts to the warm-white fill and uses a 12px onyx tick icon.
- **Tabs.** Underline tabs on a hairline base rule. Inactive uses `on-surface-muted`; active is promoted to `on-surface` with a 1px warm-white underline that hugs the label.
- **Atmosphere Card.** The signature element. A graphite card with a centered concentric dot medallion (built with a radial-gradient mask over a CSS dot grid) layered over a softly clouded radial vignette. Used for hero panels, empty states, and feature highlights.
- **Icons.** Lucide ([lucide.dev](https://lucide.dev/), ISC license). All glyphs are rendered as 1.5px outline icons in `currentColor` so they inherit the vellum and moonstone text tokens cleanly. Buttons, inputs, tabs, and cards use Lucide for any pictograms.

## Do's and Don'ts

- Do let negative space carry the layout. The system is designed for generous gutters and tall section breaks.
- Do pair Instrument Serif display copy with Inter body copy. Reach for italics, not size, when a serif word needs more weight.
- Do reuse the warm-white `primary` for the single primary action on a screen and nothing else.
- Do keep all borders at 1px. Use `border-strong` to imply emphasis instead of doubling stroke weight.
- Do not introduce saturated brand color, gradients, or duotone accents. Penumbra has no chromatic accent on purpose.
- Do not stack drop shadows. Use the surface tier system to imply elevation; reserve `elevation.raised` for floating UI only.
- Do not mix icon libraries. The system uses Lucide exclusively to keep stroke weight and corner radius consistent.
- Do not use the Atmosphere Card as decoration. It is a load-bearing brand surface and should appear at most twice per page.
