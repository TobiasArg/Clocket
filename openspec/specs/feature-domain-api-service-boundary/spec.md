# feature-domain-api-service-boundary Specification

## Purpose
Define backend API/service boundaries for migrated feature domains: budgets, goals, installment plans, investments, and app settings.

## Requirements

### Requirement: Budgets API service boundary
The backend SHALL expose API/service behavior for listing, reading, creating, updating, deleting, and clearing budget plans using backend persistence as the canonical source of truth.

#### Scenario: Budget plan is created through the backend
- **WHEN** a valid budget create request includes name, limit amount, month, optional category reference, and scope rules
- **THEN** the backend SHALL persist the budget with a backend-generated ID and return the canonical budget payload

#### Scenario: Budget request references missing category data
- **WHEN** a budget create or update request references a category, subcategory, or scope target that does not exist
- **THEN** the backend SHALL reject the request with a controlled 4xx response and SHALL NOT persist partial budget changes

### Requirement: Goals API service boundary
The backend SHALL expose API/service behavior for listing, reading, creating, updating, deleting, and clearing goals using backend persistence as the canonical source of truth.

#### Scenario: Goal is updated through the backend
- **WHEN** a valid goal update request changes title, description, target amount, deadline date, icon, color, or category association
- **THEN** the backend SHALL persist the allowed patch and return the updated canonical goal payload

#### Scenario: Goal request contains invalid values
- **WHEN** a goal create or update request includes an invalid target amount, date, color key, or category reference
- **THEN** the backend SHALL return a controlled validation error and SHALL NOT persist invalid goal data

### Requirement: Installment plans API service boundary
The backend SHALL expose API/service behavior for listing, reading, creating, updating, deleting, and clearing installment plans/cuotas using backend persistence as the canonical source of truth.

#### Scenario: Installment plan is created
- **WHEN** a valid cuota request includes total amount, installment count, start month, optional paid count, and optional category/subcategory metadata
- **THEN** the backend SHALL persist the installment plan and return the canonical plan payload with backend-generated ID and normalized values

#### Scenario: Installment plan has invalid payment counts
- **WHEN** a cuota request has paid installments greater than total installments or a non-positive installment count
- **THEN** the backend SHALL reject the request with a controlled 4xx response

### Requirement: Investments API service boundary
The backend SHALL expose API/service behavior for investment positions, entries, snapshots, and asset reference prices using backend persistence as the canonical source of truth.

#### Scenario: Investment entry updates a position
- **WHEN** a valid investment entry request is submitted for an asset type and ticker
- **THEN** the backend SHALL persist the entry and return the resulting canonical position and entry payloads

#### Scenario: Latest investment snapshot is requested
- **WHEN** the frontend requests the latest snapshot for an asset type and ticker
- **THEN** the backend SHALL return the most recent persisted snapshot or null when no snapshot exists

### Requirement: Settings API service boundary
The backend SHALL expose API/service behavior for reading, updating, and resetting app settings using backend persistence as the canonical source of truth.

#### Scenario: Settings are updated
- **WHEN** a valid settings update request changes currency, language, notifications, theme, profile fields, or currently supported security settings
- **THEN** the backend SHALL persist the patch and return the canonical settings payload

#### Scenario: Settings are reset
- **WHEN** the frontend requests settings reset
- **THEN** the backend SHALL restore default settings values and return the canonical defaults

### Requirement: Feature-domain API consistency
Feature-domain APIs SHALL use the existing backend HTTP conventions for method handling, request parsing, validation failures, not-found responses, unexpected errors, and response serialization.

#### Scenario: Unsupported method is used
- **WHEN** a feature-domain endpoint receives an unsupported HTTP method
- **THEN** the backend SHALL return the existing controlled method-not-allowed response format

#### Scenario: Unexpected persistence failure occurs
- **WHEN** a repository or provider-backed operation fails unexpectedly
- **THEN** the backend SHALL return a controlled server error response and SHALL avoid logging secrets or full sensitive financial payload dumps
