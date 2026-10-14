# Umia Decision Market Explorer

**Umia Decision Market Explorer** is an open-source, read-only developer dashboard that makes Umia’s futarchy decision markets on the Base network easy to discover, inspect, understand, and verify.

This is a strictly educational and diagnostic tool: it contains zero wallet connection libraries, executes no transactions, places no trades, and manages no private keys.

---

## Verified Protocol Architecture & Contracts (Base Mainnet, Chain ID 8453)

All contract addresses below were verified directly against onchain bytecode, registry mappings, and event logs on Base:

- **UmiaHub**: `0x120dbCDd58Bb787309573e29159fE6D37A1983F6` (Central registry UUPS proxy)
- **UmiaMarketCore**: `0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6` (Decision market engine proxy, deployed at block `50401541`)
- **ConditionalMarketOracle**: `0x114C446Ce246b6C5c432Eb001fBeB17864Fc1d34` (TWAP oracle over conditional pools with 2.5x / 0.4x ratio clamping)
- **GovernanceExecutor**: `0x0Ba8b80Cc8B7E9804860f4D67b2E8051d1FD7E01` (Executes winning payloads against the venture treasury after a 4-hour delay)
- **UMIA Token**: `0x56ab53b77F07DA3af732150E8aeC4783eB5BbA7D` (18 decimals)
- **USDC (Money Token)**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Native Base USDC, 6 decimals)
- **UMIA Venture Treasury**: `0x57fbe5581A16bf5384e5195f3DD8c8A876f4FB05` (Venture #7 noncustodial treasury)
- **Spot Liquidity Vault**: `0x7d53251E1e10Fb95c0Fd4cE263c6CCEF2A55a353` (Uniswap V4 canonical position)

---

## Features

### 1. Market Directory
- Lists real Umia decision markets on Base.
- Displays venture names, proposal questions, market IDs, contract addresses, trading windows, and outcome statuses.
- Real-time search by proposal title or venture name.
- Segmented status filters (All, Settled & Executed, Treasury Yield, Liquidation).
- Unboxed typographic metadata adhering to anti-slop guidelines.

### 2. Market Detail & DEXScreener Candlestick Terminal
- In-depth inspection of any market (including Market #3: the September treasury deployment market).
- Powered by **TradingView Lightweight Charts** (the exact canvas charting library used by DEXScreener and Uniswap).
- Interactive timeframes (**15m**, **30m**, **1h**, **2h**, **4h**), smooth click-and-drag panning, scroll-to-zoom, and responsive layout.
- Real-time crosshair inspection displaying Open, High, Low, Close, Volume, and Percentage Change.
- Overlays for **EMA 7**, **EMA 25**, **Volume Histogram**, and horizontal **TWAP Benchmark Price Lines** ($0.6703 settlement TWAP & $0.6279 No-Op baseline).
- Outcome switcher allowing instant comparison across all proposals (Options #6, #5, #7, #8).

### 3. Settlement Breakdown & Invariant Audit
- Detailed step-by-step mathematical explanation of the settlement calculation from `SettlementLib.sol`.
- Q112.112 fixed-point conversion to dollar values.
- Price delta calculation against No-Op baseline:
  $$\Delta_{\text{bps}} = \frac{(\text{highestTWAP} - \text{noOpTWAP}) \times 10{,}000}{\text{noOpTWAP}}$$
- Validation against the snapshotted winning threshold (200 bps = 2.00%).
- Verification of the 4-hour execution delay timelock (14,400s) and subsequent `GovernanceExecutor` transaction (`0xc2496ef7...`).
- Post-settlement treasury outcome audit: Verifiable live deposits in Aave v3 USDC ($2.12M) and Morpho Steakhouse Prime USDC ($2.24M).
- Contract solvency invariant proof: $\text{realTokenBalance} + \text{lpRemovalInfo} \ge \max(\text{userVirtualSupply})$.

### 4. Methodology & Protocol Guide
- Clear educational guide explaining decision markets, conditional tokens, the role of No-Op, TWAP accumulation, and oracle ratio clamping.
- Decoupling of market settlement vs. governance plan execution.
- Links to official Umia documentation, GitHub protocol repository, and Basescan.

### 5. Live Onchain Verifier
- Users can click "Verify Onchain" from any page to perform an instantaneous live RPC check against Base Mainnet (`UmiaMarketCore` at `0x5597...29F6`).
- Queries live block number, contract settlement flag, execution flag, winning proposal ID, Q112 TWAP, and raw CPMM reserves.

---

## Technical Documentation

Detailed technical documents are located in `/docs`:
- `docs/RESEARCH_FINDINGS.md`: Network verification, contract registry, discovered markets, and onchain trade analysis.
- `docs/DATA_DICTIONARY.md`: Definition, source of truth, mathematical formula, and format for every field.
- `docs/ARCHITECTURE.md`: Technical architecture and data access pipeline.
- `docs/LIMITATIONS.md`: Known boundaries, RPC public limits, and protocol constraints.

---

## Local Development & Setup

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Run Unit Tests
```bash
npm test
```
Runs 6 automated tests validating settlement math, Q112 scaling, boundary thresholds, solvency invariants, and historical swap datasets.

### Build for Production
```bash
npm run build
```

---

## Verification
- **Linter**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Unit Tests**: `npm test` passes 6/6 tests.
- **Compiler**: `compile_applet` builds successfully.
