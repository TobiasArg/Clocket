## ADDED Requirements

### Requirement: Budgets support normalized scope rules
The persistence schema SHALL model budgets and their scope rules in relational tables that can validate category/subcategory overlap.

#### Scenario: Budget applies to all subcategories
- **WHEN** a budget scope rule uses `all_subcategories`
- **THEN** it MUST reference a category and MUST NOT require individual subcategory rows for that rule

#### Scenario: Budget applies to selected subcategories
- **WHEN** a budget scope rule uses `selected_subcategories`
- **THEN** it MUST persist the selected subcategory references as relational rows

#### Scenario: Overlapping budget is created
- **WHEN** a budget is created for a month and scope that overlaps an existing active budget
- **THEN** the domain service MUST reject it or require an explicit conflict-resolution policy

### Requirement: Goals preserve target and classification data
The persistence schema SHALL model goals with target amount, currency, deadline, visual metadata, optional category/subcategory relationship, and timestamps.

#### Scenario: Goal is created
- **WHEN** a goal is persisted
- **THEN** it MUST store title, target amount, currency, deadline date, icon, color key, and timestamps

#### Scenario: Goal category is synchronized
- **WHEN** goal creation requires category/subcategory synchronization
- **THEN** the goal and category/subcategory updates MUST be saved transactionally

### Requirement: Installment plans model generated transaction state
The persistence schema SHALL model installment plans with total amount, installment count, calculated installment amount, start month, paid installment count, optional category/subcategory, and generated transaction linkage.

#### Scenario: Installment plan is persisted
- **WHEN** a cuota/installment plan is created
- **THEN** it MUST store total amount, currency, installments count, installment amount, start month, paid installments count, and timestamps

#### Scenario: Installment transactions are materialized
- **WHEN** paid installment transactions are generated
- **THEN** generated transactions MUST link back to the installment plan and identify the installment sequence

#### Scenario: Installment plan changes
- **WHEN** an installment plan update changes category, account, or paid installment count
- **THEN** affected generated transactions MUST be updated inside the same database transaction

### Requirement: Settings remain single-profile until auth is specified
The persistence schema SHALL support application settings for the current single-profile mode without requiring authentication tables.

#### Scenario: Settings are persisted
- **WHEN** app settings are stored in the backend
- **THEN** currency, language, notifications, theme, profile display fields, avatar icon, and optional PIN hash MUST be representable

#### Scenario: Auth is still absent
- **WHEN** settings are implemented before auth
- **THEN** settings MUST NOT require a user foreign key until an auth OpenSpec change adds ownership

### Requirement: Analytics are derived from persisted domain rows
The persistence schema SHALL support analytics queries from normalized financial rows rather than storing frontend-only aggregates as the source of truth.

#### Scenario: Monthly balance is calculated
- **WHEN** analytics compute monthly balance
- **THEN** the computation MUST be derivable from transactions, accounts, and dates

#### Scenario: Category breakdown is calculated
- **WHEN** analytics compute category breakdown
- **THEN** the computation MUST be derivable from transaction category/subcategory relations and amounts
