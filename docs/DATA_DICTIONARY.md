# Data Dictionary: Umia Decision Market Explorer

This document defines every data field displayed by the Umia Decision Market Explorer, detailing its source of truth, mathematical interpretation, and formatting.

---

## 1. Market Identity & Configuration

| Field | Source | Interpretation & Formula | Format |
| :--- | :--- | :--- | :--- |
| **Market ID** | `UmiaMarketCore.marketInfo(id).id` | Unique sequential integer identifier assigned onchain at market creation. | Integer (`1`, `2`, `3`) |
| **Venture ID** | `UmiaMarketCore.marketInfo(id).ventureId` | Identifier of the project in `UmiaHub`. Venture #7 is Umia protocol. | Integer (`7`) |
| **Venture Name** | `UmiaHub.ventureById(ventureId).name` | Human-readable name registered at venture launch. | String (`"Umia"`, `"Koi3 TEST"`) |
| **Market Title** | `MarketCreated` event log / onchain metadata | The governance question presented to the decision market. | String (`"Put the treasury capital to work in yield on Base?"`) |
| **Contract Address** | Protocol Configuration | The `UmiaMarketCore` contract address handling the market. | Hex Address (`0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6`) |
| **Trading Start** | `UmiaMarketCore.marketInfo(id).tradingStart` | Unix timestamp (seconds) when conditional token swaps begin. | ISO 8601 UTC string & Unix timestamp |
| **Trading End** | `UmiaMarketCore.marketInfo(id).tradingEnd` | Unix timestamp (seconds) when conditional trading closes. | ISO 8601 UTC string & Unix timestamp |
| **Winning Threshold (Bps)** | `UmiaHub.winningMarketThresholdBps()` | Minimum percentage basis points by which a non-No-Op proposal's TWAP must exceed No-Op TWAP to win. | Basis Points (`200 bps` = `2.00%`) |
| **Execution Delay** | `UmiaHub.decisionMarketExecutionDelay()` | Time interval (seconds) after settlement before governance execution can be triggered. | Seconds (`14,400s` = 4 hours) |

---

## 2. Market Lifecycle & Status

| Field | Source | Interpretation & Logic | States |
| :--- | :--- | :--- | :--- |
| **Market Status** | `UmiaMarketCore.getMarketStatus(id)` | `PENDING` (before `tradingStart`), `OPEN` (active trading between start and end), `ENDED` (after `tradingEnd`). | `PENDING`, `OPEN`, `ENDED` |
| **Settlement Status** | `UmiaMarketCore.marketSettled(id)` | Boolean flag indicating whether `settleMarket(id)` has been executed onchain. | `Settled` or `Unsettled` |
| **Execution Status** | `UmiaMarketCore.marketExecuted(id)` | Boolean flag indicating whether `executeWinningProposal(id)` has been called and actions dispatched. | `Executed`, `Pending Delay`, or `No-Op (No Action)` |

---

## 3. Proposal & Price Information

| Field | Source | Interpretation & Formula | Format |
| :--- | :--- | :--- | :--- |
| **Proposal ID** | `UmiaMarketCore.marketProposalIds(id)` | Sequential identifier for the proposal outcome. | Integer (`5`, `6`, `7`, `8`) |
| **Proposal Title** | `UmiaMarketCore.proposalInfo(pid).title` | Specific proposal description (e.g. `"Full deployment: 50/50 on Aave & Steakhouse"`). | String |
| **Is No-Op** | `UmiaMarketCore.proposalInfo(pid).isNoOp` | Indicates whether this proposal represents the status quo (first proposal in list). | Boolean (`true`/`false`) |
| **Spot Price (Latest)** | `UmiaMarketCore.cpmmStates(pid)` | Instantaneous pool price derived from CPMM reserves: $\frac{\text{reserve1}}{\text{reserve0}} \times 10^{12}$ | USDC per token (`$0.7065`) |
| **TWAP (Q112)** | `UmiaMarketCore.getProposalTWAP(pid)` | Time-weighted average price accumulator in Q112.112 fixed-point notation. | Large Integer (e.g. `3480651723117441708594`) |
| **TWAP (Normalized)** | `winningProposalByMarketId` or Oracle calculation | TWAP scaled to dollar value: $\frac{\text{twapX112}}{2^{112}} \times 10^{12}$ | USDC per token (`$0.6703`) |
| **Price Delta vs No-Op** | `MarketSettled` event or calculated | Relative difference between proposal TWAP and No-Op TWAP: $\frac{\text{twap} - \text{noOp}}{\text{noOp}} \times 10{,}000$ | Basis Points and Percentage (`+675 bps` / `+6.75%`) |

---

## 4. Settlement & Governance Execution

| Field | Source | Interpretation | Example / Format |
| :--- | :--- | :--- | :--- |
| **Winning Proposal ID** | `UmiaMarketCore.winningProposalByMarketId(id).proposalId` | The proposal selected by `settle()` as the winning outcome. | `6` |
| **Settlement Tx** | `MarketSettled` event log | Onchain transaction that executed `settleMarket(id)`. | Tx Hash (`0xeb8c8177...`) |
| **Settlement Block** | `MarketSettled` event log | Block height at which settlement was finalized. | `51516867` |
| **Execution Tx** | `WinningProposalExecuted` event log | Onchain transaction that called `executeWinningProposal(id)`. | Tx Hash (`0xc2496ef7...`) |
| **Execution Plan Hash**| `GovernancePlanExecuted` event log | Keccak256 hash of the decoded and validated `ExecutionPlanV1` payload. | Bytes32 |
| **Treasury Actions** | `proposalExecutionPayload(pid)` decoded | Specific actions executed by `GovernanceExecutor` (e.g., transfers, approvals, vault deposits). | Decoded payload actions |
