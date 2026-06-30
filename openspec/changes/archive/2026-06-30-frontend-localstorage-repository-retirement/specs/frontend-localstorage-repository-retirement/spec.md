## ADDED Requirements

### Requirement: Legacy localStorage repositories are retired from active runtime
The frontend SHALL NOT expose or use migrated feature/core localStorage repositories from active production runtime paths after backend cutover.

#### Scenario: Public frontend exports are inspected
- **WHEN** maintainers inspect shared frontend exports used by app runtime
- **THEN** migrated `LocalStorage*Repository` classes and active localStorage repository instances SHALL NOT be exported as production-ready persistence options
- **AND** active repository defaults SHALL resolve to HTTP-backed implementations

#### Scenario: Runtime feature flow performs persistence
- **WHEN** a migrated domain flow reads or writes accounts, categories, transactions, budgets, goals, cuotas, investments, or settings
- **THEN** the flow SHALL use backend-backed HTTP repositories
- **AND** SHALL NOT call legacy localStorage repository methods

### Requirement: Clean-start localStorage handling remains supported
The frontend SHALL preserve clean-start behavior for migrated legacy localStorage keys while retiring localStorage repositories from active persistence.

#### Scenario: Legacy migrated keys exist in browser storage
- **WHEN** the app starts with migrated legacy localStorage keys present
- **THEN** clean-start handling SHALL ignore or clear those keys according to existing cutover rules
- **AND** SHALL NOT import, merge, remap, or preserve those records as backend data

#### Scenario: Clean-start utilities are imported
- **WHEN** active runtime imports localStorage-related code
- **THEN** the allowed import scope SHALL be limited to clean-start key detection/reset utilities
- **AND** SHALL NOT include repository implementations for migrated persistence

### Requirement: Tests prevent accidental localStorage reintroduction
The implementation SHALL include regression coverage that prevents migrated domains from returning to localStorage-backed persistence.

#### Scenario: Frontend tests run
- **WHEN** the frontend test suite is executed
- **THEN** tests SHALL verify active repository defaults, settings export sources, and migrated feature flows do not depend on localStorage repositories

#### Scenario: Legacy repository code remains for compatibility
- **WHEN** legacy repository code is retained temporarily
- **THEN** it SHALL be clearly quarantined as legacy/test-only
- **AND** SHALL NOT be reachable through active production bindings
