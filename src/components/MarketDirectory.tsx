import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, ArrowRight, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { Market } from '../types';
import { FutarchyHero3D } from './3d/FutarchyHero3D';
import { SpotlightCard } from './ui/SpotlightCard';
import { AnimatedCounter } from './ui/AnimatedCounter';

interface MarketDirectoryProps {
  markets: Market[];
  onSelectMarket: (id: number) => void;
  onNavigateTab: (tab: 'detail' | 'settlement' | 'methodology') => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  lastUpdated: string;
}

export const MarketDirectory: React.FC<MarketDirectoryProps> = ({
  markets,
  onSelectMarket,
  onNavigateTab,
  isLoading,
  error,
  onRetry,
  lastUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'treasury' | 'liquidation'>('all');

  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.ventureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toString() === searchQuery.trim();

      if (!matchesSearch) return false;

      if (statusFilter === 'settled') return m.settled;
      if (statusFilter === 'treasury') return m.ventureId === 7;
      if (statusFilter === 'liquidation') return m.title.toLowerCase().includes('liquidate');
      return true;
    });
  }, [markets, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-slate-900 animate-pulse rounded"></div>
          <div className="h-4 w-96 bg-slate-900 animate-pulse rounded"></div>
          <div className="grid grid-cols-1 gap-4 pt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse p-6"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-8 text-center max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-rose-300">Data Fetch Failure</h3>
          <p className="text-sm text-slate-300 mt-2 mb-6">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-xs font-medium text-slate-900 bg-rose-400 hover:bg-rose-300 rounded-lg transition-colors cursor-pointer"
          >
            Retry RPC Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Unified Hero Banner with Ambient Three.js Wave Field */}
      <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-slate-900/40 border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-sm">
        <FutarchyHero3D />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>FUTARCHY MULTIVERSE</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">BASE MAINNET (8453)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              Umia Decision Market Directory
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Discover and inspect real futarchy decision markets on Base. Every market trades conditional futures against the status quo (No-Op) to price governance proposals before binding onchain execution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 text-xs font-mono">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
              <span className="text-slate-400 block text-[10px]">VERIFIED MARKETS</span>
              <span className="font-semibold text-slate-100">{markets.length} Indexed</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
              <span className="text-slate-400 block text-[10px]">DATA FRESHNESS</span>
              <span className="text-emerald-400">{lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
        {/* Filter buttons - segmented control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-full sm:w-auto overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Markets ({markets.length})
          </button>
          <button
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'settled'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settled & Executed
          </button>
          <button
            onClick={() => setStatusFilter('treasury')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'treasury'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Umia Venture Treasury
          </button>
          <button
            onClick={() => setStatusFilter('liquidation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'liquidation'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Liquidation Markets
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search proposal or venture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
          />
        </div>
      </div>

      {/* Markets List */}
      {filteredMarkets.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">No decision markets matching "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 px-3 py-1.5 text-xs text-emerald-400 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMarkets.map((market) => {
            const winningProposal = market.proposals.find(
              (p) => p.id === market.winningProposalId
            );
            const noOpProposal = market.proposals.find((p) => p.isNoOp);

            return (
              <SpotlightCard
                key={market.id}
                className="p-6 transition-all"
                spotlightColor="rgba(52, 211, 153, 0.14)"
              >
                {/* Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="space-y-1">
                    {/* Unboxed metadata line with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {market.ventureName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Venture #{market.ventureId}</span>
                      <span aria-hidden="true">·</span>
                      <span>Market ID #{market.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{market.proposals.length} Conditional Outcomes</span>
                    </div>

                    <h2 className="text-lg font-semibold text-slate-100 hover:text-emerald-400 transition-colors">
                      <button
                        onClick={() => {
                          onSelectMarket(market.id);
                          onNavigateTab('detail');
                        }}
                        className="text-left cursor-pointer"
                      >
                        {market.title}
                      </button>
                    </h2>
                  </div>

                  {/* Actions & Links */}
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={`https://basescan.org/address/${market.contractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                    >
                      <span>Contract: {market.contractAddress.slice(0, 6)}...{market.contractAddress.slice(-4)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => {
                        onSelectMarket(market.id);
                        onNavigateTab('detail');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/60 rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow"
                    >
                      <span>Inspect Market</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body: Outcomes & Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                  {market.proposals.map((proposal) => {
                    const isWinner = proposal.id === market.winningProposalId;
                    return (
                      <div
                        key={proposal.id}
                        className={`p-3 rounded-lg border text-xs transition-colors ${
                          isWinner
                            ? 'bg-emerald-950/25 border-emerald-700/60 shadow-sm shadow-emerald-950/30'
                            : 'bg-slate-950/50 border-slate-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {proposal.isNoOp ? 'Baseline' : `Option #${proposal.id}`}
                          </span>
                          {isWinner && (
                            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Won</span>
                            </span>
                          )}
                        </div>

                        <p className="font-medium text-slate-200 line-clamp-2 h-8 leading-tight mb-2">
                          {proposal.isNoOp ? 'No-Op (Status Quo)' : proposal.title}
                        </p>

                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/60">
                          <span className="text-slate-400 text-[11px]">TWAP:</span>
                          <span className="font-mono tabular-nums font-semibold text-slate-100">
                            <AnimatedCounter value={proposal.twapUsd} decimals={4} prefix="$" /> {market.moneyTokenSymbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline text-[11px] text-slate-400 mt-0.5">
                          <span>Spot CPMM:</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            ${proposal.spotPriceUsd.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer: Settlement and Audit Summary */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-300 font-medium">
                      Status: {market.settled ? 'Settled & Finalized' : 'Trading'}
                    </span>
                    <span aria-hidden="true">·</span>
                    {market.settled && winningProposal && (
                      <span className="text-emerald-400">
                        Winner: <strong className="font-semibold">{winningProposal.isNoOp ? 'No-Op' : winningProposal.title}</strong>
                        {market.priceDeltaBps !== null && (
                          <span className="font-mono ml-1 text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                            +<AnimatedCounter value={market.priceDeltaBps / 100} decimals={2} suffix="%" /> vs No-Op
                          </span>
                        )}
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Threshold: {(market.winningThresholdBps / 100).toFixed(2)}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {market.settleTxHash && (
                      <a
                        href={`https://basescan.org/tx/${market.settleTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>Settle Tx</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {market.executeTxHash && (
                      <a
                        href={`https://basescan.org/tx/${market.executeTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>Execution Tx</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        onSelectMarket(market.id);
                        onNavigateTab('settlement');
                      }}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      View Settlement Breakdown →
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
