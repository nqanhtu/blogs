# Personal Markdown Research Publisher

A lightweight, Safari iOS-first publishing application designed for engineers who research technical topics with ChatGPT / Deep Research and want to turn high-quality findings into beautiful, professional, shareable articles with near-zero manual formatting work.

```text
ChatGPT / Deep Research
        ↓
Copy Markdown
        ↓
Paste into Publisher
        ↓
Automatic parsing + normalization
        ↓
Preview & Article Health
        ↓
Publish
        ↓
Receive a public URL (one-tap copy)
        ↓
Share with others
```

---

## Core Product Principle

```text
ChatGPT owns CONTENT.
The website owns PRESENTATION.
Markdown remains the canonical source of truth.
```

---

## Key Architectural Boundaries

```text
┌───────────────────────────────┐
│   ChatGPT / Deep Research    │
└──────────────┬────────────────┘
               │ Copy & Paste
               ▼
┌───────────────────────────────┐
│       Markdown Pipeline       │
│  - normalizeMarkdown()        │
│  - extractFirstH1()           │
│  - validateArticle() (Health) │
│  - detectChatGPTCitations()   │
│  - generateSlug() (VN-aware)  │
│  - calculateReadingTime()     │
└──────────────┬────────────────┘
               │ Canonical Markdown
               ▼
┌───────────────────────────────┐
│      ContentRepository        │
│  ├── LocalFileContentRepo     │  (Development / Testing)
│  └── GitHubContentRepo        │  (Production GitHub Contents API)
└──────────────┬────────────────┘
               │ Immediate Server Read
               ▼
┌───────────────────────────────┐
│        TanStack Start         │
│  - Server Functions & SSR     │
│  - TanStack Router            │
│  - TanStack Markdown + AST    │
│  - TanStack Highlight         │
│  - Editorial Presentation     │
└───────────────────────────────┘
```

---

## Safari iOS-First Engineering

Every interface decision is engineered specifically for **iPhone + Mobile Safari**:

1. **Touch Targets (≥ 44×44 CSS px):**
   Navigation links, theme switches, copy buttons, TOC toggles, and publisher controls meet Apple Human Interface Guidelines for touch accuracy.
2. **Zero Input Zoom (≥ 16px Font Size):**
   All inputs, textareas, and selects enforce `font-size: 16px` to prevent Safari from forcibly zooming the viewport on focus. User-scalable accessibility is fully preserved.
3. **Dynamic Viewport (`100dvh`):**
   Adapts seamlessly to Mobile Safari's expanding and collapsing bottom address bars without jumping or clipped controls.
4. **Safe Area Insets:**
   Edge-bound elements (fixed/sticky header and footer) apply `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
5. **Horizontal Scroll Containment:**
   Code blocks and tables scroll horizontally inside dedicated containers (`-webkit-overflow-scrolling: touch;`). Page-level horizontal overflow is strictly disabled.
6. **Virtual Keyboard Resilience:**
   Publisher relies on natural document flow rather than fixed bottom sheets that get trapped behind iOS virtual keyboards.

---

## Information Architecture

- `/` — Editorial Journal home (filtered by All, Research, Notes, and Topic tags)
- `/articles/$slug` — Public article reading surface with single page H1, expandable mobile TOC / sticky desktop TOC, syntax-highlighted code blocks with copy buttons, and horizontally scrollable tables
- `/tags/$tag` — Topic-filtered index
- `/admin/login` — Single-user password authentication with secure HttpOnly cookies
- `/admin` — Touch-friendly article management dashboard
- `/admin/new` — Markdown research publisher with split desktop preview and tabbed mobile flow
- `/admin/edit/$slug` — Canonical article editor preserving publication timestamps
- `/feed.xml` — Valid RSS 2.0 feed
- `/sitemap.xml` — XML sitemap for search engines
- `/robots.txt` — Crawler directives protecting private admin routes

---

## Content Contract (Frontmatter Schema)

Articles are stored as canonical Markdown files in `content/articles/{slug}.md`:

```markdown
---
title: Docker Images, Containers and Volumes — A Mental Model
slug: docker-images-containers-and-volumes-a-mental-model
description: A practical, layer-oriented mental model for understanding Docker.
type: research
tags:
  - docker
  - devops
  - infrastructure
publishedAt: "2026-09-01"
updatedAt: "2026-09-05"
---

Body content begins here without an H1...
```

*Note: Any top-level `# Title` pasted into the publisher is automatically extracted into the metadata title and stripped from the canonical body, guaranteeing exactly one `<h1>` per page.*

---

## Local Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Set Up Admin Password
To generate a custom password hash:
```bash
pnpm admin:hash-password my-secret-password
```
Copy the output hash and set it in `.env`:
```env
ADMIN_PASSWORD_HASH=<hash>:<salt>
SESSION_SECRET=<random-32-char-secret>
```

*Default development password:* `admin` (pre-configured in `.env.example`).

### 4. Run Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

---

## Production Deployment (Vercel)

1. Connect your repository to Vercel.
2. Configure Environment Variables in the Vercel Project Settings:
   ```env
   CONTENT_REPOSITORY=github
   GITHUB_TOKEN=ghp_yourPersonalAccessToken
   GITHUB_OWNER=your-github-username
   GITHUB_REPO=your-content-repo
   GITHUB_BRANCH=main
   GITHUB_CONTENT_DIRECTORY=content/articles
   PUBLIC_SITE_URL=https://your-domain.com
   ADMIN_PASSWORD_HASH=<hash>:<salt>
   SESSION_SECRET=<secret>
   ```
3. Build Command: `pnpm build`
4. Output Directory: `.output` (automatically detected by Nitro/TanStack Start).

---

## Verification & Testing

Run all static checks and automated tests:
```bash
# Run type checking
pnpm typecheck

# Run unit and integration tests
pnpm test

# Run all verification checks
pnpm check

# Build production artifacts
pnpm build
```

> [!NOTE]
> Automated E2E/browser test suites (Playwright, Cypress) are intentionally not included in this project. Final end-to-end acceptance is performed manually on real devices following [`docs/UAT.md`](docs/UAT.md).
