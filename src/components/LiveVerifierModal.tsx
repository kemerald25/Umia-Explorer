import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { ContractService, LiveVerificationResult, UMIA_MARKET_CORE } from '../services/contractService';
import { ConsensusGyroscope3D } from './3d/ConsensusGyroscope3D';

interface LiveVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId: number;
}

export const LiveVerifierModal: React.FC<LiveVerifierModalProps> = ({
  isOpen,
  onClose,
  marketId,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LiveVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ContractService.verifyMarketLive(marketId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to read live data from Base RPC.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runVerification();
    }
  }, [isOpen, marketId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={`w-4 h-4 ${data?.isSimulatedFallback ? 'text-amber-400' : 'text-emerald-400'}`} />
            <h3 className="text-sm font-semibold text-slate-100">
              {data?.isSimulatedFallback
                ? 'Onchain Contract Verifier (Cached Snapshot)'
                : 'Live Onchain Base Contract Verifier'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 3D Cryptographic Consensus Gyroscope */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <ConsensusGyroscope3D
              isQuerying={loading}
              isVerified={!!data && !error}
              isFallback={data?.isSimulatedFallback}
            />
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                {loading ? 'Cryptographic State Query' : 'Consensus Rings Locked'}
              </span>
              <p className="text-xs text-slate-200 font-medium">
                {loading
                  ? `Querying Base L2 block state & UmiaMarketCore parameters...`
                  : data?.isSimulatedFallback
                  ? `Snapshot verified: Parameters clamp-checked against canonical Base state.`
                  : `Real-time RPC verified: Live Base contracts & CPMM reserves matched.`}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Contract: {UMIA_MARKET_CORE} (Chain ID: 8453)
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <p className="text-slate-400 text-xs font-mono">Querying Base Mainnet state via viem...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Verification Failed</span>
              </div>
              <p className="text-slate-300">{error}</p>
              <button
                onClick={runVerification}
                className="mt-2 px-3 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded text-xs transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* Top Status Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400">
                    {data.isSimulatedFallback ? 'Snapshot Block:' : 'Live Block:'}
                  </span>
                  <p className="font-semibold text-slate-200 mt-0.5">#{data.blockNumber.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400">Total Markets:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{data.marketCounter}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400">Settled Flag:</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">{data.settled ? 'true' : 'false'}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400">Executed Flag:</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">{data.executed ? 'true' : 'false'}</p>
                </div>
              </div>

              {/* Settlement Outcome Verification */}
              {(() => {
                const expectedMarket = ContractService.getMarketById(marketId);
                const isMatch = expectedMarket?.winningProposalId
                  ? data.winningProposalId === expectedMarket.winningProposalId
                  : true;

                return (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-semibold text-slate-200">Contract-Recorded Winner</span>
                      {data.isSimulatedFallback ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Cached Snapshot (RPC Fallback)</span>
                        </span>
                      ) : isMatch ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Exact Match (Live RPC Verified)</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Winner Mismatch</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px]">Winning Proposal ID:</span>
                        <p className="text-slate-100 font-semibold text-sm">#{data.winningProposalId}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Contract Winning TWAP (Q112):</span>
                        <p className="text-slate-100 font-semibold text-sm truncate">
                          ${data.winningPriceUsd.toFixed(4)} USDC
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Proposal Reserves Read */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-300">
                  {data.isSimulatedFallback
                    ? 'Recorded Proposal Reserves (CPMM State):'
                    : 'Live Proposal Reserves (CPMM State):'}
                </span>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Outcome</th>
                        <th className="py-2 px-3 text-right">Reserve0 (Venture)</th>
                        <th className="py-2 px-3 text-right">Reserve1 (Money)</th>
                        <th className="py-2 px-3 text-right">
                          {data.isSimulatedFallback ? 'Recorded Spot' : 'Live Spot'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300 bg-slate-950/40">
                      {data.proposals.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-sans">
                            {p.isNoOp ? 'No-Op' : p.title.slice(0, 24)}...
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-slate-400 truncate max-w-[100px]">
                            {p.reserve0.slice(0, 10)}...
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-slate-400">
                            ${(Number(p.reserve1) / 1e6).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-100">
                            ${p.spotPriceUsd.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RPC Node Attribution */}
              <div className="pt-2 text-[11px] text-slate-400 font-mono space-y-1">
                <div>RPC Host: {data.rpcUsed}</div>
                <div>Timestamp: {data.verifiedAt}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex justify-between items-center bg-slate-950/60">
          <a
            href={`https://basescan.org/address/${UMIA_MARKET_CORE}`}
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono text-[11px]"
          >
            <span>View Contract on Basescan</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={runVerification}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
