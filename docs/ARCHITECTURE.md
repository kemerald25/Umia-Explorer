# Architecture: Umia Decision Market Explorer

## 1. Overview
Umia Decision Market Explorer is a read-only, developer-first intelligence dashboard built to inspect, verify, and understand futarchy decision markets on the Base network.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser View                      │
│   (React SPA, Tailwind CSS, Recharts, Lucide Icons)        │
│                                                             │
│   [Directory] ──── [Market Detail] ──── [Settlement Audit] │
│                           │                                 │
│                  [Methodology Guide]                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Data Access & Synchronization Layer           │
│                                                             │
│   1. Live Base RPC Reads (viem):                            │
│      - UmiaMarketCore (0x5597...29F6)                       │
│      - UmiaHub (0x120d...83F6)                              │
│      - ConditionalMarketOracle (0x114C...1d34)              │
│      - GovernanceExecutor (0x0Ba8...7E01)                   │
│                                                             │
│   2. High-Performance Historical Event Store:               │
│      - Complete 209-trade dataset for Market #3              │
│      - Exact block numbers, timestamps, & tx hashes         │
│                                                             │
│   3. Live Verifier Engine:                                  │
│      - Re-reads live onchain state on user request          │
│      - Live RPC fallback (mainnet.base.org / umia RPC)      │
└─────────────────────────────────────────────────────────────┘
```

## 2. Key Components
- **Market Directory (`MarketDirectory.tsx`)**: Filterable, searchable catalog displaying all verified markets with their status, trading window, latest prices, and settlement outcomes.
- **Market Detail (`MarketDetail.tsx`)**: Deep dive into individual proposals, dynamic No-Op comparison, spot vs. TWAP discrepancy, and interactive trade chart over time.
- **Settlement Breakdown (`SettlementBreakdown.tsx`)**: Transparent step-by-step mathematical breakdown showing exact TWAP formulas, Q112 conversion, threshold check ($\ge 200\text{ bps}$), and post-settlement treasury execution.
- **Methodology & Guide (`Methodology.tsx`)**: Protocol explainer covering futarchy, conditional tokens, the role of No-Op, TWAP manipulation defense, and execution delays.
- **Live Verifier Modal / Panel**: Directly queries live Base RPC to confirm that displayed values match contract state in real-time.

## 3. Security & Safety
- **100% Read-Only**: Zero wallet connection libraries or private key prompts. No transaction dispatching or user asset manipulation.
- **Real Verified Data**: All data points originate from Base mainnet smart contracts. Zero fabricated mock markets in production.
- **Truthful Degradation**: Clear labeling when data is indexed vs. read live onchain.
