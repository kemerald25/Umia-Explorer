import React from 'react';
import { ExternalLink, BookOpen, Scale, ShieldAlert, Cpu, Database } from 'lucide-react';
import { UMIA_MARKET_CORE, UMIA_HUB, CONDITIONAL_ORACLE, GOVERNANCE_EXECUTOR } from '../services/contractService';

export const Methodology: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Protocol Architecture & Educational Reference</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Methodology & Protocol Mechanics
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          How Umia uses conditional futarchic decision markets to govern venture treasuries, allocate capital, and execute binding smart-contract actions on Base.
        </p>
      </div>

      {/* 4 Core Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. What is a Decision Market? */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Scale className="w-4 h-4" />
            <span>01. Decision Markets (Futarchy)</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            Governance by Pricing Outcomes, Not Counting Votes
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Traditional DAO governance asks: <em className="text-slate-100">"What do you prefer?"</em> Preferences are free and easily distorted by voter apathy or bribery. Umia asks: <em className="text-slate-100">"What do you believe, enough to risk capital on it?"</em>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            For each proposal, conditional markets estimate what the venture’s token would be worth under each potential future. The outcome the market values highest is the one that executes.
          </p>
        </div>

        {/* 2. Split / Merge & Conditional Tokens */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Cpu className="w-4 h-4" />
            <span>02. Split & Merge Architecture</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            One Deposit Across Every Outcome Simultaneously
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            When a participant deposits tokens via <code className="text-slate-200 font-mono">split()</code>, the contract mints matching virtual venture and virtual money tokens for <strong>every outcome</strong>, backed 1:1 by real escrowed tokens.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Traders can back their preferred outcome and hedge others. Because only the winning outcome’s trades materialize at settlement, positions in losing markets unwind with no realized capital loss.
          </p>
        </div>

        {/* 3. The Meaning of No-Op */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>03. The Role of No-Op</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            Status Quo as the Benchmark for Change
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every decision market contains a mandatory <strong className="text-slate-100">No-Op</strong> proposal (Proposal #0 in storage). It prices the venture token conditional on no proposal passing.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Even if Proposal A receives more trading volume than Proposal B, Proposal A will <strong>not win</strong> unless it also outperforms the No-Op baseline by the configured threshold (2.00%). If no proposal clears the bar, the market defaults to No-Op and leaves the status quo intact.
          </p>
        </div>

        {/* 4. TWAP & Oracle Clamping */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>04. Oracle Clamping & TWAP</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            Defending Against Last-Minute Manipulation
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Spot prices can be moved with sudden capital before close. To eliminate this, settlement uses the time-weighted average price (<code className="text-slate-200 font-mono">ConditionalMarketOracle</code>) accumulated over the entire trading window.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Furthermore, the oracle contract clamps price observations to between <strong className="text-slate-200">0.4x and 2.5x</strong> of the prior accepted observation, ensuring single-block flash spikes cannot skew the TWAP accumulator.
          </p>
        </div>
      </div>

      {/* Governance Execution vs. Market Settlement */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="text-base font-semibold text-slate-100">
          The Distinction Between Market Settlement & Governance Execution
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          In Umia’s protocol design, market settlement and governance action execution are two decoupled, distinct steps:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-lg space-y-2 text-xs">
            <span className="font-semibold text-slate-200">Phase 1: Settlement (`settleMarket`)</span>
            <p className="text-slate-400 leading-relaxed">
              Called permissionlessly once <code className="text-slate-300 font-mono">block.timestamp &gt;= tradingEnd</code>. It queries the TWAPs, calculates whether the threshold was cleared, marks the winning proposal, returns unused escrowed liquidity to the spot vault, and starts the execution delay clock.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-lg space-y-2 text-xs">
            <span className="font-semibold text-slate-200">Phase 2: Execution (`executeWinningProposal`)</span>
            <p className="text-slate-400 leading-relaxed">
              Enforces a mandatory 14,400-second (4-hour) timelock (<code className="text-slate-300 font-mono">decisionMarketExecutionDelay</code>). Only after this timelock expires can <code className="text-slate-300 font-mono">GovernanceExecutor.executeProposal()</code> be invoked to execute the atomic plan against the venture treasury.
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources and Methodology */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Explorer Data Sources & Update Methodology</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The Umia Decision Market Explorer adheres strictly to a zero-mock, real-data policy:
        </p>

        <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5">
          <li>
            <strong className="text-slate-200">Base Onchain Reads:</strong> All contract state, proposal titles, CPMM reserves, TWAPs, and settlement statuses are queried via <code className="text-slate-300 font-mono">viem</code> from the Base mainnet network.
          </li>
          <li>
            <strong className="text-slate-200">Historical Event Log Index:</strong> Swap logs, market creation events, and settlement transactions were extracted from Base block range #50401541 to #51525000 and verified against Basescan.
          </li>
          <li>
            <strong className="text-slate-200">Live Verification Engine:</strong> Users can click "Verify Onchain" at any time to run live contract reads against Base RPC, validating that displayed parameters match live contract state.
          </li>
          <li>
            <strong className="text-slate-200">Read-Only Safety:</strong> The application does not request wallet connection or transaction signing privileges.
          </li>
        </ul>
      </div>

      {/* Official Primary Sources */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 lg:p-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Official Protocol Links & Documentation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <a
            href="https://umia.finance/docs/decision-markets"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors flex justify-between items-center"
          >
            <span>Decision Markets Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://github.com/umiafinance/protocol"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors flex justify-between items-center"
          >
            <span>Official GitHub Repo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://umia.finance/blog/reading-the-trades"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors flex justify-between items-center"
          >
            <span>"Reading the Trades" Post</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://basescan.org/address/${UMIA_MARKET_CORE}`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors flex justify-between items-center"
          >
            <span>UmiaMarketCore Basescan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
