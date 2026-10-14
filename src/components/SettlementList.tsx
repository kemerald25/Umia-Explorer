import React from 'react';
import { Market } from '../types';
import { Calculator, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

interface SettlementListProps {
  markets: Market[];
  onSelectSettlement: (marketId: number) => void;
  onOpenVerifier: () => void;
}

export const SettlementList: React.FC<SettlementListProps> = ({
  markets,
  onSelectSettlement,
  onOpenVerifier,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Calculator className="w-4 h-4 text-sky-400" />
            <span>Onchain Settlement Audits</span>
            <span aria-hidden="true">·</span>
            <span>Mathematical Verifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Settlement Audit Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Select any concluded decision market below to review its complete onchain settlement proof, Q112.112 TWAP calculations, threshold comparison, and post-settlement execution trail.
          </p>
        </div>

        <button
          onClick={onOpenVerifier}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition-colors cursor-pointer self-start md:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verify Live on Base</span>
        </button>
      </div>

      {/* Settlements Table & Cards */}
      <div className="space-y-4">
        {markets.map((m) => {
          const winner = m.proposals.find((p) => p.id === m.winningProposalId);
          const noOp = m.proposals.find((p) => p.isNoOp);
          const deltaBps = m.priceDeltaBps || 0;
          const isFeatured = m.id === 3;

          return (
            <div
              key={m.id}
              className={`bg-slate-900/70 border rounded-xl p-6 transition-all hover:border-slate-700 ${
                isFeatured
                  ? 'border-emerald-800/80 ring-1 ring-emerald-500/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Info & Title */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{m.ventureName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Market #{m.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-medium">Status: Settled & Finalized</span>
                    {isFeatured && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                          CANONICAL TREASURY AUDIT
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    "{m.title}"
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {m.descriptionContext}
                  </p>
                </div>

                {/* Right: Math Summary & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Winning TWAP:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        ${m.winningPriceUsd?.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">No-Op TWAP:</span>
                      <span className="text-slate-300 font-bold text-sm">
                        ${m.noOpPriceUsd?.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">Premium vs No-Op:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        +{(deltaBps / 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectSettlement(m.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
                  >
                    <span>Inspect Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Transaction & Result Meta */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-300">
                    Winner: <strong className="text-emerald-400 font-semibold">{winner?.title}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Threshold Cleared: ≥ {(m.winningThresholdBps / 100).toFixed(2)}%</span>
                </div>

                <div className="flex items-center gap-4 font-mono text-[11px]">
                  {m.settleTxHash && (
                    <a
                      href={`https://basescan.org/tx/${m.settleTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>Settle: {m.settleTxHash.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {m.executeTxHash && (
                    <a
                      href={`https://basescan.org/tx/${m.executeTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>Execute: {m.executeTxHash.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
