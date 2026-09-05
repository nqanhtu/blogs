# User Acceptance Testing (UAT) Guide

This guide is for manual end-to-end verification of the **Personal Markdown Research Publisher** on real devices, with primary emphasis on **Safari on iOS (iPhone)**.

---

## 1. Safari iPhone Core Reading Experience

Open `http://<your-local-ip>:3000` or production URL in **Safari on iPhone**.

- [ ] **Home / Journal Surface (`/`):**
  - Verify layout fits iPhone width (390px / 393px / 430px) without any sideways page wiggle or horizontal scrolling.
  - Verify touch targets for filters (`All`, `Research`, `Notes`) and topic tags are easily tappable (≥44px hit area).
  - Verify theme switcher toggles between Light, Dark, and System modes and persists across page reloads.
  - Verify editorial typography renders cleanly without awkward 1-word line wraps.

- [ ] **Article Reading Surface (`/articles/$slug`):**
  - Open *Docker Images, Containers and Volumes — A Mental Model*.
  - Verify the article header immediately displays type, date, reading time, and title without an oversized hero pushing content below the fold.
  - Rotate iPhone between Portrait and Landscape: verify typography and layout reflow smoothly without clipping.
  - Tap the mobile table of contents control **"On this page (N sections)"**:
    - Expands smoothly without taking over the full screen.
    - Tap a section (e.g. *3. Volumes: Piercing the Abstraction*): smooth scrolls directly to the section with proper header offset.
    - Control collapses cleanly after selection.

- [ ] **Code Blocks & Syntax Highlighting:**
  - Locate the `Dockerfile` and `bash` code blocks.
  - Scroll horizontally inside the code block: verify that **only the code block scrolls** while the rest of the page remains firmly in place.
  - Tap the **Copy** button on the code block header: verify instant visual feedback changes from "Copy" to "Copied!" with checkmark icon.
  - Paste into Notes app or text field to confirm clipboard content matches original code exactly.

- [ ] **Responsive Table Containment:**
  - Locate the *Layer Properties Comparison* table.
  - Scroll the table horizontally: verify smooth touch momentum scrolling (`-webkit-overflow-scrolling: touch`) and clear headers.
  - Confirm the page itself does not scroll horizontally.

- [ ] **Text Selection & System Integration:**
  - Long-press to select prose text and code: verify native Safari text selection loupe and action menu appear as expected (user-select is never disabled).

---

## 2. Safari iPhone Publisher & Authoring Flow

- [ ] **Authentication (`/admin/login`):**
  - Navigate to `/admin/login` or tap the **Sign in** link in the footer.
  - Tap into the Password input:
    - **Crucial iOS test:** Verify Mobile Safari **does NOT zoom in** on the input field (font-size is strictly ≥16px).
    - Verify virtual keyboard does not obscure the submit button or break page positioning.
  - Submit an incorrect password: verify friendly error alert appears inline.
  - Submit valid password (`admin` by default or your `ADMIN_PASSWORD_HASH`): verify seamless redirection to `/admin`.

- [ ] **Admin Dashboard (`/admin`):**
  - Confirm dashboard presents a touch-friendly card list instead of a squeezed desktop table.
  - Verify each article has Edit, Unpublish, and View actions.
  - Tap **New article** to enter the publisher.

- [ ] **Markdown Publisher (`/admin/new`):**
  - Tap into the Markdown editor textarea: verify no mobile zoom occurs.
  - Copy a rich Markdown response from ChatGPT and paste it into the editor.
  - Tap **Normalize**: verify any top-level `# Title` is extracted to the Title field, redundant blank lines are collapsed, and code languages are normalized.
  - Switch between **[Edit & Metadata]** and **[Live Preview]** tabs: verify state is preserved and switching is instant without scroll disorientation.
  - Open virtual keyboard while editing metadata fields: verify fields remain reachable and scrollable.
  - Close virtual keyboard: verify viewport height restores naturally without layout jump.

- [ ] **Article Health Checklist:**
  - Inspect the **Article Health** card:
    - Title detected (✓)
    - Slug valid (✓)
    - Heading hierarchy valid (✓)
    - Code blocks counted (✓)
    - External links counted (✓)
    - Table of contents generated (✓)
    - No unresolved citations (✓)
  - Verify Publish button is enabled only when all required health items pass.

- [ ] **Publish & Share Flow:**
  - Tap **Publish Article**: verify button transitions to "Publishing…" spinner and duplicate taps are prevented.
  - On publication success: verify green confirmation card appears with canonical URL.
  - Tap **Copy link**: verify single-tap copy feedback.
  - Tap **View article**: verify immediate public availability without waiting for any build pipeline.

---

## 3. Content Lifecycle & Management

- [ ] **Edit Article (`/admin/edit/$slug`):**
  - From `/admin`, tap **Edit** on an existing article.
  - Update the description or add an additional section to the body.
  - Tap **Publish Update**: verify changes are saved, `updatedAt` date is recorded, and original `publishedAt` is preserved.

- [ ] **Unpublish Article:**
  - In `/admin`, tap **Unpublish** on an article.
  - Confirm browser prompt dialog.
  - Verify article disappears from the list.
  - Navigate directly to `/articles/<deleted-slug>`: verify clean 404 page is rendered with a button to return home.

---

## 4. Edge Cases & Error Handling

- [ ] **Unresolved ChatGPT Citation Artifact:**
  - In Publisher, type text containing `【4:0†source】`.
  - Verify Article Health displays an error and blocks publishing:
    *"Unresolved ChatGPT citation found. Replace it with a standard Markdown source link before publishing."*
  - Remove the citation artifact: verify error resolves and publishing unlocks.

- [ ] **Slug Collision:**
  - Attempt to publish a new article with an existing slug (e.g. `why-react-state-does-not-require-deep-cloning`).
  - Verify Article Health or server response indicates slug is already in use.

- [ ] **Draft Autosave & Recovery:**
  - Type text into `/admin/new`.
  - Refresh the page in Safari: verify content is restored from `publisher_draft_v1`.
  - Tap **Clear draft**: confirm prompt, verify editor resets cleanly.
