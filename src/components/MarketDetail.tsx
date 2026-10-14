import React, { useState } from 'react';
import {
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Landmark,
  Scale,
} from 'lucide-react';
import { Market, SwapObservation } from '../types';
import { DexScreenerChart } from './DexScreenerChart';

interface MarketDetailProps {
  market: Market;
  swaps: SwapObservation[];
  onBack: () => void;
  onNavigateSettlement: () => void;
  onOpenVerifier: () => void;
}

export const MarketDetail: React.FC<MarketDetailProps> = ({
  market,
  swaps,
  onBack,
  onNavigateSettlement,
  onOpenVerifier,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'trades' | 'outcomes'>('chart');

  const noOpProposal = market.proposals.find((p) => p.isNoOp);
  const winningProposal = market.proposals.find((p) => p.id === market.winningProposalId);

  const startDate = new Date(market.tradingStart * 1000);
  const endDate = new Date(market.tradingEnd * 1000);
  const durationHours = Math.round((market.tradingEnd - market.tradingStart) / 3600);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Terminals</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenVerifier}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Live Onchain</span>
          </button>
        </div>
      </div>

      {/* Header Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2 max-w-3xl">
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{market.ventureName}</span>
              <span aria-hidden="true">·</span>
              <span>Market #{market.id}</span>
              <span aria-hidden="true">·</span>
              <span>Venture #{market.ventureId}</span>
              <span aria-hidden="true">·</span>
              <span>Trading Window: {durationHours} Hours</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-100 break-words">
              {market.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed pt-1">
              {market.descriptionContext}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg text-xs min-w-0">
              <span className="text-slate-400">Winning TWAP</span>
              <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-400 mt-1 truncate">
                ${market.winningPriceUsd?.toFixed(4)}
              </p>
              <span className="text-[10px] text-slate-400">Contract-averaged</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg text-xs min-w-0">
              <span className="text-slate-400">Baseline (No-Op)</span>
              <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-slate-200 mt-1 truncate">
                ${market.noOpPriceUsd?.toFixed(4)}
              </p>
              <span className="text-[10px] text-slate-400">Status Quo TWAP</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg text-xs col-span-2 sm:col-span-1 min-w-0">
              <span className="text-slate-400">Price Premium</span>
              <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-400 mt-1 truncate">
                +{((market.priceDeltaBps || 0) / 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-slate-400">Threshold: 2.00%</span>
            </div>
          </div>
        </div>

        {/* Detailed Contract & Protocol Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 text-xs text-slate-400">
          <div className="min-w-0">
            <span className="text-slate-400 font-medium">UmiaMarketCore Contract:</span>
            <a
              href={`https://basescan.org/address/${market.contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1 min-w-0"
            >
              <span className="truncate">{market.contractAddress}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          <div className="min-w-0">
            <span className="text-slate-400 font-medium">Trading Duration:</span>
            <p className="mt-1 text-slate-200 font-mono break-words">
              {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
              {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="min-w-0">
            <span className="text-slate-400 font-medium">Execution Delay:</span>
            <p className="mt-1 text-slate-200 font-mono">
              {market.executionDelay}s ({market.executionDelay / 3600}h timelock)
            </p>
          </div>

          <div className="min-w-0">
            <span className="text-slate-400 font-medium">Winning Outcome:</span>
            <p className="mt-1 text-emerald-400 font-semibold flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{winningProposal?.title}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Interactive Chart / Registered Outcomes / Trade Log */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'chart'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          DEXScreener Terminal ({swaps.length} Trades)
        </button>
        <button
          onClick={() => setActiveTab('outcomes')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'outcomes'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All {market.proposals.length} Registered Outcomes
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'trades'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Swaps Log ({swaps.length})
        </button>
      </div>

      {/* Tab 1: Chart View */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {swaps.length > 0 ? (
            <DexScreenerChart
              swaps={swaps}
              proposals={market.proposals}
              winningProposalId={market.winningProposalId}
              noOpTwap={market.noOpPriceUsd || 0.6279}
              winningTwap={market.winningPriceUsd || 0.6703}
            />
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
              Historical swap observations for this market were indexed at conclusion. Inspect the contract settlement records below.
            </div>
          )}

          {/* Pricing Legend & Concept Disambiguation */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">
              Understanding Price Metrics in Umia Futarchy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">1. Instantaneous Spot Price</span>
                <p className="leading-relaxed">
                  Derived directly from CPMM reserves ratio: <code className="text-slate-300 font-mono">reserve1 / reserve0</code>. Fluctuates after every single swap. Spot prices indicate real-time pressure, but do not determine market settlement.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-200">2. Time-Weighted Average (TWAP)</span>
                <p className="leading-relaxed">
                  Recorded in <code className="text-slate-300 font-mono">ConditionalMarketOracle</code>. Integrates price across all 48 hours in Q112 fixed-point precision with single-update clamping (0.4x to 2.5x) to eliminate last-minute price manipulation.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-200">3. Final Settlement & Threshold</span>
                <p className="leading-relaxed">
                  The highest non-No-Op TWAP must beat No-Op TWAP by at least the configured threshold (200 bps = 2.00%). Only winning proposal trades execute; all losing positions unwind 1:1.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Registered Outcomes Table */}
      {activeTab === 'outcomes' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">
              Proposal Outcomes & Onchain Accounting
            </h3>
            <span className="font-mono text-xs text-slate-400">
              Baseline No-Op: Proposal #{noOpProposal?.id}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Proposal</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">CPMM Spot Price</th>
                  <th className="py-3 px-4 text-right">Oracle TWAP</th>
                  <th className="py-3 px-4 text-right">Premium vs No-Op</th>
                  <th className="py-3 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {market.proposals.map((p) => {
                  const isWinner = p.id === market.winningProposalId;
                  const premiumBps = p.deltaBpsVsNoOp;
                  return (
                    <tr
                      key={p.id}
                      className={isWinner ? 'bg-emerald-950/20' : 'hover:bg-slate-800/30'}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-100">{p.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: #{p.id} · Virtual Tokens: vVenture #{p.virtualVentureId}, vMoney #{p.virtualMoneyId}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {p.isNoOp ? (
                          <span className="text-slate-400 font-mono">No-Op Baseline</span>
                        ) : (
                          <span className="text-slate-400 font-mono">Conditional Action</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                        ${p.spotPriceUsd.toFixed(4)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-100">
                        ${p.twapUsd.toFixed(4)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {p.isNoOp ? (
                          <span className="text-slate-400">0.00%</span>
                        ) : premiumBps !== undefined ? (
                          <span
                            className={
                              premiumBps >= market.winningThresholdBps
                                ? 'text-emerald-400 font-bold'
                                : premiumBps > 0
                                ? 'text-sky-400'
                                : 'text-rose-400'
                            }
                          >
                            {premiumBps > 0 ? '+' : ''}
                            {(premiumBps / 100).toFixed(2)}%
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isWinner ? (
                          <span className="text-emerald-400 font-semibold">Won & Executed</span>
                        ) : (
                          <span className="text-slate-400">Voided (Unwound)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Trades Log */}
      {activeTab === 'trades' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">
              Verified Swap Audit Trail ({swaps.length} Trades)
            </h3>
            <span className="font-mono text-xs text-slate-400">
              Indexed from UmiaMarketCore Swap Events
            </span>
          </div>

          <div className="overflow-x-auto max-h-[440px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 sticky top-0 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Time (UTC)</th>
                  <th className="py-2.5 px-4">Target Outcome</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Volume (USDC)</th>
                  <th className="py-2.5 px-4 text-right">Price Before</th>
                  <th className="py-2.5 px-4 text-right">Price After</th>
                  <th className="py-2.5 px-4 text-right">Impact</th>
                  <th className="py-2.5 px-4 text-right">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {swaps.map((s, idx) => (
                  <tr key={`${s.txHash}-${s.logIndex}`} className="hover:bg-slate-800/30 font-mono">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(s.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      <span className="text-slate-400">({new Date(s.timestamp * 1000).toLocaleDateString()})</span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-200 truncate max-w-[200px]">
                      {s.proposalTitle}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={
                          s.type === 'BUY_UMIA' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'
                        }
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-200">
                      ${s.volumeUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">
                      ${s.priceBefore.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-100">
                      ${s.priceAfter.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">
                      {(s.priceImpactBps / 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <a
                        href={`https://basescan.org/tx/${s.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1"
                      >
                        <span>{s.txHash.slice(0, 6)}...</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post-Settlement Governance Actions Card */}
      {market.executedPositions && market.executedPositions.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>Onchain Governance Execution & Live Treasury Yield</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Verified actions executed by <code className="text-slate-300 font-mono">GovernanceExecutor</code> against the venture treasury after proposal victory.
              </p>
            </div>

            {market.executeTxHash && (
              <a
                href={`https://basescan.org/tx/${market.executeTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/60 rounded-lg hover:bg-emerald-950/60 transition-colors font-mono"
              >
                <span>Execution Tx: {market.executeTxHash.slice(0, 8)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {market.executedPositions.map((pos) => (
              <div
                key={pos.address}
                className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 text-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-slate-400 text-[11px] font-mono">{pos.protocol}</span>
                    <h4 className="font-semibold text-slate-100 text-sm mt-0.5">{pos.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    APY: {pos.apy}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px]">Initial Allocated:</span>
                    <p className="text-slate-200 font-semibold">${pos.depositedUsd.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Current Asset Value:</span>
                    <p className="text-emerald-400 font-semibold">${pos.currentValueUsd.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Target Vault Address:</span>
                  <a
                    href={`https://basescan.org/address/${pos.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>{pos.address.slice(0, 6)}...{pos.address.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={onNavigateSettlement}
              className="px-4 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Examine Full Mathematical Settlement Breakdown →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
