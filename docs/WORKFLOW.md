# Umia Decision Market Explorer: Complete Project Workflow & System Specification

This document details the end-to-end engineering workflow, architectural design, onchain contract verification, page-by-page functionality, and testing protocols implemented for the **Umia Decision Market Explorer** on the Base network (Chain ID: `8453`).

---

## 1. Project Overview & Objectives

**Umia Decision Market Explorer** is an open-source, developer-first, read-only diagnostic and educational platform for discovering, inspecting, analyzing, and verifying conditional futarchy decision markets on Base mainnet.

- **Primary Goal**: Make the mechanics of futarchy decision markets transparent, verifiable, and intuitive for developers, traders, and DAO participants.
- **Security Boundary**: Strictly 100% read-only. Zero wallet connection requirements, zero private key prompts, zero transaction execution privileges, and zero user asset manipulation.
- **Data Policy**: Zero fabricated mock markets. All data points originate from Base mainnet smart contracts and verified event logs.

---

## 2. Onchain Protocol Ground Truth (Base Mainnet, Chain ID 8453)

All contract addresses, block heights, and transactions were discovered and verified directly from the Base blockchain:

| Contract Component | Verified Address | Description & Network Role |
| :--- | :--- | :--- |
| **UmiaHub** | `0x120dbCDd58Bb787309573e29159fE6D37A1983F6` | Central protocol registry UUPS proxy. Manages venture IDs, protocol parameters, and pointers. |
| **UmiaMarketCore** | `0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6` | Core decision market engine proxy (implementation: `0xBc35cB6cCc4BE46AA491960EBf5281cD5310c653`). Deployed at block `50401541`. |
| **ConditionalMarketOracle** | `0x114C446Ce246b6C5c432Eb001fBeB17864Fc1d34` | TWAP oracle computing time-weighted prices in Q112.112 format with 0.4x – 2.5x ratio clamping. |
| **GovernanceExecutor** | `0x0Ba8b80Cc8B7E9804860f4D67b2E8051d1FD7E01` | Dispatches `ExecutionPlanV1` payloads to the venture treasury after the mandatory execution delay. |
| **UmiaMarketStake** | `0x1819093Ec7376384A659e1c4976CDbc52F5564b9` | Holds staker deposits required to initialize new decision markets. |
| **USDC (Money Token)** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Native Circle USDC on Base (6 decimals). |
| **UMIA Token** | `0x56ab53b77F07DA3af732150E8aeC4783eB5BbA7D` | Protocol venture #7 token (18 decimals). |
| **UMIA Venture Treasury** | `0x57fbe5581A16bf5384e5195f3DD8c8A876f4FB05` | Non-custodial beacon proxy holding venture assets. |
| **Spot Liquidity Vault** | `0x7d53251E1e10Fb95c0Fd4cE263c6CCEF2A55a353` | Canonical Uniswap V4 LP vault position. |

---

## 3. Discovered & Audited Onchain Markets

The protocol's `marketCounter()` returns 3 onchain decision markets:

### Market #1: "Liquidate the treasury?"
- **Venture**: #3 (Koi3 TEST, `0x815A39eB6Ec71b64a1866Af8Ab356Fb0cC6fAe1E`)
- **Creation Tx**: `0x3b6a293b939938a9d975eb7761e2867bee6ebbcbeafeef1a2405584376967d47` (Block `50436287`)
- **Settlement Tx**: `0xb8fb9fe6b129d618d8732ad010abc94a45e21e67436feaedeee4b851fcf6b2cd` (Block `50438218`)
- **Proposals**:
  - Proposal 1: `"no-op"` (TWAP: $0.03818)
  - Proposal 2: `"Liquidate: redeem LP, distribute treasury"` (TWAP: $0.05797) [WINNER]
- **Price Premium**: +51.84% (5,184 bps) vs. No-Op (cleared 200 bps threshold).

### Market #2: "Liquidate the treasury?"
- **Venture**: #5 (Koi3 TEST, `0x8A4dB349159b99608aD04704705b14b27aD9116C`)
- **Creation Tx**: `0x485bd25dc639f0e077a75e9f3dc5cdbc2c510918c279c414053c577265ce055f` (Block `50436688`)
- **Settlement Tx**: `0xd03dfcee6e19a8c289669afd939eebdc8836d9123f9db8ca1bfb851d0c0d1af4` (Block `50438668`)
- **Proposals**:
  - Proposal 3: `"no-op"` (TWAP: $0.03238)
  - Proposal 4: `"Liquidate: redeem LP, distribute treasury"` (TWAP: $0.04195) [WINNER]
- **Price Premium**: +29.56% (2,956 bps) vs. No-Op.

### Market #3: "Put the treasury capital to work in yield on Base?" (The Canonical September Market)
- **Venture**: #7 (Umia, `0x57fbe5581A16bf5384e5195f3DD8c8A876f4FB05`)
- **Creation Tx**: `0x9b34c91af841dab9d395bf5e116f140674fcbb8a2ab072a2b32ca3159905a60d` (Block `51430134`)
- **Trading Window**: Sept 17, 2026, 13:00 UTC → Sept 19, 2026, 13:00 UTC (48 Hours)
- **Proposals & TWAP**:
  - **Proposal 5**: `"no-op"` — TWAP: $0.6279 USDC (Q112: `3260362326647779548984`)
  - **Proposal 6**: `"Full deployment: 50/50 on Aave & Steakhouse"` — TWAP: $0.6703 USDC (Q112: `3480651723117441708594`) [WINNER]
  - **Proposal 7**: `"Full deployment: Aave & Gauntlet + Steakhouse"` — TWAP: $0.6310 USDC
  - **Proposal 8**: `"Half deployment: Aave & Steakhouse"` — TWAP: $0.6481 USDC
- **Settlement Tx**: `0xeb8c8177aa082327482a7431ffc1d31e52d2b10340acfe5d7ad13f9f1f09cb00` (Block `51516867`)
- **Price Delta**: $+6.75\%$ (675 bps) vs. No-Op (cleared 200 bps threshold).
- **Execution Timelock**: 14,400 seconds (4 hours).
- **Governance Execution Tx**: `0xc2496ef7e5383b6522b0dc22159b12974aad8c204c52be40fa44db19daf23811` (Block `51524217`).
- **Post-Settlement Positions**: Live deposits of $2.234M USDC into Aave v3 USDC and $2.234M USDC into Morpho Steakhouse Prime USDC.
- **Activity**: 209 verified onchain swaps indexed across the trading window.

---

## 4. Complete Engineering Workflow & Step-by-Step History

### Step 1: Protocol Reconnaissance & Contract Inspection
- Queried Base mainnet RPC directly to verify contracts and inspect storage.
- Extracted `marketCounter() = 3` and traced the market creation block range (#50401541 to #51525000).
- Reverse-engineered the `ExecutionPlanV1` payload dispatched in the execution transaction.

### Step 2: Trade Event Extraction & Price Inversion Fix
- Extracted all 209 historical `Swap` logs for Market #3 directly from the `UmiaMarketCore` contract.
- **Identified & Fixed Inversion Bug**:
  In `CPMM.sol`, `priceBeforeX96` is emitted relative to the swap direction:
  - If `zeroForOne == true` (selling UMIA for USDC): `priceX96 = (reserve1 * Q96) / reserve0` (already in USDC).
  - If `zeroForOne == false` (buying UMIA with USDC): `priceX96 = (reserve0 * Q96) / reserve1` (in UMIA per USDC, inverted by $10^{12}$ decimal offset).
  Normalized all trades so prices accurately reflect the true dollar valuation of UMIA ($0.6023 to the verified market peak of $0.7065).

### Step 3: TradingView Lightweight Charts (DEXScreener Engine)
- Replaced basic charts with TradingView’s official `lightweight-charts` v5 library (the same engine used by DEXScreener, Uniswap, and DexTools).
- Integrated multi-resolution candle aggregation (**`15m`**, **`30m`**, **`1h`**, **`2h`**, **`4h`**).
- Added real-time crosshair legend (O, H, L, C, Volume, Price Change %), EMA 7, EMA 25, Volume histogram bars, and horizontal TWAP price lines.

### Step 4: Hub Navigation Architecture (Replacing Fixed-ID Tabs)
- Transitioned the app from targeting a single hardcoded market ID to **Directory Hubs**:
  - **Trading Terminals Hub**: Displays cards for all markets with pairs, TWAPs, and a "Launch Terminal" button.
  - **Settlement Audits Hub**: Displays cards for all settled markets with winning proposals, price premiums, and an "Inspect Audit" button.
  - Clean breadcrumbs (**`← Back to All Terminals`**, **`← Back to All Settlement Audits`**) allow effortless switching.

### Step 5: Full Mobile Responsiveness & Hamburger Drawer
- Built a mobile hamburger menu (`Menu` / `X` toggle) for smartphone and tablet viewports.
- Added a slide-down mobile drawer with touch-friendly hit areas (min 44px), network status indicator, and quick actions.
- Configured dynamic canvas height adjustments (`360px` on mobile, `480px` on desktop) with `ResizeObserver` listener.

### Step 6: Multi-RPC CORS Resilience
- Fixed browser `Failed to fetch` errors caused by Umia’s CloudFront server restricting CORS to `app.umia.finance`.
- Configured `viem` with an automatic `fallback()` transport across public Base mainnet RPCs with explicit `Access-Control-Allow-Origin: *` headers (`base-rpc.publicnode.com`, `mainnet.base.org`, `base.llamarpc.com`, `1rpc.io/base`).

### Step 7: Scroll Restoration & Overflow Elimination
- Implemented automatic scroll restoration (`window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`) on every tab change so users never start at the bottom of a new page.
- Added `overflow-x-hidden` on the main wrapper, `overflow-x-auto scrollbar-none` on tab button rows and filter bars, and text truncation on select dropdowns.

---

## 5. What Is Working Across All Pages & Components

### Page 1: Markets Directory (`activeTab: 'directory'`)
- **Features**:
  - Catalog of all 3 Base mainnet decision markets.
  - Real-time search by proposal title, venture name, or market ID.
  - Segmented status filters: `All Markets`, `Settled & Executed`, `Umia Venture Treasury`, `Liquidation Markets`.
  - Unboxed metadata displaying venture name, outcome count, trading window, and status.
  - Grid preview cards displaying TWAP and spot CPMM prices for every conditional outcome.
  - Basescan direct links to contract addresses and settlement transactions.
  - 1-click navigation to inspect either the Terminal or Settlement Audit for any market.

### Page 2: Trading Terminals Hub (`activeTab: 'terminal-list'`)
- **Features**:
  - Central terminal selection dashboard.
  - Displays trading pair tickers (`UMIA / USDC`, `KOI3 / USDC`).
  - Previews winning TWAP vs. No-Op baseline and outcome price deltas.
  - "Launch Terminal" button on each card transitions directly into the full DEXScreener terminal.

### Page 3: DEXScreener Candlestick Terminal (`activeTab: 'terminal-detail'`)
- **Features**:
  - **Full TradingView Lightweight Charts Canvas**:
    - Pan by clicking and dragging.
    - Zoom by scrolling with mouse or pinch-to-zoom on touchscreens.
    - Double-click or reset button to auto-fit content.
  - **Timeframe Selector**: Toggle between `15m`, `30m`, `1h`, `2h`, and `4h` candlestick aggregations.
  - **Outcome Switcher**: Dropdown to toggle between Option #6 (Full 50/50), Option #5 (No-Op), Option #7 (Gauntlet), and Option #8 (Half).
  - **DEXScreener Ticker Ribbon**: Live hover stats for Open, High, Low, Close, Volume, and Change ($ and %).
  - **Technical Overlays**:
    - EMA 7 (Amber line) and EMA 25 (Purple line).
    - Volume histogram sub-chart with green/red transparency.
    - Settlement TWAP ($0.6703) and No-Op baseline ($0.6279) horizontal benchmark lines.
  - **Sub-Tabs**:
    - `DEXScreener Terminal`: The live chart.
    - `All Registered Outcomes`: Detailed tabular accounting of virtual venture and virtual money reserves.
    - `Audit Swaps Log`: Chronological table of all 209 trades with transaction hashes and volume.
  - **Breadcrumb**: `← Back to All Terminals` returns to the terminal hub instantly.

### Page 4: Settlement Audits Hub (`activeTab: 'settlement-list'`)
- **Features**:
  - Central settlement registry listing all concluded decision markets.
  - Displays winning outcome title, TWAP dollar value, baseline No-Op TWAP, and percentage price premium.
  - Direct Basescan transaction links for both market settlement and governance execution.
  - "Inspect Audit" button opens the complete mathematical proof for the chosen market.

### Page 5: Settlement Breakdown & Invariant Audit (`activeTab: 'settlement-detail'`)
- **Features**:
  - **Verification Banner**: Shows official onchain victory certification.
  - **Step-by-Step Mathematical Proof**:
    - Step 1: No-Op baseline TWAP with raw Q112 value (`3260362326647779548984`).
    - Step 2: Leading proposal TWAP with raw Q112 value (`3480651723117441708594`).
    - Step 3: Threshold test checking $\Delta_{\text{bps}} \ge 200\text{ bps}$.
  - **Contract Code Walkthrough**: Syntax-highlighted Solidity logic from `SettlementLib.sol`.
  - **Solvency Invariant Proof**: Verifies real escrowed tokens cover maximum claimable virtual supply.
  - **Transaction Trail**: Onchain creation, settlement, and governance execution transaction links.
  - **Post-Settlement Yield Positions**: Breakdown of the $2.12M Aave v3 deposit and $2.24M Morpho Steakhouse vault deposit.
  - **Breadcrumb**: `← Back to All Settlement Audits` returns to the settlements list.

### Page 6: How It Works / Protocol Guide (`activeTab: 'methodology'`)
- **Features**:
  - Core futarchy concepts: Pricing outcomes vs. counting votes.
  - Virtual token split & merge architecture.
  - The neutral benchmark role of No-Op.
  - TWAP accumulation and 0.4x – 2.5x oracle ratio clamping.
  - Decoupling of market settlement vs. governance action execution (4-hour timelock).
  - Direct links to primary documentation, GitHub repo, and Basescan contracts.

### Feature 7: Live Onchain Base Contract Verifier Modal
- **Features**:
  - Triggered via the **"Verify Onchain"** button in the header from any page.
  - Directly queries Base mainnet RPC live using `viem`’s multi-endpoint fallback transport.
  - Displays live Base block height (e.g. `#52,601,800+`).
  - Reads `marketCounter()`, `activeUnsettledMarketCount()`, `marketSettled()`, and `marketExecuted()` live.
  - Reads raw CPMM reserves (`reserve0`, `reserve1`) for all proposals directly from contract storage.
  - Compares onchain values against explorer values to prove 100% data integrity.

### Feature 8: Responsive Navigation & Mobile Drawer
- **Features**:
  - Sticky glassmorphic top bar with brand wordmark and Base (8453) network status.
  - Desktop pill navigation with icons and active state highlights.
  - Mobile hamburger toggle button with slide-down menu drawer.
  - Touch-friendly large hit targets.
  - Instant scroll-to-top on all page transitions.

---

## 6. Verification & Test Suite Results

### Automated Unit Tests (`npm test`)
Run via `vitest run`, passing 6/6 tests:
1. `correctly validates Market #3 settlement math and winning proposal` — Validates Proposal 6 achieves +6.75% (675 bps) and clears the 200 bps threshold.
2. `correctly reverts to No-Op when a proposal fails the threshold barrier` — Validates fallback to No-Op when delta < 200 bps.
3. `correctly wins if price delta exactly equals winning threshold (boundary case)` — Validates boundary condition (delta == threshold).
4. `accurately parses Q112.112 TWAP to dollar values` — Validates conversion of Q112 BigInts to float USDC prices.
5. `verifies historical swaps integrity for Market #3` — Validates chronological sequence of all 209 trades from block #51430502 to #51516674.
6. `confirms contract solvency invariant from onchain data` — Validates real token balances strictly cover claimable claims.

### Code Quality & Build Verification
- **Linter**: `npm run lint` (`tsc --noEmit`) passes with **0 errors**.
- **Compilation**: `compile_applet` builds successfully.
- **Dev Server**: Running on port 3000.
