import React from 'react';
import { Market } from '../types';
import { BarChart3, ArrowRight, TrendingUp, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';
import { AnimatedCounter } from './ui/AnimatedCounter';

interface TerminalListProps {
  markets: Market[];
  onSelectTerminal: (marketId: number) => void;
}

export const TerminalList: React.FC<TerminalListProps> = ({
  markets,
  onSelectTerminal,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Trading Terminals</span>
            <span aria-hidden="true">·</span>
            <span>DEXScreener Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Select a Decision Market Terminal
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Choose any conditional decision market below to launch its interactive DEXScreener candlestick terminal, inspect real-time candle OHLCV data, and compare outcomes against No-Op.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          <span>{markets.length} Markets Available</span>
        </div>
      </div>

      {/* Terminal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((m) => {
          const winner = m.proposals.find((p) => p.id === m.winningProposalId);
          const noOp = m.proposals.find((p) => p.isNoOp);
          const isFeatured = m.id === 3;

          return (
            <SpotlightCard
              key={m.id}
              spotlightColor={isFeatured ? 'rgba(52, 211, 153, 0.18)' : 'rgba(56, 189, 248, 0.12)'}
              className={`p-5 flex flex-col justify-between transition-all ${
                isFeatured
                  ? 'border-emerald-800/80 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-4">
                {/* Top Badge & Pair */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 text-base">
                        {m.tokenSymbol} / {m.moneyTokenSymbol}
                      </span>
                      {isFeatured && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                          CANONICAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      {m.ventureName} · Market #{m.id}
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {m.proposals.length} Outcomes
                  </span>
                </div>

                {/* Market Question */}
                <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                  "{m.title}"
                </h3>

                {/* Pricing Snapshot */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 font-mono text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Winning TWAP:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      <AnimatedCounter value={m.winningPriceUsd || 0} decimals={4} prefix="$" />
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">No-Op Baseline:</span>
                    <span className="text-slate-200 font-bold text-sm">
                      <AnimatedCounter value={m.noOpPriceUsd || 0} decimals={4} prefix="$" />
                    </span>
                  </div>
                </div>

                {/* Outcomes list preview */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">Available Outcomes:</span>
                  <div className="space-y-1">
                    {m.proposals.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center text-[11px] text-slate-300 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40"
                      >
                        <span className="truncate max-w-[170px]">
                          {p.isNoOp ? 'Option #0 (No-Op)' : p.title}
                        </span>
                        <span className="font-mono text-slate-400">${p.twapUsd.toFixed(4)}</span>
                      </div>
                    ))}
                    {m.proposals.length > 3 && (
                      <div className="text-[10px] text-slate-400 text-right pr-1">
                        +{m.proposals.length - 3} more outcome
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>+<AnimatedCounter value={(m.priceDeltaBps || 0) / 100} decimals={2} suffix="%" /> vs No-Op</span>
                </span>

                <button
                  onClick={() => onSelectTerminal(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  <span>Launch Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
};
