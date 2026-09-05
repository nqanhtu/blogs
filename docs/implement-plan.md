# IMPLEMENTATION PLAN — PERSONAL MARKDOWN RESEARCH PUBLISHER

You are responsible for implementing this project end-to-end in one autonomous execution.

Do not stop after scaffolding or after the main feature appears to work.

Your job is complete only when the application is implemented, visually polished, statically verified, unit/integration tested, production-buildable, documented, and ready for user acceptance testing.

The user will perform final functional UAT manually.

Do NOT create or maintain automated E2E/browser test suites for this project.

---

# 0. Product Goal

Build a personal publishing application optimized for this workflow:

```text
ChatGPT / Deep Research
        ↓
Copy Markdown
        ↓
Paste into Publisher
        ↓
Automatic parsing + normalization
        ↓
Preview
        ↓
Publish
        ↓
Receive a public URL
        ↓
Share with others
```

The product is NOT a traditional CMS.

It is a lightweight **Markdown Research Publisher**.

The primary user is a software engineer who frequently researches technical topics with ChatGPT and wants to turn high-quality research into beautiful, professional, shareable articles with almost no manual formatting work.

The application has two surfaces:

```text
PUBLIC
- Home / journal
- Research articles
- Notes
- Tags
- Reading experience
- SEO/social sharing

PRIVATE
- Login
- Paste Markdown
- Preview
- Article validation
- Metadata
- Publish
- Edit
- Unpublish
```

Core product principle:

```text
ChatGPT owns CONTENT.
The website owns PRESENTATION.
Markdown remains the canonical source of truth.
```

---

# 1. Primary Platform Constraint: Safari iOS First

This application must be designed **Safari iOS-first**.

This is not equivalent to generic responsive design or mobile-first CSS.

The primary UX target is:

```text
iPhone
+
Safari
+
touch input
+
small viewport
+
dynamic browser chrome
+
virtual keyboard
```

Priority order:

```text
1. Safari on current iPhone-sized viewports
2. Other modern mobile browsers
3. Safari desktop
4. Chrome / Edge / Firefox desktop
```

Desktop must still be excellent, but desktop convenience must never compromise iPhone Safari usability.

Every major UI decision must first answer:

> Does this work comfortably on an iPhone in Safari?

---

# 2. Mandatory iOS Safari UX Rules

Apply these rules throughout the application.

## 2.1 Touch-first interactions

All important actions must work with touch.

Never require hover.

Hover may enhance desktop UX, but must not expose functionality that is otherwise inaccessible.

Interactive targets should generally be at least approximately:

```text
44 × 44 CSS px
```

especially for:

- navigation
- theme toggle
- copy buttons
- publish
- editor controls
- dialogs
- dropdown triggers
- TOC controls
- destructive actions

Avoid tightly packed icon buttons.

---

## 2.2 Prevent iOS input zoom

Text inputs, textarea controls and editable fields intended for normal use on iPhone must use an effective font size of at least:

```text
16px
```

Do NOT solve iOS zoom by disabling user scaling in the viewport meta tag.

Users must remain able to zoom the page for accessibility.

---

## 2.3 Viewport handling

Do not rely blindly on:

```css
height: 100vh;
```

for full-screen mobile layouts.

Prefer current dynamic viewport units where appropriate:

```css
100dvh
```

and use fallbacks if necessary.

Take Safari's collapsing/expanding address and toolbar areas into account.

The publisher must not jump, clip controls, or create inaccessible content when browser chrome changes size.

---

## 2.4 Safe areas

Support iPhone safe areas where relevant.

Use environment variables such as:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

where fixed/sticky edge UI would otherwise conflict with:

- Dynamic Island
- rounded screen edges
- home indicator

Do not add arbitrary safe-area padding everywhere.

Use it deliberately on edge-bound interface elements.

---

## 2.5 Virtual keyboard

The private Publisher is especially sensitive to the iOS virtual keyboard.

When editing Markdown or metadata:

- focused fields must remain visible
- publish controls must remain reachable
- layout must not become permanently offset
- closing the keyboard must restore layout correctly
- no fixed footer should become trapped behind the keyboard
- modal/dialog content must remain usable

Avoid fragile assumptions about viewport height while the keyboard is open.

---

## 2.6 Sticky and fixed UI

Use `position: fixed` sparingly on mobile Safari.

Prefer normal document flow or sticky positioning where practical.

Any sticky/fixed element must be checked for:

- browser toolbar interaction
- safe areas
- keyboard overlap
- nested scroll container behavior
- z-index conflicts

---

## 2.7 Scroll architecture

Avoid unnecessary nested vertical scrolling regions on mobile.

Primary preference:

```text
one page
one main vertical scroll
```

Horizontal scrolling is acceptable specifically for:

```text
code blocks
tables
```

Do not create accidental horizontal page overflow.

The page itself must never scroll sideways.

---

## 2.8 Overscroll

Do not introduce custom scroll physics or scroll hijacking.

Avoid brittle overscroll tricks.

Native Safari scrolling behavior should be preserved unless there is a compelling UX reason otherwise.

---

## 2.9 Gestures

Do not depend on:

- swipe-only controls
- long-press-only controls
- drag-only interfaces

If gestures are added as enhancement, an obvious tap-based equivalent must exist.

---

## 2.10 Selection and copy

Article text and code must remain selectable.

Do not globally disable:

```css
user-select
```

Users should be able to:

- select article text
- copy code
- copy URLs
- use Safari's native selection tools

---

# 3. Mandatory Autonomous Behavior

Do not ask the user implementation questions unless progress is literally impossible without information that cannot be inferred.

Make reasonable senior-engineering decisions yourself.

If external credentials such as GitHub tokens are unavailable:

1. Implement the complete integration.
2. Provide `.env.example`.
3. Use the local filesystem repository adapter for development.
4. Test the GitHub adapter using unit/integration mocks.
5. Ensure the application runs locally without external credentials.
6. Clearly document final credential setup required for production.

Do not use missing credentials as a reason to leave the application incomplete.

Do not leave:

- TODO implementations
- placeholder screens
- broken routes
- fake buttons
- console errors visible during normal use
- TypeScript errors
- unhandled promises
- abandoned commented-out code

---

# 4. First Step: Inspect Existing Repository

Before changing anything:

1. Inspect repository structure.
2. Inspect `package.json`.
3. Detect package manager.
4. Detect existing framework/tooling.
5. Check git status.
6. Read existing README/documentation.
7. Preserve useful existing work.
8. Do not overwrite an existing project unnecessarily.

If this is effectively a new project, create a TanStack Start application.

Preferred package manager:

```text
pnpm
```

Deployment:

```text
Vercel
```

Target architecture:

```text
TanStack Start
React
TypeScript strict
TanStack Router
TanStack Markdown
TanStack Highlight
Tailwind CSS
Zod
YAML parser
GitHub Contents API
Vercel
Vitest
```

Do NOT introduce Playwright, Cypress or another E2E framework for this implementation.

Use current mutually compatible package versions.

Commit the lockfile.

---

# 5. Mandatory Design Skills

Before UI implementation, ensure these skills are available.

```bash
npx skills add https://github.com/anthropics/skills --skill frontend-design

npx skills add https://github.com/leonxlnx/taste-skill --skill high-end-visual-design

npx skills add https://github.com/pbakaus/impeccable --skill impeccable

npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
```

Actually apply their guidance.

Installing them alone does not satisfy this requirement.

## Skill precedence

```text
1. Product requirements in this document
2. Safari iOS usability
3. Accessibility
4. frontend-design
5. impeccable
6. high-end-visual-design
7. web-design-guidelines audit
```

`high-end-visual-design` must improve editorial craft without turning the product into an over-animated agency website.

---

# 6. Design Context

Create before polished implementation:

```text
PRODUCT.md
DESIGN.md
```

## PRODUCT.md

Document:

- primary user
- main problem
- workflow
- public/private surfaces
- product principles
- non-goals
- information architecture

## DESIGN.md

Use the visual direction:

```text
Editorial Technology Journal
```

Desired qualities:

- editorial
- calm
- intelligent
- technical
- highly legible
- understated
- distinctive
- generous whitespace
- excellent long-form reading

Avoid:

- generic SaaS hero
- purple/blue gradient branding
- glassmorphism everywhere
- endless rounded cards
- giant pill buttons
- feature-grid aesthetics
- excessive shadows
- random decorative blobs
- animation for its own sake

Typography should carry much of the identity.

Font requirements:

```text
excellent Vietnamese support
excellent English support
clear code rendering
```

Use a dedicated monospace font for code.

Support:

```text
light
dark
system
manual toggle
```

Persist theme preference.

Respect:

```text
prefers-reduced-motion
```

---

# 7. iPhone-First Design Process

Do NOT design the desktop version first and then compress it.

Design major surfaces in this order:

```text
390px-ish iPhone viewport
        ↓
larger iPhone
        ↓
tablet
        ↓
desktop
```

For every page, first establish:

```text
mobile information hierarchy
mobile navigation
touch actions
mobile spacing
mobile typography
mobile overflow behavior
```

Then progressively enhance larger screens.

Desktop may introduce:

- side-by-side layouts
- persistent TOC
- split publisher panes
- richer whitespace

but the underlying UX must remain coherent on iPhone.

---

# 8. Information Architecture

Implement:

```text
/
    Journal home

/articles/$slug
    Public article

/tags/$tag
    Articles filtered by tag

/admin/login
    Single-user login

/admin
    Article dashboard

/admin/new
    Markdown publisher

/admin/edit/$slug
    Edit article

/feed.xml
/sitemap.xml
/robots.txt

404
```

Keep public navigation minimal.

Suggested:

```text
Journal
Research
Notes
Tags
Theme
```

Avoid desktop-heavy persistent navigation patterns that degrade Safari mobile usability.

---

# 9. Content Model

```ts
type ArticleType = 'research' | 'note'
```

```ts
interface ArticleMetadata {
  title: string
  slug: string
  description: string
  type: 'research' | 'note'
  tags: string[]
  publishedAt: string
  updatedAt?: string
}
```

```ts
interface Article {
  metadata: ArticleMetadata
  markdown: string
  readingTimeMinutes: number
  headings: ArticleHeading[]
}
```

Validate metadata with Zod.

Markdown remains source of truth.

Do NOT store AST as canonical content.

---

# 10. Canonical Markdown

Store:

```text
content/articles/{slug}.md
```

Example:

```md
---
title: Docker Image and Container
slug: docker-image-and-container
description: A practical mental model for Docker images and containers.
type: research
tags:
  - docker
  - devops
publishedAt: 2026-09-05
---

Docker images are...
```

Canonical body should not require an H1.

When pasted input contains:

```md
# Article title
```

extract it as metadata title and remove it from canonical body.

Public article must contain exactly one page-level H1.

---

# 11. TanStack Markdown Architecture

Use TanStack Markdown as the Markdown engine.

Conceptually:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { Markdown } from '@tanstack/markdown/react'
```

Use supported heading collection extensions to generate TOC data.

Do NOT parse Markdown structure using regex.

Do NOT create a custom Markdown parser.

Raw HTML must not execute by default.

Unsafe executable URLs must not render.

---

# 12. Markdown Pipeline

Suggested structure:

```text
src/lib/markdown/
    parse.ts
    normalize.ts
    validate.ts
    metadata.ts
    reading-time.ts
    slug.ts
    serialize.ts
    citations.ts
    types.ts
```

Pipeline:

```text
RAW INPUT
    ↓
preflight
    ↓
TanStack Markdown parser
    ↓
AST inspection
    ↓
metadata extraction
    ↓
validation
    ↓
normalization
    ↓
canonical Markdown
    ↓
preview / publish
```

---

# 13. ChatGPT Markdown Normalizer

Users should be able to paste ordinary Markdown copied from ChatGPT.

Handle:

- first H1 extraction
- duplicate H1 detection
- heading hierarchy
- excessive blank lines
- fenced code
- code language
- supported code metadata
- tables
- Markdown links
- safe bare HTTP/HTTPS URLs
- frontmatter
- unsupported raw HTML
- ChatGPT-specific citation artifacts

Never modify code contents.

## ChatGPT citation artifacts

Detect non-portable patterns conceptually resembling:

```text
cite...
filecite...
url...
```

If the real source cannot be recovered:

```text
BLOCK PUBLISH
```

Show:

```text
Unresolved ChatGPT citation found.
Replace it with a standard Markdown source link before publishing.
```

Never expose broken ChatGPT-internal citation artifacts publicly.

---

# 14. Article Health

Show:

```text
Article health

✓ Title detected
✓ Heading hierarchy valid
✓ 4 code blocks
✓ 6 external links
✓ Table of contents generated
✓ No unresolved citations

⚠ Description missing
```

Levels:

```text
success
warning
error
```

Publishing blocks on true errors.

Examples:

- empty article
- missing title
- invalid slug
- slug collision
- invalid metadata
- unresolved ChatGPT citation
- unsafe URL

Warnings should not unnecessarily prevent publishing.

---

# 15. Slug Generation

Support Vietnamese normalization.

Example:

```text
"Lexical Environment trong JavaScript"

→

"lexical-environment-trong-javascript"
```

Requirements:

- lowercase
- remove Vietnamese diacritics
- punctuation normalization
- hyphen collapsing
- URL-safe
- manual override

Never silently overwrite an existing article.

---

# 16. Reading Time

Calculate from readable prose.

Do not treat:

- frontmatter
- Markdown syntax
- code blocks

as ordinary prose.

Display:

```text
8 min read
```

---

# 17. Public Home

The homepage is an editorial journal, not a marketing landing page.

Recommended:

```text
Site identity / concise editorial statement

Latest Research

Research
- article
- article

Notes
- note
- note

Browse by topic
```

Seed realistic software-development content.

At minimum:

```text
Research:
Docker Images, Containers and Volumes — A Mental Model

Note:
Why React State Does Not Require Deep Cloning
```

---

# 18. Public Article Page

This is the highest-priority public surface.

Reading quality dominates.

## Safari iPhone layout

On phone, prefer:

```text
Header

Type · Date

Title

Description

Reading time / tags

Article body

Compact TOC control

Sources / footnotes

Related content
```

Do not waste the upper viewport on a giant hero treatment.

A user opening a shared link on iPhone should quickly reach the actual article.

Avoid large visual blocks before the article body unless they add real content value.

## Desktop enhancement

Desktop may use:

```text
article body
+
sticky right-side TOC
```

Article body should maintain a readable line length.

Do not stretch prose across desktop screens.

---

# 19. iOS Article Typography

Typography must be evaluated primarily at iPhone widths.

Requirements:

- body text comfortable without zoom
- generous but not wasteful line-height
- headings do not produce awkward 1-word lines unnecessarily
- long inline code does not break page width
- links remain visually identifiable
- Vietnamese diacritics render cleanly
- bold text does not become visually heavy
- code and prose remain distinguishable

Avoid extremely small metadata labels.

Do not optimize typography only for desktop screenshots.

---

# 20. Markdown Components

Create reusable presentation components:

```text
ArticleMarkdown
ArticleHeading
ArticleLink
ArticleCodeBlock
ArticleTable
ArticleQuote
ArticleImage
ArticleList
ArticleCallout
```

Presentation belongs to the website, not the Markdown source.

---

# 21. Headings

Requirements:

- semantic hierarchy
- stable IDs
- direct links
- TOC integration
- subtle anchor affordance
- correct touch behavior

Do not rely on hover to expose heading-link functionality.

On touch devices, anchors may be accessible via a small persistent/subtle control or another natural interaction.

Avoid noisy permanent `#` characters everywhere.

---

# 22. Table of Contents

Desktop:

```text
sticky side TOC
```

when appropriate.

iPhone:

Do NOT use a permanent sidebar.

Use a compact expandable control such as:

```text
On this page
```

Requirements:

- touch friendly
- native-feeling
- easy to dismiss
- no viewport trapping
- no full-screen modal unless justified
- section links scroll correctly in Safari

If sticky, verify it remains usable with Safari browser chrome.

---

# 23. Code Blocks

Critical feature.

Requirements:

- syntax highlighting
- filename when available
- copy button
- internal horizontal scrolling
- accessible contrast
- light/dark compatibility
- optional highlighted lines

iPhone-specific requirements:

- code block scrolls horizontally without moving whole page
- copy button is comfortably tappable
- copy button does not cover code
- code text remains legible
- block width never exceeds article layout
- momentum scrolling feels native
- no hover dependency

Do not make code font excessively small to fit more characters.

Horizontal scrolling is preferable.

---

# 24. Tables

iPhone behavior:

```text
table wrapper
    ↓
horizontal scroll
```

The page itself must remain fixed horizontally.

Do not shrink table content into unreadability.

Keep headers clear.

Ensure scroll affordance is visually understandable.

---

# 25. Blockquotes / Callouts

Keep them editorial and restrained.

Potential types:

```text
NOTE
TIP
WARNING
IMPORTANT
```

They must work equally well on narrow screens.

Avoid thick nested borders or excessive horizontal padding that leave little room for text.

---

# 26. Images

Requirements:

- never overflow content width
- preserve aspect ratio
- meaningful alt text
- lazy loading when appropriate
- graceful failure

Do not build image upload in v1.

Remote Markdown image URLs are sufficient.

---

# 27. Private Publisher

Primary private experience:

```text
/admin/new
```

## Desktop

A split editor/preview is appropriate:

```text
Markdown | Preview
```

## Safari iPhone

Do NOT force two columns.

Use a mobile-native sequence such as:

```text
[Edit] [Preview]

Markdown editor

Metadata

Article Health

Publish
```

or another clearly superior touch-oriented structure.

The important workflow must remain:

```text
Paste
Preview
Publish
```

with minimal friction.

---

# 28. iPhone Publisher Requirements

This screen receives special priority.

The user will likely paste large Markdown content from clipboard.

Optimize for this.

## Editor

Use a normal textarea unless a more complex editor provides a clearly justified benefit.

Do NOT add Monaco/CodeMirror merely because this is Markdown.

Avoid heavyweight desktop-code-editor UX.

Textarea requirements:

- font size ≥16px
- comfortable line-height
- reliable paste
- preserve Markdown
- no unnecessary autoformatting
- accessible focus
- sensible minimum height
- grows or scrolls predictably

## Paste behavior

Pasting a long research article should not freeze the UI.

Parsing/preview updates should be debounced or otherwise implemented efficiently.

Do not create severe typing latency.

## Editor/Preview switch

Touch target must be large.

Switching modes must not lose editor state or scroll unexpectedly.

## Metadata

Use mobile-friendly fields.

Do not present five tiny inputs in a dense grid.

## Publish action

The primary publish action must remain easy to reach.

But do not use a fixed bottom bar if it causes keyboard/safe-area issues.

Choose the implementation that behaves most reliably in Safari.

---

# 29. Autosave

Autosave unpublished draft state to browser storage.

Use versioned storage.

Restore after refresh.

Provide:

```text
Clear draft
```

with confirmation.

No database needed.

---

# 30. Publish Flow

```text
Paste
    ↓
Preview
    ↓
Publish
    ↓
server validation
    ↓
canonical serialization
    ↓
ContentRepository.create()
    ↓
GitHub commit
    ↓
verify read
    ↓
success
    ↓
copy URL
```

Only show success after persistence is confirmed.

Success:

```text
Published

https://example.com/articles/...

[Copy link]
[View article]
```

On iPhone, copying the URL should be a one-tap primary action.

---

# 31. Content Repository

Create abstraction:

```ts
interface ContentRepository {
  listArticles(): Promise<ArticleSummary[]>
  getArticle(slug: string): Promise<ArticleSource | null>
  createArticle(article: CanonicalArticle): Promise<PublishResult>
  updateArticle(article: CanonicalArticle): Promise<PublishResult>
  deleteArticle(slug: string): Promise<void>
}
```

Implement:

```text
LocalFileContentRepository
GitHubContentRepository
```

All GitHub API communication is server-side.

Never expose GitHub tokens.

---

# 32. GitHub Environment

Example:

```text
CONTENT_REPOSITORY=github

GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main
GITHUB_CONTENT_DIRECTORY=content/articles

PUBLIC_SITE_URL=
```

Use minimum required permissions.

Handle:

```text
401
403
404
409
422
rate limits
network failure
```

Do not leak secrets in errors/logs.

---

# 33. Immediate Public Reads

Publishing should NOT require waiting for Vercel to rebuild.

Public content is loaded server-side through `ContentRepository`.

Target behavior:

```text
Publish to GitHub
      ↓
server can immediately read article
      ↓
public URL works
```

Git deployment may happen independently afterward.

---

# 34. Edit / Update

Implement:

```text
/admin/edit/$slug
```

Preserve `publishedAt`.

Update `updatedAt`.

For GitHub updates, use the correct current remote SHA/version.

Never silently overwrite remote conflicts.

---

# 35. Unpublish

Provide Unpublish with confirmation.

After unpublish:

```text
/articles/$slug
```

must resolve to proper 404 behavior.

Destructive actions should be visually secondary.

---

# 36. Admin Dashboard

Keep this simple.

Display:

```text
Title
Type
Tags
Published
Updated
Edit
View
More
```

Primary CTA:

```text
New article
```

On iPhone, do NOT force a desktop table.

Render a touch-friendly list/card-row presentation.

Avoid KPI dashboards, charts and enterprise CMS aesthetics.

---

# 37. Authentication

Single user only.

Do not build registration, roles or teams.

Suggested:

```text
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
```

Provide:

```text
pnpm admin:hash-password
```

Requirements:

- server-side password verification
- HttpOnly session
- Secure cookie production
- SameSite
- expiration
- logout
- protected mutations
- protected admin routes

Login screen must be excellent on Safari iPhone.

No tiny form controls.

No keyboard obstruction.

---

# 38. SEO

Every article:

```text
title
description
canonical

Open Graph
Twitter metadata
Article/TechArticle structured data
```

Include:

- published date
- updated date
- canonical URL

---

# 39. Open Graph Image

Prefer typography-driven editorial OG images.

Example direction:

```text
JOURNAL

Docker Images
and Containers

A Mental Model

example.com
```

Use a deployment-safe implementation.

If dynamic OG generation becomes brittle, use a high-quality branded fallback rather than destabilizing the project.

---

# 40. RSS / Sitemap / Robots

Implement:

```text
/feed.xml
/sitemap.xml
/robots.txt
```

Do not index admin routes.

---

# 41. Tags

Implement:

```text
/tags/$tag
```

Mobile layout must remain simple and readable.

Do not create empty tag pages.

---

# 42. Responsive Targets

Primary design/QA targets:

```text
390px
393px
430px
```

representative of current iPhone widths.

Secondary:

```text
768px
1440px
```

Major surfaces:

```text
home
article
publisher
admin
login
```

Safari iOS behavior has priority over perfect pixel parity in other browsers.

---

# 43. Accessibility

Implement:

- semantic landmarks
- skip link
- visible focus
- keyboard support
- correct headings
- form labels
- error associations
- sufficient contrast
- reduced motion
- accessible dialogs
- accessible theme toggle
- accessible copy feedback
- image alt handling

Do not disable browser zoom.

Do not rely on color alone.

Do not rely on hover alone.

---

# 44. Motion

Motion should be subtle.

Suitable:

```text
theme transition
TOC state
copy success
small navigation transitions
publisher mode switch
```

Avoid:

```text
scroll hijacking
parallax
constant floating elements
large stagger animations
complex page transitions
```

iOS reading experience should remain calm and responsive.

---

# 45. Performance

Optimize especially for mobile Safari.

Avoid large client bundles for public article pages.

Prefer server rendering.

Do not ship unnecessary Markdown parsing/highlighting work to the client when it can be done server-side.

Avoid large UI libraries for isolated controls.

Avoid heavy editors.

Avoid unnecessary animation libraries.

Watch:

```text
JS bundle size
hydration cost
layout shifts
long tasks after paste
large DOM trees
```

The Publisher must remain responsive after pasting a long article.

---

# 46. Error States

Implement real error states for:

```text
invalid Markdown
missing article
GitHub authentication failure
GitHub rate limit
network error
slug conflict
publish failure
update conflict
invalid login
expired session
```

Errors must fit iPhone width.

Do not expose stack traces.

---

# 47. Loading States

Avoid full-screen spinners where unnecessary.

Prefer:

```text
inline progress
button state
small skeleton
```

Publish button:

```text
Publish
Publishing…
Published
```

Prevent duplicate submission.

---

# 48. Empty States

Implement:

```text
no articles
no research
no notes
no tag results
empty admin
```

No lorem ipsum.

---

# 49. Automated Testing Scope

Do NOT implement automated E2E tests.

Do NOT add:

```text
Playwright
Cypress
WebdriverIO
```

solely for this project.

The user will perform end-to-end acceptance testing manually.

Automated tests should focus on deterministic business/domain logic.

Use:

```text
Vitest
```

for unit and integration tests.

---

# 50. Unit Tests

Test at minimum:

```text
Vietnamese slug generation

H1 extraction

duplicate H1 detection

frontmatter parsing

frontmatter serialization

metadata validation

reading time

bare URL normalization

ChatGPT citation detection

unsafe URL validation

Markdown normalization

canonical serialization
```

Use realistic fixtures.

---

# 51. Content Repository Tests

Test local repository behavior:

```text
create
read
list
update
delete
slug conflict
```

Test GitHub repository adapter with mocked API responses:

```text
create request
update with SHA
delete
404
401
403
409
422
rate limit
```

Do not require a real GitHub account.

---

# 52. Markdown Renderer Fixtures

Create development fixtures containing:

```text
H2
H3
paragraph
bold
italic
links
ordered list
unordered list
blockquote
inline code
TypeScript code
shell code
table
image
horizontal rule
footnotes if supported
```

Use them for implementation verification and visual inspection.

---

# 53. Safari iOS Manual QA During Development

Although no automated E2E suite is required, the implementation must still be built with Safari iOS behavior explicitly considered.

If browser/device emulation is available to the coding agent, use it for lightweight visual inspection.

Do NOT turn this into a formal E2E test suite.

Inspect at representative iPhone dimensions.

Focus on:

```text
layout
overflow
touch targets
input size
sticky UI
safe areas
code scrolling
table scrolling
publisher mode switching
```

Real-device final functional acceptance will be performed by the user.

---

# 54. Visual QA

After implementation, apply `impeccable`.

Perform a bounded visual review.

Primary screenshots/inspection sizes:

```text
Article — 390px
Publisher — 390px
Home — 390px

Article — 1440px
Publisher — 1440px
Home — 1440px
```

Mobile screenshots come first.

Inspect:

- typography
- spacing
- hierarchy
- touch-target sizing
- overflow
- code
- tables
- TOC
- themes
- publisher usability

Fix meaningful defects in one batched pass.

Perform one confirmation pass at most.

---

# 55. Safari iOS QA Checklist

Before handoff, review the implementation against this checklist at code/design level and through available browser inspection:

```text
[ ] No important hover-only interactions

[ ] Form controls use ≥16px effective text size

[ ] User zoom is not disabled

[ ] No critical layout depends on 100vh

[ ] Dynamic viewport units used where appropriate

[ ] Safe areas considered for edge UI

[ ] No page-level horizontal overflow

[ ] Code blocks scroll horizontally internally

[ ] Tables scroll horizontally internally

[ ] Touch targets are comfortably sized

[ ] Publisher does not force desktop split pane on mobile

[ ] Metadata fields are mobile-friendly

[ ] Theme toggle is touch-friendly

[ ] TOC is mobile-friendly

[ ] Sticky/fixed UI is minimal

[ ] No obvious keyboard-obstruction architecture

[ ] Text remains selectable

[ ] Copy actions work without hover

[ ] Long URLs/code cannot break page layout

[ ] Admin dashboard is not a desktop table squeezed onto iPhone

[ ] Navigation works naturally with touch
```

---

# 56. Design Audit

Apply:

```text
impeccable
```

for visual critique/polish.

Then apply:

```text
web-design-guidelines
```

against relevant frontend code.

Fix meaningful findings.

Safari iOS constraints override aesthetic recommendations that would reduce usability.

---

# 57. Code Quality

Use TypeScript strict.

Avoid `any` without necessity.

Prefer:

```text
small modules
pure content transformations
explicit types
clear server/client boundaries
storage abstraction
```

Do not overengineer.

Architectural boundaries worth preserving:

```text
Markdown pipeline
ContentRepository
authentication
SEO
```

---

# 58. Secret Boundary

TanStack Start may contain isomorphic modules.

Explicitly prevent secret-dependent code from entering client bundles.

Protect:

```text
GITHUB_TOKEN
SESSION_SECRET
ADMIN_PASSWORD_HASH
```

Review imports accordingly.

---

# 59. Suggested Structure

Adapt to current TanStack conventions:

```text
content/
  articles/

src/
  components/
    article/
    markdown/
    publisher/
    ui/

  lib/
    auth/

    content/
      repository.ts
      local-file.repository.ts
      github.repository.ts

    markdown/
      parse.ts
      normalize.ts
      validate.ts
      metadata.ts
      citations.ts
      slug.ts
      reading-time.ts
      serialize.ts
      types.ts

    seo/

  routes/

  styles/

tests/
  unit/
  integration/
  fixtures/

PRODUCT.md
DESIGN.md
README.md
.env.example
```

No `tests/e2e` directory is required.

---

# 60. Environment Example

```text
CONTENT_REPOSITORY=local

PUBLIC_SITE_URL=http://localhost:3000

GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main
GITHUB_CONTENT_DIRECTORY=content/articles

ADMIN_PASSWORD_HASH=
SESSION_SECRET=
```

---

# 61. Commands

Provide predictable scripts:

```text
pnpm dev
pnpm build
pnpm preview

pnpm lint
pnpm typecheck
pnpm test
pnpm check

pnpm admin:hash-password
```

Do NOT create a `test:e2e` command.

`pnpm check` should run important static/unit verification.

---

# 62. Documentation

README must explain:

## Product

What the application does.

## Architecture

```text
ChatGPT Markdown
    ↓
Markdown pipeline
    ↓
TanStack Markdown AST
    ↓
React renderer
    ↓
ContentRepository
    ↓
Local filesystem / GitHub
```

## Safari iOS-first design

Document key implementation decisions such as:

```text
dynamic viewport
safe areas
touch targets
16px inputs
mobile publisher flow
scroll containment
```

## Local setup

Exact commands.

## Authentication

Exact setup.

## GitHub integration

Permissions and environment variables.

## Content contract

Frontmatter schema.

## Deployment

Vercel setup.

## Testing

Unit/integration commands.

Explicitly state:

```text
Automated E2E tests are intentionally not part of this project.
Final acceptance testing is performed manually by the owner.
```

## Publishing workflow

```text
Paste → Preview → Publish → Share
```

---

# 63. Production Verification

Before handoff run:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Fix failures.

No automated E2E execution is required.

---

# 64. Runtime Sanity

If the environment allows launching the application, perform a lightweight sanity inspection.

Do not create formal E2E automation.

Check that critical routes render and there are no obvious:

```text
React errors
hydration warnings
failed initial requests
uncaught exceptions
```

This is a development sanity check, not acceptance testing.

The user will perform final functional testing.

---

# 65. GitHub Integration Verification

If GitHub credentials are available, verify adapter behavior carefully.

A real temporary integration check may be performed if safe.

Clean up test content afterward.

If credentials are unavailable:

- use mocked integration tests
- ensure local repository tests pass
- document live GitHub verification as pending user environment setup

---

# 66. User Acceptance Test Checklist

Create:

```text
docs/UAT.md
```

This file is specifically for the user to test manually after handoff.

Keep it concise and actionable.

Prioritize real iPhone Safari testing.

Include:

## Safari iPhone

```text
[ ] Open home page

[ ] Open Research article

[ ] Rotate portrait / landscape

[ ] Open and use article TOC

[ ] Scroll long article

[ ] Scroll code block horizontally

[ ] Scroll wide table horizontally

[ ] Copy code

[ ] Switch light/dark theme

[ ] Select and copy article text

[ ] Verify no page-level horizontal overflow
```

## Publisher

```text
[ ] Login

[ ] Open New Article

[ ] Focus Markdown editor

[ ] Confirm Safari does not zoom input unexpectedly

[ ] Paste long Markdown from ChatGPT

[ ] Switch Edit / Preview

[ ] Edit metadata

[ ] Open virtual keyboard

[ ] Scroll while keyboard is visible

[ ] Close keyboard

[ ] Review Article Health

[ ] Publish

[ ] Copy public URL

[ ] Open published article in Safari
```

## Content lifecycle

```text
[ ] Edit article

[ ] Publish update

[ ] Verify updated article

[ ] Unpublish

[ ] Verify 404
```

## Failure cases

```text
[ ] Invalid password

[ ] Duplicate slug

[ ] Unresolved ChatGPT citation

[ ] Invalid external source
```

This UAT checklist replaces automated E2E tests.

---

# 67. Definition of Done

Do not hand off until all applicable engineering items are complete.

```text
[ ] App starts locally

[ ] Production build succeeds

[ ] TypeScript passes

[ ] Lint passes

[ ] Unit/integration tests pass

[ ] Home implemented

[ ] Article page implemented

[ ] Research/Note distinction implemented

[ ] Tag pages implemented

[ ] Admin login implemented

[ ] Publisher implemented

[ ] Markdown preview implemented

[ ] Markdown normalization implemented

[ ] Article Health implemented

[ ] ChatGPT citation detection implemented

[ ] Vietnamese slug generation works

[ ] Metadata validated

[ ] Local ContentRepository implemented

[ ] GitHub ContentRepository implemented

[ ] Secrets remain server-only

[ ] Edit implemented

[ ] Unpublish implemented

[ ] TOC implemented

[ ] Code rendering implemented

[ ] Code copy implemented

[ ] Mobile tables handled

[ ] Unsafe links handled

[ ] Raw HTML does not execute by default

[ ] Light theme implemented

[ ] Dark theme implemented

[ ] Theme persists

[ ] Safari iOS-first constraints implemented

[ ] No critical hover-only interactions

[ ] Touch targets reviewed

[ ] Inputs protected from unwanted iOS zoom

[ ] Dynamic viewport behavior considered

[ ] Safe-area-sensitive UI handled

[ ] No page-level horizontal overflow

[ ] Mobile Publisher is not a compressed desktop UI

[ ] SEO implemented

[ ] Open Graph implemented

[ ] RSS implemented

[ ] Sitemap implemented

[ ] Robots implemented

[ ] 404 implemented

[ ] Accessibility principles implemented

[ ] frontend-design applied

[ ] high-end-visual-design applied appropriately

[ ] impeccable polish pass completed

[ ] web-design-guidelines audit completed

[ ] PRODUCT.md exists

[ ] DESIGN.md exists

[ ] docs/UAT.md exists

[ ] README complete

[ ] .env.example complete

[ ] No secrets committed

[ ] No unfinished TODOs in required scope
```

Automated E2E tests are intentionally excluded from Definition of Done.

---

# 68. Scope Guardrails

Do NOT add:

```text
PostgreSQL
Supabase
Firebase
Contentful
Sanity
Strapi
Payload
MDX
WYSIWYG editor
multi-user accounts
comments
likes
analytics dashboard
newsletter
AI API integration
vector database
search engine
E2E test framework
```

unless already structurally required by the existing repository.

Keep v1 deliberately simple.

---

# 69. Architectural Principle

```text
Markdown
    =
source of truth

TanStack Markdown
    =
parser/compiler

Serializable AST
    =
derived representation

React
    =
presentation

ContentRepository
    =
storage boundary

GitHub
    =
production content store

Local filesystem
    =
development/test store

TanStack Start
    =
application/server layer

Vercel
    =
deployment
```

---

# 70. UX Principle

Optimize every decision for:

```text
I completed useful research in ChatGPT.

I want someone to read it.

I copy Markdown.

I open the publisher on my iPhone or computer.

I paste it.

It already looks excellent.

I quickly review it.

I publish it.

I get a link.

Done.
```

On iPhone specifically:

```text
No fighting the keyboard.

No tiny controls.

No desktop UI squeezed into 390px.

No accidental zoom.

No broken fixed toolbars.

No horizontal page scrolling.

No hover-only actions.
```

---

# 71. Final Handoff Format

After engineering Definition of Done is satisfied, provide:

## Implemented

Major delivered capabilities.

## Architecture

Concise architecture summary.

## UI / Design

State:

```text
Safari iOS-first
Editorial Technology Journal
```

and mention design skills actually applied.

## Verification

Report actual results of:

```text
lint
typecheck
unit/integration tests
build
design audit
Safari/iPhone-oriented code review
```

Do NOT claim an automated E2E pass.

No E2E suite exists by design.

## User Acceptance Testing

Point the user to:

```text
docs/UAT.md
```

and clearly state that final real-device Safari functional verification remains for the user.

## Credentials required

Only list genuinely missing credentials.

## Run locally

Exact commands.

## Deploy

Exact Vercel steps.

## Known limitations

Only real limitations.

Do not hide failures.

---

# 72. Final Instruction

This is an implementation assignment, not a planning exercise.

Do not merely return another plan.

Inspect the repository.

Use the design skills.

Build the application.

Optimize Safari iOS first.

Run static checks and automated unit/integration tests.

Perform the bounded UI/design review available in the implementation environment.

Do NOT spend time building E2E automation.

Prepare `docs/UAT.md` for the user's real-device testing.

Then hand off the completed implementation.