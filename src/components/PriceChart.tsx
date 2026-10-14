import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { SwapObservation, Proposal } from '../types';

interface PriceChartProps {
  swaps: SwapObservation[];
  proposals: Proposal[];
  winningProposalId: number | null;
  noOpTwap: number;
  winningTwap: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  swaps,
  proposals,
  winningProposalId,
  noOpTwap,
  winningTwap,
}) => {
  const [selectedProposals, setSelectedProposals] = useState<number[]>([5, 6, 7, 8]);
  const [showTwapLines, setShowTwapLines] = useState<boolean>(true);

  // Group and downsample swaps into time buckets or sequential series
  const chartData = useMemo(() => {
    if (!swaps || swaps.length === 0) return [];

    // Track the latest price for each proposal as time advances
    const prices: Record<number, number> = {
      5: 0.62,
      6: 0.62,
      7: 0.62,
      8: 0.62,
    };

    const points: any[] = [];
    swaps.forEach((swap, idx) => {
      prices[swap.proposalId] = swap.priceAfter;
      
      const date = new Date(swap.timestamp * 1000);
      const hoursStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      points.push({
        index: idx,
        timestamp: swap.timestamp,
        label: `${dateStr} ${hoursStr}`,
        isoTime: swap.isoTime,
        p5: prices[5] ? Number(prices[5].toFixed(4)) : undefined,
        p6: prices[6] ? Number(prices[6].toFixed(4)) : undefined,
        p7: prices[7] ? Number(prices[7].toFixed(4)) : undefined,
        p8: prices[8] ? Number(prices[8].toFixed(4)) : undefined,
        tradeProposalId: swap.proposalId,
        trader: swap.trader,
        volumeUsdc: swap.volumeUsdc,
        type: swap.type,
        txHash: swap.txHash,
      });
    });

    return points;
  }, [swaps]);

  const toggleProposal = (id: number) => {
    setSelectedProposals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getProposalColor = (id: number) => {
    switch (id) {
      case 5:
        return '#94A3B8'; // No-Op: cool slate
      case 6:
        return '#10B981'; // Winner (Full 50/50): vibrant emerald
      case 7:
        return '#38BDF8'; // Gauntlet: sky blue
      case 8:
        return '#F59E0B'; // Half: amber
      default:
        return '#A855F7';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl min-w-[240px]">
        <div className="text-slate-400 border-b border-slate-800 pb-1.5 mb-2 flex justify-between items-center">
          <span>{data.label}</span>
          <span className="font-mono text-[10px] text-slate-500">
            Trade #{data.index + 1} of {swaps.length}
          </span>
        </div>

        <div className="space-y-1.5 mb-2.5">
          {payload.map((entry: any) => {
            const pid = parseInt(entry.dataKey.replace('p', ''));
            const p = proposals.find((x) => x.id === pid);
            const isWinner = pid === winningProposalId;
            return (
              <div key={entry.dataKey} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="truncate max-w-[140px]">
                    {p?.isNoOp ? 'No-Op' : p?.title || `Proposal ${pid}`}
                  </span>
                  {isWinner && (
                    <span className="text-[10px] text-emerald-400 font-semibold">(Winner)</span>
                  )}
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-100">
                  ${entry.value?.toFixed(4)}
                </span>
              </div>
            );
          })}
        </div>

        {data.tradeProposalId && (
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Trade Action:</span>
              <span className={data.type === 'BUY_UMIA' ? 'text-emerald-400' : 'text-rose-400'}>
                {data.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volume:</span>
              <span className="text-slate-200">${data.volumeUsdc?.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trader:</span>
              <span className="text-slate-300">
                {data.trader?.slice(0, 6)}...{data.trader?.slice(-4)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            Observed Conditional Prices vs. No-Op Over Time
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real onchain swap prices from all 209 trades recorded across the 48-hour trading window.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTwapLines(!showTwapLines)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
              showTwapLines
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            {showTwapLines ? 'Hide TWAP Benchmarks' : 'Show TWAP Benchmarks'}
          </button>
        </div>
      </div>

      {/* Outcome Selectors */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {proposals.map((p) => {
          const isSelected = selectedProposals.includes(p.id);
          const color = getProposalColor(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggleProposal(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? color : '#475569' }}
              />
              <span>{p.isNoOp ? 'No-Op (Baseline)' : p.title}</span>
              <span className="font-mono text-slate-400 ml-1">
                ${p.spotPriceUsd.toFixed(4)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference Lines */}
            {showTwapLines && (
              <>
                <ReferenceLine
                  y={winningTwap}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Winning TWAP ($${winningTwap.toFixed(4)})`,
                    position: 'top',
                    fill: '#10B981',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={noOpTwap}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{
                    value: `No-Op TWAP ($${noOpTwap.toFixed(4)})`,
                    position: 'bottom',
                    fill: '#94A3B8',
                    fontSize: 10,
                  }}
                />
              </>
            )}

            {/* Proposal Lines */}
            {selectedProposals.includes(5) && (
              <Line
                type="stepAfter"
                dataKey="p5"
                name="No-Op"
                stroke={getProposalColor(5)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {selectedProposals.includes(6) && (
              <Line
                type="stepAfter"
                dataKey="p6"
                name="Proposal 6 (Full 50/50)"
                stroke={getProposalColor(6)}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {selectedProposals.includes(7) && (
              <Line
                type="stepAfter"
                dataKey="p7"
                name="Proposal 7 (Gauntlet)"
                stroke={getProposalColor(7)}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            {selectedProposals.includes(8) && (
              <Line
                type="stepAfter"
                dataKey="p8"
                name="Proposal 8 (Half 50/50)"
                stroke={getProposalColor(8)}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Clarification */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
            <span>Solid Line: Spot CPMM Observation</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-emerald-500 inline-block"></span>
            <span>Dashed Line: Final Contract-Calculated TWAP</span>
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Source: Base Mainnet Block Range #51430134 – #51516867
        </span>
      </div>
    </div>
  );
};
