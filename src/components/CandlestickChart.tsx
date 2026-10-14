import React, { useState, useMemo, useRef } from 'react';
import { SwapObservation, Proposal } from '../types';
import { CheckCircle2, TrendingUp, TrendingDown, BarChart2, Eye, EyeOff } from 'lucide-react';

export interface Candle {
  timestamp: number;
  dateStr: string;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUsdc: number;
  tradeCount: number;
  isBullish: boolean;
  ema7?: number;
}

interface CandlestickChartProps {
  swaps: SwapObservation[];
  proposals: Proposal[];
  winningProposalId: number | null;
  noOpTwap: number;
  winningTwap: number;
}

type Timeframe = '30m' | '1h' | '2h' | '4h';

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  swaps,
  proposals,
  winningProposalId,
  noOpTwap,
  winningTwap,
}) => {
  // Default to winning proposal (Proposal 6) or first proposal
  const [selectedProposalId, setSelectedProposalId] = useState<number>(winningProposalId || 6);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [showTwap, setShowTwap] = useState<boolean>(true);
  const [showNoOp, setShowNoOp] = useState<boolean>(true);
  const [showEma, setShowEma] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Timeframe duration in seconds
  const timeframeSeconds = useMemo(() => {
    switch (timeframe) {
      case '30m':
        return 30 * 60;
      case '1h':
        return 60 * 60;
      case '2h':
        return 2 * 60 * 60;
      case '4h':
        return 4 * 60 * 60;
      default:
        return 60 * 60;
    }
  }, [timeframe]);

  // Aggregate trades into OHLCV candles
  const candles = useMemo(() => {
    if (!swaps || swaps.length === 0) return [];

    // Filter swaps for the selected proposal
    const proposalSwaps = swaps.filter((s) => s.proposalId === selectedProposalId);

    // Initial price anchor: $0.6279 (start of trading for Umia market)
    const initialAnchorPrice = selectedProposalId === 5 ? 0.6279 : 0.6210;

    // Window boundaries: 1789650000 (Sept 17 13:00) to 1789822800 (Sept 19 13:00)
    const startTs = 1789650000;
    const endTs = 1789822800;
    const step = timeframeSeconds;

    const candleList: Candle[] = [];
    let prevClose = initialAnchorPrice;

    for (let t = startTs; t < endTs; t += step) {
      const tEnd = t + step;
      const tradesInBucket = proposalSwaps.filter(
        (s) => s.timestamp >= t && s.timestamp < tEnd
      );

      const d = new Date(t * 1000);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      if (tradesInBucket.length === 0) {
        // No trades in this interval: flat candle carrying forward previous close
        candleList.push({
          timestamp: t,
          dateStr,
          timeStr,
          open: prevClose,
          high: prevClose,
          low: prevClose,
          close: prevClose,
          volumeUsdc: 0,
          tradeCount: 0,
          isBullish: true,
        });
      } else {
        const open = tradesInBucket[0].priceBefore;
        let high = Math.max(open, tradesInBucket[0].priceAfter);
        let low = Math.min(open, tradesInBucket[0].priceAfter);
        let volume = 0;

        tradesInBucket.forEach((tr) => {
          high = Math.max(high, tr.priceBefore, tr.priceAfter);
          low = Math.min(low, tr.priceBefore, tr.priceAfter);
          volume += tr.volumeUsdc;
        });

        const close = tradesInBucket[tradesInBucket.length - 1].priceAfter;
        prevClose = close;

        candleList.push({
          timestamp: t,
          dateStr,
          timeStr,
          open,
          high,
          low,
          close,
          volumeUsdc: volume,
          tradeCount: tradesInBucket.length,
          isBullish: close >= open,
        });
      }
    }

    // Compute 7-period Exponential Moving Average (EMA)
    const k = 2 / (7 + 1);
    let ema = candleList[0]?.close || initialAnchorPrice;
    candleList.forEach((c) => {
      ema = c.close * k + ema * (1 - k);
      c.ema7 = Number(ema.toFixed(4));
    });

    return candleList;
  }, [swaps, selectedProposalId, timeframeSeconds]);

  // Selected proposal metadata
  const currentProposal = proposals.find((p) => p.id === selectedProposalId);
  const isWinner = selectedProposalId === winningProposalId;

  // Global High, Low, Max Volume
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0.6, maxPrice: 0.75, maxVolume: 10000 };
    let min = Infinity;
    let max = -Infinity;
    let volMax = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volumeUsdc > volMax) volMax = c.volumeUsdc;
    });

    // Also include TWAP lines in bounds if enabled
    if (showTwap && winningTwap) {
      if (winningTwap > max) max = winningTwap;
      if (winningTwap < min) min = winningTwap;
    }
    if (showNoOp && noOpTwap) {
      if (noOpTwap > max) max = noOpTwap;
      if (noOpTwap < min) min = noOpTwap;
    }

    // Add 8% padding top and bottom
    const span = max - min || 0.05;
    return {
      minPrice: Math.max(0, min - span * 0.08),
      maxPrice: max + span * 0.08,
      maxVolume: volMax > 0 ? volMax * 1.25 : 10000,
    };
  }, [candles, showTwap, showNoOp, winningTwap, noOpTwap]);

  // Layout Dimensions (ViewBox)
  const svgWidth = 1000;
  const svgHeight = 440;
  const priceChartHeight = 310;
  const volumeChartHeight = 80;
  const volumeChartTop = 330;
  const rightAxisWidth = 70;
  const chartInnerWidth = svgWidth - rightAxisWidth;

  // Coordinate scales
  const getX = (index: number) => {
    if (candles.length <= 1) return chartInnerWidth / 2;
    return (index / (candles.length - 1)) * (chartInnerWidth - 30) + 15;
  };

  const getY = (price: number) => {
    if (maxPrice === minPrice) return priceChartHeight / 2;
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return priceChartHeight - ratio * priceChartHeight + 10;
  };

  const getVolY = (volume: number) => {
    if (maxVolume === 0) return volumeChartTop + volumeChartHeight;
    const ratio = volume / maxVolume;
    return volumeChartTop + volumeChartHeight - ratio * volumeChartHeight;
  };

  // Candle width based on candle count
  const candleBodyWidth = useMemo(() => {
    if (candles.length === 0) return 8;
    const slot = chartInnerWidth / candles.length;
    return Math.max(3, Math.min(18, slot * 0.7));
  }, [candles.length, chartInnerWidth]);

  // Price Ticks for right axis
  const priceTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 6;
    const step = (maxPrice - minPrice) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  // Stats for the active or hovered candle
  const activeCandle = hoveredCandle || candles[candles.length - 1];
  const priceChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const priceChangePct = activeCandle && activeCandle.open > 0 ? (priceChange / activeCandle.open) * 100 : 0;

  // Handle Mouse Hover on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || candles.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;

    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    setMousePos({ x: svgX, y: svgY });

    // Find nearest candle
    let closestIdx = 0;
    let closestDist = Infinity;
    candles.forEach((c, idx) => {
      const cx = getX(idx);
      const dist = Math.abs(cx - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    setHoveredCandle(candles[closestIdx]);
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setMousePos(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header Terminal Bar */}
      <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Market Title and Outcome Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 animate-pulse"></span>
            <span className="font-mono font-bold text-slate-100 text-sm tracking-wider">
              UMIA / USDC
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              CONDITIONAL FUTURES
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* Proposal Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Outcome:</span>
            <select
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-100 font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isNoOp ? 'No-Op (Baseline)' : `Option #${p.id}: ${p.title}`}
                  {p.id === winningProposalId ? ' ★ (WINNER)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeframe & Overlays Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['30m', '1h', '2h', '4h'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators Toggle */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setShowTwap(!showTwap)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                showTwap
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="w-2 h-0.5 bg-emerald-400 inline-block"></span>
              <span>TWAP ($0.6703)</span>
            </button>

            <button
              onClick={() => setShowEma(!showEma)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                showEma
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="w-2 h-0.5 bg-amber-400 inline-block"></span>
              <span>EMA(7)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Candlestick Data Bar (O H L C Vol Change) */}
      <div className="bg-slate-950/40 px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {activeCandle ? (
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400">
              TIME: <span className="text-slate-200">{activeCandle.dateStr} {activeCandle.timeStr}</span>
            </span>
            <span>
              O: <strong className="text-slate-100 font-semibold">${activeCandle.open.toFixed(4)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400 font-semibold">${activeCandle.high.toFixed(4)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400 font-semibold">${activeCandle.low.toFixed(4)}</strong>
            </span>
            <span>
              C: <strong className="text-slate-100 font-semibold">${activeCandle.close.toFixed(4)}</strong>
            </span>
            <span className="flex items-center gap-1">
              CHG:
              <strong
                className={`font-semibold flex items-center ${
                  priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(4)} ({priceChangePct >= 0 ? '+' : ''}
                {priceChangePct.toFixed(2)}%)
              </strong>
            </span>
            <span>
              VOL: <strong className="text-slate-200">${Math.round(activeCandle.volumeUsdc).toLocaleString()} USDC</strong>
            </span>
            <span className="text-slate-400 text-[11px]">
              TRADES: {activeCandle.tradeCount}
            </span>
          </div>
        ) : (
          <div className="text-slate-400">Hover over any candle to inspect OHLCV details</div>
        )}

        <div className="text-slate-400 text-[11px] font-mono">
          {candles.length} Candles ({timeframe} intervals)
        </div>
      </div>

      {/* Main SVG Chart Canvas */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none bg-[#090D16]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Bullish Candle Gradient */}
            <linearGradient id="bullishGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Bearish Candle Gradient */}
            <linearGradient id="bearishGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            {/* Volume Gradients */}
            <linearGradient id="volBullGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="volBearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Price Labels */}
          {priceTicks.map((price, idx) => {
            const y = getY(price);
            return (
              <g key={`grid-${idx}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartInnerWidth}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="2 3"
                  strokeWidth="0.8"
                />
                {/* Right Axis Price Label */}
                <text
                  x={chartInnerWidth + 8}
                  y={y + 3.5}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${price.toFixed(4)}
                </text>
              </g>
            );
          })}

          {/* Separator between Price Chart and Volume Chart */}
          <line
            x1={0}
            y1={volumeChartTop - 5}
            x2={chartInnerWidth}
            y2={volumeChartTop - 5}
            stroke="#1E293B"
            strokeWidth="1"
          />
          <text
            x={10}
            y={volumeChartTop + 10}
            fill="#475569"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            VOLUME (USDC)
          </text>

          {/* Reference Line: Winning Proposal TWAP Benchmark */}
          {showTwap && (
            <g>
              <line
                x1={0}
                y1={getY(winningTwap)}
                x2={chartInnerWidth}
                y2={getY(winningTwap)}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                strokeOpacity="0.8"
              />
              <rect
                x={chartInnerWidth + 2}
                y={getY(winningTwap) - 8}
                width={65}
                height={16}
                rx={3}
                fill="#064E3B"
                stroke="#10B981"
                strokeWidth="1"
              />
              <text
                x={chartInnerWidth + 6}
                y={getY(winningTwap) + 3.5}
                fill="#34D399"
                fontSize="9"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                ${winningTwap.toFixed(4)}
              </text>
            </g>
          )}

          {/* Reference Line: No-Op Baseline TWAP */}
          {showNoOp && (
            <g>
              <line
                x1={0}
                y1={getY(noOpTwap)}
                x2={chartInnerWidth}
                y2={getY(noOpTwap)}
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <rect
                x={chartInnerWidth + 2}
                y={getY(noOpTwap) - 8}
                width={65}
                height={16}
                rx={3}
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="0.8"
              />
              <text
                x={chartInnerWidth + 6}
                y={getY(noOpTwap) + 3.5}
                fill="#CBD5E1"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                ${noOpTwap.toFixed(4)}
              </text>
            </g>
          )}

          {/* Volume Histogram Bars */}
          {candles.map((c, idx) => {
            const x = getX(idx);
            const barWidth = Math.max(2, candleBodyWidth);
            const yTop = getVolY(c.volumeUsdc);
            const barHeight = volumeChartTop + volumeChartHeight - yTop;

            return (
              <rect
                key={`vol-${idx}`}
                x={x - barWidth / 2}
                y={yTop}
                width={barWidth}
                height={Math.max(1, barHeight)}
                fill={c.isBullish ? 'url(#volBullGrad)' : 'url(#volBearGrad)'}
                stroke={c.isBullish ? '#10B981' : '#F43F5E'}
                strokeOpacity="0.4"
                strokeWidth="0.5"
              />
            );
          })}

          {/* 7-Period EMA Smooth Line */}
          {showEma && candles.length > 1 && (
            <path
              d={candles
                .map((c, idx) => {
                  const x = getX(idx);
                  const y = getY(c.ema7 || c.close);
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          )}

          {/* CANDLESTICKS (Wicks & Bodies) */}
          {candles.map((c, idx) => {
            const x = getX(idx);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const yOpen = getY(c.open);
            const yClose = getY(c.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yOpen - yClose));
            const isHovered = hoveredCandle === c;

            const candleColor = c.isBullish ? '#10B981' : '#F43F5E';
            const bodyFill = c.isBullish ? 'url(#bullishGrad)' : 'url(#bearishGrad)';

            return (
              <g key={`candle-${idx}`} className="transition-opacity">
                {/* Upper and Lower Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth={isHovered ? '2' : '1.2'}
                />

                {/* Candle Body Rect */}
                <rect
                  x={x - candleBodyWidth / 2}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={bodyFill}
                  stroke={candleColor}
                  strokeWidth={isHovered ? '1.5' : '0.8'}
                  rx={1}
                />
              </g>
            );
          })}

          {/* Interactive Crosshair & Hover Guideline */}
          {mousePos && hoveredCandle && (
            <g>
              {/* Vertical Crosshair */}
              <line
                x1={mousePos.x}
                y1={0}
                x2={mousePos.x}
                y2={svgHeight - 20}
                stroke="#94A3B8"
                strokeDasharray="3 3"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />

              {/* Horizontal Crosshair in Price Chart */}
              {mousePos.y <= priceChartHeight && (
                <>
                  <line
                    x1={0}
                    y1={mousePos.y}
                    x2={chartInnerWidth}
                    y2={mousePos.y}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                    strokeOpacity="0.5"
                  />
                  {/* Floating Price Badge on Right Axis */}
                  <rect
                    x={chartInnerWidth}
                    y={mousePos.y - 9}
                    width={rightAxisWidth}
                    height={18}
                    fill="#334155"
                    rx={2}
                  />
                  <text
                    x={chartInnerWidth + 6}
                    y={mousePos.y + 3.5}
                    fill="#F8FAFC"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ${(
                      maxPrice -
                      ((mousePos.y - 10) / priceChartHeight) * (maxPrice - minPrice)
                    ).toFixed(4)}
                  </text>
                </>
              )}
            </g>
          )}

          {/* Bottom X-Axis Time Labels */}
          {candles.map((c, idx) => {
            // Label every ~8 candles to avoid overlap
            if (idx % Math.ceil(candles.length / 7) !== 0) return null;
            const x = getX(idx);
            return (
              <text
                key={`label-${idx}`}
                x={x}
                y={svgHeight - 6}
                fill="#64748B"
                fontSize="9"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                {c.dateStr} {c.timeStr}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Terminal Footer with Quick Stats & Explanation */}
      <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Green: Bullish Trade (Close ≥ Open)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>Red: Bearish Trade (Close &lt; Open)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
            <span>Green Dashed: Settlement TWAP ($0.6703)</span>
          </div>
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          Source: Base Verified Swaps Log · Q96 Scaled to USDC
        </div>
      </div>
    </div>
  );
};
