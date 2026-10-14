# Research Findings: Umia Decision Markets Protocol

## 1. Network & Chain Verification
- **Network**: Base Mainnet
- **Chain ID**: `8453`
- **Primary Public RPC**: `https://mainnet.base.org`
- **Official Umia Base RPC**: `https://api.mainnet.umia.finance/api/v1/rpc/8453`
- **Block Explorer**: Basescan (`https://basescan.org`)

## 2. Verified Protocol Contract Registry (Base)
All addresses below were verified directly on Base mainnet via contract bytecode inspection, Hub registry lookup, and event history:

| Contract | Address | Role & Implementation |
| :--- | :--- | :--- |
| **UmiaHub** | `0x120dbCDd58Bb787309573e29159fE6D37A1983F6` | Central registry UUPS proxy. Manages venture IDs, protocol parameters, fee recipient, and pointers to other core modules. |
| **UmiaMarketCore** | `0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6` | Decision market engine proxy (implementation: `0xBc35cB6cCc4BE46AA491960EBf5281cD5310c653`). Deployed at block `50401541` (2026-08-24). Manages markets, proposal CPMM pools, virtual split/merge, TWAP queries, and settlement claims. |
| **UmiaMarketStake** | `0x1819093Ec7376384A659e1c4976CDbc52F5564b9` | Holds stake posted by venture creators to open decision markets. |
| **GovernanceExecutor** | `0x0Ba8b80Cc8B7E9804860f4D67b2E8051d1FD7E01` | Executes `ExecutionPlanV1` payloads against the venture treasury after the execution delay passes. |
| **ConditionalMarketOracle**| `0x114C446Ce246b6C5c432Eb001fBeB17864Fc1d34` | TWAP oracle computing time-weighted money-per-venture price in Q112.112 format, with 2.5x / 0.4x ratio clamping per update to resist manipulation. |
| **UmiaHook** | `0x128BedebaA9304Db74726efba848A98E7fB53A80` | Uniswap V4 hook attached to the spot pool. |
| **USDC** (Money Token) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Native Circle USDC on Base (6 decimals). |
| **UMIA Token** | `0x56ab53b77F07DA3af732150E8aeC4783eB5BbA7D` | Protocol venture #7 ERC-20 token (18 decimals). |
| **UMIA Venture Treasury** | `0x57fbe5581A16bf5384e5195f3DD8c8A876f4FB05` | Non-custodial beacon proxy holding venture assets. |
| **UMIA Spot Liquidity Vault** | `0x7d53251E1e10Fb95c0Fd4cE263c6CCEF2A55a353` | Canonical UMIA/USDC V4 LP vault. |

## 3. Discovered Onchain Markets
`marketCounter()` on UmiaMarketCore returns **3** markets:

### Market #1: "Liquidate the treasury?"
- **Venture**: #3 (Koi3 TEST, `0x815A39eB6Ec71b64a1866Af8Ab356Fb0cC6fAe1E`)
- **Creation Tx**: `0x3b6a293b939938a9d975eb7761e2867bee6ebbcbeafeef1a2405584376967d47` (Block `50436287`)
- **Proposals**:
  - Proposal 1: `"no-op"` (isNoOp: true)
  - Proposal 2: `"Liquidate: redeem LP, distribute the treasury pro-rata to holders"` (isNoOp: false)
- **Settlement Tx**: `0xb8fb9fe6b129d618d8732ad010abc94a45e21e67436feaedeee4b851fcf6b2cd` (Block `50438218`)
- **Winning Outcome**: Proposal 2 (Liquidate)
- **Execution Status**: Executed (`marketExecuted = true`)

### Market #2: "Liquidate the treasury?"
- **Venture**: #5 (Koi3 TEST, `0x8A4dB349159b99608aD04704705b14b27aD9116C`)
- **Creation Tx**: `0x485bd25dc639f0e077a75e9f3dc5cdbc2c510918c279c414053c577265ce055f` (Block `50436688`)
- **Proposals**:
  - Proposal 3: `"no-op"` (isNoOp: true)
  - Proposal 4: `"Liquidate: redeem LP, distribute the treasury pro-rata to holders"` (isNoOp: false)
- **Settlement Tx**: `0xd03dfcee6e19a8c289669afd939eebdc8836d9123f9db8ca1bfb851d0c0d1af4` (Block `50438668`)
- **Winning Outcome**: Proposal 4 (Liquidate)
- **Execution Status**: Executed (`marketExecuted = true`)

### Market #3: "Put the treasury capital to work in yield on Base?" (The Canonical September Treasury Market)
- **Venture**: #7 (Umia, `0x57fbe5581A16bf5384e5195f3DD8c8A876f4FB05`)
- **Creation Tx**: `0x9b34c91af841dab9d395bf5e116f140674fcbb8a2ab072a2b32ca3159905a60d` (Block `51430134`)
- **Trading Window**: `2026-09-17T13:00:00.000Z` to `2026-09-19T13:00:00.000Z` (48 hours)
- **Proposals & TWAP**:
  - **Proposal 5**: `"no-op"` (isNoOp: true) — TWAP: `3,260,362,326,647,779,548,984` Q112 ($0.6279 USDC)
  - **Proposal 6**: `"Full deployment: 50/50 on Aave & Steakhouse"` — TWAP: `3,480,651,723,117,441,708,594` Q112 ($0.6703 USDC) [WINNER]
  - **Proposal 7**: `"Full deployment: Aave & Gauntlet + Steakhouse"` — TWAP: `3,276,279,739,918,988,175,700` Q112 ($0.6310 USDC)
  - **Proposal 8**: `"Half deployment: Aave & Steakhouse"` — TWAP: `3,365,051,099,401,595,910,312` Q112 ($0.6481 USDC)
- **Settlement Tx**: `0xeb8c8177aa082327482a7431ffc1d31e52d2b10340acfe5d7ad13f9f1f09cb00` (Block `51516867`)
- **Price Delta**: $+6.75\%$ (675 bps) vs No-Op (exceeded snapshotted winning threshold of 200 bps / 2.00%)
- **Governance Execution Tx**: `0xc2496ef7e5383b6522b0dc22159b12974aad8c204c52be40fa44db19daf23811` (Block `51524217`)
- **Post-Settlement Treasury Outcome**: Deposited $2.234M USDC into Aave v3 USDC (`0x4e65fe4dba92790696d040ac24aa414708f5c0ab`) and $2.234M USDC into Morpho Steakhouse Prime USDC (`0xbeef0e0834849acc03f0089f01f4f1eeb06873c9`).
- **Trading Activity**: 209 individual swaps executed during the 48-hour trading window across the four proposal pools.

## 4. Settlement & Mathematical Mechanics
1. **Virtual Split/Merge**:
   - `split(marketId, ventureAmount, moneyAmount)` deposits real ERC-20 tokens and mints virtual venture and virtual money tokens for **every** proposal in the market (backed 1:1).
   - `merge(...)` burns equal virtual amounts from all proposals and returns the real tokens.
2. **CPMM Pricing**:
   - Each proposal has an internal Constant Product Market Maker (`reserve0 * reserve1 = k`).
   - `reserve0`: Virtual Venture tokens ($10^{18}$ decimals for UMIA).
   - `reserve1`: Virtual Money tokens ($10^6$ decimals for USDC).
   - Spot price $= \frac{\text{reserve1} \times 10^{12}}{\text{reserve0}}$.
3. **TWAP Accumulator**:
   - Time-weighted average in Q112 format: $\text{TWAP}_{Q112} = \frac{\int \text{price0}_{Q112} \, dt}{\text{tradingEnd} - \text{tradingStart}}$.
   - Converted to USDC per token: $\text{TWAP}_{\text{float}} = \frac{\text{TWAP}_{Q112}}{2^{112}} \times 10^{12}$.
4. **Winning Condition**:
   - Proposal must have higher TWAP than No-Op.
   - Price delta formula:
     $$\Delta_{\text{bps}} = \frac{(\text{highestTWAP} - \text{noOpTWAP}) \times 10{,}000}{\text{noOpTWAP}}$$
   - If $\Delta_{\text{bps}} \ge \text{winningThresholdBps}$ (e.g. 200 bps = 2%), that proposal wins.
   - If $\Delta_{\text{bps}} < \text{winningThresholdBps}$, the proposal fails to clear the bar and the market reverts to **No-Op**.
5. **Execution Delay**:
   - Once settled, an unskippable delay (`decisionMarketExecutionDelay = 14400` seconds / 4 hours) must elapse before `executeWinningProposal()` can be called.
   - `executeWinningProposal()` invokes `GovernanceExecutor.executeProposal()`, which decodes and validates the stored `ExecutionPlanV1` actions and executes them against the venture treasury.
