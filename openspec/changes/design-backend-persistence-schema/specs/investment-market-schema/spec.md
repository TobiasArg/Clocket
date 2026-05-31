## ADDED Requirements

### Requirement: Investment assets are normalized
The persistence schema SHALL model tradable investment assets independently from positions, entries, and quote snapshots.

#### Scenario: Stock asset is persisted
- **WHEN** a stock investment is created or refreshed
- **THEN** the schema MUST represent asset type `stock` and normalized uppercase ticker

#### Scenario: Crypto asset is persisted
- **WHEN** a crypto investment is created or refreshed
- **THEN** the schema MUST represent asset type `crypto` and normalized uppercase ticker

### Requirement: Investment positions and entries preserve transaction history
The persistence schema SHALL model investment positions and entries so position state can be audited or recomputed from entries.

#### Scenario: Investment entry is added
- **WHEN** an investment entry is persisted
- **THEN** it MUST store entry type, invested USD amount, buy price, units/amount, timestamp, asset reference, and position reference

#### Scenario: Investment position is updated
- **WHEN** entries are added or removed
- **THEN** materialized position totals MUST be updated transactionally or be fully derivable from entries

#### Scenario: Investment entry creates transaction
- **WHEN** an investment buy/sell entry creates a financial transaction
- **THEN** the persisted investment entry MUST preserve a link to the generated transaction

### Requirement: Market quote snapshots are shared backend records
The persistence schema SHALL model market quote snapshots so refreshed provider prices can be reused across clients.

#### Scenario: Quote snapshot is saved
- **WHEN** a market quote is fetched successfully and persistence is enabled
- **THEN** the snapshot MUST store asset reference, price, source, fetched timestamp, provider timestamp if available, and optional bid/ask

#### Scenario: Latest quote is requested
- **WHEN** the backend needs the latest quote for an asset
- **THEN** the schema MUST support efficient lookup by asset and timestamp

### Requirement: Asset reference prices support daily and monthly comparisons
The persistence schema SHALL model daily and monthly reference prices for each asset.

#### Scenario: Daily reference changes
- **WHEN** a new quote belongs to a new local/reference day
- **THEN** the asset's daily reference price and timestamp MUST be updateable without losing the monthly reference

#### Scenario: Monthly reference changes
- **WHEN** a new quote belongs to a new month
- **THEN** the asset's monthly reference price and timestamp MUST be updateable transactionally with quote refresh state

### Requirement: Provider throttling state has a durable future path
The persistence schema SHALL leave room for persisted provider metadata or a durable cache/rate-limit store without requiring it in the first Prisma schema.

#### Scenario: Multi-instance deployment requires shared throttling
- **WHEN** backend quote refresh runs across multiple instances
- **THEN** a future change MUST define durable cache/rate-limit storage such as Redis or persisted provider metadata
