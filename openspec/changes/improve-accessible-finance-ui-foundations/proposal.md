## Why

The product audit found accessibility and interaction gaps in core finance UI: destructive actions can depend on swipe/pointer gestures, sheets/dialogs do not consistently expose modal semantics, and global navigation/headings lack key semantic affordances. Clocket should remain calm and low-friction for keyboard and assistive technology users.

## What Changes

- Create accessible modal/sheet foundations with dialog semantics, focus handling, Escape behavior, and focus restoration.
- Provide keyboard-accessible alternatives for destructive actions currently exposed through swipe/pointer gestures.
- Improve semantic page structure with main landmark, headings, nav state, and live regions for async updates.
- Normalize calm Spanish product copy for affected flows.
- Non-goal: visual redesign, new routing library, E2E framework installation, or changing financial business rules.

## Capabilities

### New Capabilities

- `accessible-finance-ui-foundations`: Accessibility, semantic UI, and calm interaction requirements for finance flows.

### Modified Capabilities

- None.

## Impact

- Frontend components: SlideUpSheet, delete dialogs, navigation, headers, account/transaction rows, budgets month selector, settings popups.
- Tests/manual QA: keyboard-only flows, screen-reader labels, reduced motion checks where applicable.
