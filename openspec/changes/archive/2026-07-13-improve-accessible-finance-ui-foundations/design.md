## Context

Clocket prioritizes clarity, calm, and low cognitive effort. Current UI has strong visual foundations but some interactions rely on pointer gestures or non-semantic modal shells. This creates avoidable friction and can block keyboard/screen-reader users.

## Goals / Non-Goals

**Goals:**

- Make modal/sheet interactions semantically correct and keyboard-operable.
- Ensure destructive account/transaction actions have visible, accessible controls and confirmations.
- Improve app landmarks, headings, nav state, and async status announcements.
- Keep UI tone calm and Spanish-first.

**Non-Goals:**

- No full visual redesign.
- No new component library unless required.
- No route architecture rewrite.

## Decisions

1. **Build a shared dialog/sheet primitive.** Reuse the existing visual sheet style but add `role="dialog"`, `aria-modal`, labelled title, focus lifecycle, Escape close, and backdrop semantics.
2. **Destructive actions need a non-gesture path.** Swipe can remain as enhancement, but delete must also be reachable by button/keyboard and confirmed in a semantic dialog.
3. **Semantic structure before ARIA hacks.** Use `<main>`, `<nav>`, real headings, labels, and buttons before custom ARIA.
4. **Manual QA is required.** Accessibility improvements need keyboard-only and screen-reader-smoke validation in addition to tests.

## Risks / Trade-offs

- Focus management can regress mobile comfort → test desktop and mobile viewport flows.
- Adding visible delete actions can increase visual density → keep progressive disclosure and calm styling.
- URL state for sheets/settings may be desirable but can be handled as a follow-up if it expands scope.
