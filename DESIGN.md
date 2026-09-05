# DESIGN.md — Editorial Technology Journal Design System

## 1. Visual Direction: Editorial Technology Journal

The design aesthetic represents an **Editorial Technology Journal** — a calm, intelligent, highly readable publication built for software engineers. It prioritizes clarity of thought, typographic precision, and generous whitespace over flashy marketing gimmicks.

### Aesthetic Values
- **Editorial & Restrained:** Resembles a physical technical monograph or scholarly engineering journal.
- **Calm & Focused:** Zero distracting background animations, zero neon gradients, zero decorative blobs.
- **Distinctive & Intentional:** Clean hairline rules, subtle warm tinting in light mode, deep charcoal in dark mode, crisp typography.
- **Safari iOS First:** Prioritizes touch comfort, finger-friendly hit areas, and zero mobile scroll glitches.

### Strict Anti-Patterns Avoided
- Generic SaaS hero banners with floating 3D spheres or gradient blobs.
- Excessive glassmorphism (`backdrop-blur` slapped onto standard scrolling body elements).
- Monotonous card grids with identical soft drop shadows.
- Loud pill buttons with pulsing glow effects.
- Hover-only action reveals (actions must be touch-accessible).

---

## 2. Color Palette & Theming

The system uses custom CSS variables that adapt automatically to Light, Dark, or System mode, persisted via `localStorage` and `color-scheme`.

### Core Palette Tokens

```css
/* Light Mode (Calm Warm Editorial Paper) */
--bg-primary: #fcfbf9;         /* Warm archival white */
--bg-secondary: #f4f2ec;       /* Soft linen tinted secondary */
--bg-tertiary: #ebe7de;        /* Muted stone container */
--border-subtle: #e2ded4;      /* Hairline rule */
--border-strong: #c8c2b4;      /* Prominent divider */
--text-primary: #191817;       /* Deep near-black ink */
--text-secondary: #5c5852;     /* Editorial secondary charcoal */
--text-muted: #8c867d;         /* Caption & footnote grey */
--accent: #2e4a62;             /* Archival slate indigo */
--accent-subtle: #eaf0f5;      /* Slate tint highlight */
--code-bg: #f3f1ea;            /* Inset code block background */

/* Dark Mode (Quiet Midnight Charcoal) */
--bg-primary: #121314;         /* Matte obsidian */
--bg-secondary: #1a1c1e;       /* Deep graphite layer */
--bg-tertiary: #242629;        /* Raised card background */
--border-subtle: #2b2e32;      /* Hairline edge */
--border-strong: #3e4247;      /* Clear boundary */
--text-primary: #edece9;       /* Crisp warm white text */
--text-secondary: #a8a49c;     /* Reading secondary */
--text-muted: #6e6b65;         /* Metadata tone */
--accent: #78a2c2;             /* Muted cerulean accent */
--accent-subtle: #1c2630;      /* Slate dark tint */
--code-bg: #18191b;            /* Code block inset */
```

---

## 3. Typography Hierarchy

Typographic harmony supports both English and Vietnamese diacritics (`â, ă, đ, ê, ô, ơ, ư`) seamlessly across iOS and desktop:

- **Display & Article Headings:** Serifs with balanced modern proportions:
  `Newsreader, Georgia, "Times New Roman", serif`
- **Body & Editorial Reading:** Highly legible editorial serif/sans blend:
  `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
- **Technical & Code Blocks:** Dedicated monospaced typeface with tabular numerals:
  `ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", Menlo, monospace`

### Scale & Rules
- **Line Length:** Kept strictly below 75 characters (`max-w-prose` / `max-w-3xl`) for comfortable reading.
- **Line Height:** Generous line spacing (`leading-relaxed` to `leading-8` on prose) for long-form comfort.
- **Single H1:** Exactly one page-level `<h1>` per article page.
- **Headings Anchors:** Subtle anchor glyph `#` accessible by tap/click with `scroll-margin-top: 5rem`.

---

## 4. Safari iOS-First Architecture & Micro-Interactions

1. **Touch Targets (≥ 44×44 CSS px):**
   - Navigation links, theme switchers, TOC toggle buttons, code copy buttons, and publisher actions satisfy the Apple Human Interface Guidelines touch target minimum.
2. **Form Inputs (≥ 16px font size):**
   - Prevents Mobile Safari from forcibly zooming the viewport when focusing any input or textarea.
3. **Viewport Resilience (`100dvh`):**
   - Dynamic viewport sizing respects Safari's expanding and collapsing bottom navigation bar and address bar.
4. **Safe Area Insets:**
   - Headers and sticky bars apply `padding-top: max(1rem, env(safe-area-inset-top))` and `padding-bottom: max(1rem, env(safe-area-inset-bottom))`.
5. **Horizontal Scroll Containment:**
   - Pre-formatted code blocks (`<pre>`) and markdown tables (`<table>`) are encased inside dedicated scroll containers with `-webkit-overflow-scrolling: touch; overflow-x: auto;`. The main document body has `overflow-x: hidden;` preventing side-scrolling.
6. **Virtual Keyboard Handling:**
   - Publisher mode utilizes native document scrolling rather than fixed bottom actions that collide with virtual keyboards.

---

## 5. Components & Layouts

### Public Layout
- **Header:** Lightweight editorial header with site moniker, navigation links (Journal, Research, Notes, Tags), and touch-friendly theme switcher.
- **Home View:** Journal index featuring editorial headline, latest research entries with badge categorization, quick notes, and topic tag pills.
- **Article Reader:** Focused header (Type · Date · Reading Time), title, description, expandable "On this page" TOC for mobile / sticky sidebar for desktop, rich markdown body, sources/references list.

### Publisher Layout
- **Mobile (< 768px):** Sequential tabbed flow `[Edit] [Preview]` with full-screen textarea, dedicated metadata panel, real-time Article Health validation report, and large primary Publish button.
- **Desktop (≥ 768px):** Side-by-side split screen with real-time synchronized preview.

---

## 6. Motion & Accessibility

- **Transitions:** Deliberate, subtle transitions (`150ms-250ms ease-out`). No bouncy or dizzying page transitions.
- **Reduced Motion:** Fully honors `@media (prefers-reduced-motion: reduce)` by removing animations and transitions.
- **Selection & Copy:** Native `user-select: text` preserved throughout; one-tap copy button for code blocks and published links with instant feedback (`Copied!`).
