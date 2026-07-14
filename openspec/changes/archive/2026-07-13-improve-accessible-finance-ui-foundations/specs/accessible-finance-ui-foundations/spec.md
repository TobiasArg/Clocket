## ADDED Requirements

### Requirement: Modal and sheet interactions are accessible
Modal and sheet components SHALL expose semantic dialog behavior and predictable focus handling.

#### Scenario: Sheet opens
- **WHEN** a user opens a slide-up sheet or modal dialog
- **THEN** the opened surface SHALL be labelled and exposed as a dialog to assistive technology
- **AND** keyboard focus SHALL move into the surface and return to the triggering control when it closes

#### Scenario: User presses Escape
- **WHEN** a dismissible dialog or sheet is open and the user presses Escape
- **THEN** the surface SHALL close unless a blocking validation or destructive confirmation state prevents dismissal

### Requirement: Destructive actions are keyboard accessible
Destructive finance actions SHALL NOT require swipe, drag, or pointer-only gestures.

#### Scenario: Keyboard user deletes a transaction
- **WHEN** a keyboard-only user needs to delete a transaction
- **THEN** a focusable delete action SHALL be available without performing a swipe gesture
- **AND** deletion SHALL require a confirmation or undo-safe flow

### Requirement: App structure exposes navigation and content landmarks
The app shell SHALL provide semantic landmarks and active navigation state.

#### Scenario: Screen reader user navigates the app
- **WHEN** the app shell is rendered
- **THEN** the primary content SHALL be inside a main landmark
- **AND** the bottom navigation SHALL expose navigation semantics and the current page state

### Requirement: Async finance feedback is announced calmly
Async save, export, loading, and error state changes SHALL be announced with calm actionable copy when they affect the current task.

#### Scenario: Export fails
- **WHEN** a settings export fails
- **THEN** the UI SHALL present a calm actionable error message
- **AND** the update SHALL be available to assistive technologies through an appropriate status or alert mechanism
