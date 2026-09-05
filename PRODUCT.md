# PRODUCT.md — Personal Markdown Research Publisher

## 1. Product Overview & Primary User

**Product:** Personal Markdown Research Publisher  
**Primary User:** A software engineer who frequently performs technical research using ChatGPT / Deep Research and wants to turn high-quality research outputs into beautiful, readable, easily shareable web articles with near-zero manual formatting effort.

## 2. Core Problem

When engineers use ChatGPT for technical research (mental models, architecture breakdowns, debugging notes, framework deep-dives), the resulting Markdown content is rich and structured, but sharing raw text or screenshots lacks professional presentation, typography, code syntax highlighting, table readability, and mobile responsiveness.

Existing tools fail this workflow:
- **Traditional CMSs (WordPress, Strapi, Ghost, Notion):** Over-engineered with media libraries, WYSIWYG editors that mutilate markdown indentation, user permissions, and slow database-backed dashboards.
- **Static Site Generators (Hugo, Astro, Next.js Contentlayer):** Require local Git cloning, creating branch commits, opening an IDE, running build pipelines, and waiting for CI/CD just to publish a quick note from an iPhone.
- **Copy-Pasting to Medium / Substack:** Loses code formatting, mangles technical tables, introduces distracting popups, paywalls, and cookie banners.

## 3. The Core Workflow

```text
ChatGPT / Deep Research
        ↓
Copy Markdown
        ↓
Paste into Publisher
        ↓
Automatic parsing + normalization
        ↓
Preview & Article Health check
        ↓
Publish
        ↓
Receive a public URL (instant copy)
        ↓
Share with colleagues & community
```

## 4. Product Principles

1. **ChatGPT owns CONTENT. The website owns PRESENTATION.**
   The publisher never tries to alter the technical thoughts or rewrite code blocks. The website applies rigorous typographic scales, code block syntax highlighting with copy buttons, horizontal scroll containment for mobile tables, and structured article layouts.

2. **Markdown remains the canonical source of truth.**
   Content is stored as clean, portable canonical Markdown files with structured YAML frontmatter (`content/articles/{slug}.md`). The AST is only a derived compilation target, never the canonical store.

3. **Safari iOS First.**
   Every surface is built for touch targets (≥44px), zero accidental mobile input zoom (≥16px form controls), dynamic viewport handling (`100dvh`), keyboard visibility resilience, and zero horizontal page overflow.

4. **Instant Public Reads.**
   Publishing to GitHub or local storage is read immediately by the server runtime without waiting for a static rebuild or redeployment.

## 5. Public and Private Surfaces

### Public Surface
- **Home / Journal (`/`):** Clean editorial journal listing latest research articles and quick notes, categorized by type, with topic tags and reading time.
- **Article Reader (`/articles/$slug`):** High-craft reading surface with typography tuned for English & Vietnamese, single H1 hierarchy, sticky desktop TOC & expandable mobile TOC, interactive code blocks with syntax highlighting and copy, horizontally scrollable tables, and blockquote callouts.
- **Tag Filter (`/tags/$tag`):** Topic-filtered index of published work.
- **Syndication & SEO (`/feed.xml`, `/sitemap.xml`, `/robots.txt`):** Structured metadata, Open Graph cards, RSS 2.0 feed, and search engine directives.

### Private Surface
- **Authentication (`/admin/login`):** Single-user password authentication, server-verified PBKDF2/HMAC hash, HttpOnly secure cookies.
- **Article Dashboard (`/admin`):** Touch-friendly list of articles with publication status, tags, quick edit, and view links.
- **Publisher (`/admin/new`):** Touch-first interface for pasting ChatGPT markdown, live normalization, metadata extraction, Article Health validation, instant preview toggle, and one-tap publishing.
- **Editor (`/admin/edit/$slug`):** Edit existing canonical markdown while preserving publication timestamps and recording update times.
- **Unpublish Action:** Ability to remove an article with confirmation, returning clean 404s.

## 6. Non-Goals (Out of Scope for v1)
- Multi-user accounts, registration, role-based access control.
- Heavy WYSIWYG or rich-text block editors (canonical markdown textarea is intentional).
- Relational databases (Postgres, MySQL, Supabase, Prisma) or external headless CMSs.
- Interactive user comments, likes, reactions, or analytics trackers.
- Asset/media upload buckets (remote Markdown images are sufficient).
- Automated E2E/browser test suites (manual user acceptance testing is preferred).

## 7. Information Architecture

```text
/                      → Editorial journal home
/articles/$slug        → Published article reader
/tags/$tag             → Topic tag archive
/admin/login           → Admin authentication
/admin                 → Article dashboard
/admin/new             → Markdown publisher (paste & publish)
/admin/edit/$slug      → Article editor
/feed.xml              → RSS 2.0 feed
/sitemap.xml           → XML sitemap for SEO
/robots.txt            → Web crawler directives
```
