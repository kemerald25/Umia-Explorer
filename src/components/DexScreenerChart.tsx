import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import { SwapObservation, Proposal } from '../types';
import { Maximize2, RotateCcw, TrendingUp, BarChart2 } from 'lucide-react';

interface DexScreenerChartProps {
  swaps: SwapObservation[];
  proposals: Proposal[];
  winningProposalId: number | null;
  noOpTwap: number;
  winningTwap: number;
}

type Resolution = '15m' | '30m' | '1h' | '2h' | '4h';

interface HoverStats {
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  isUp: boolean;
}

export const DexScreenerChart: React.FC<DexScreenerChartProps> = ({
  swaps,
  proposals,
  winningProposalId,
  noOpTwap,
  winningTwap,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema7SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema25SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [selectedProposalId, setSelectedProposalId] = useState<number>(winningProposalId || 6);
  const [resolution, setResolution] = useState<Resolution>('1h');
  const [showIndicators, setShowIndicators] = useState<{
    ema7: boolean;
    ema25: boolean;
    twap: boolean;
    volume: boolean;
  }>({
    ema7: true,
    ema25: false,
    twap: true,
    volume: true,
  });

  const [hoverStats, setHoverStats] = useState<HoverStats | null>(null);

  // Timeframe step in seconds
  const stepSeconds = useMemo(() => {
    switch (resolution) {
      case '15m':
        return 15 * 60;
      case '30m':
        return 30 * 60;
      case '1h':
        return 60 * 60;
      case '2h':
        return 2 * 60 * 60;
      case '4h':
        return 4 * 60 * 60;
    }
  }, [resolution]);

  // Aggregate trades into OHLCV dataset
  const { candleData, volumeData, ema7Data, ema25Data, summaryStats } = useMemo(() => {
    if (!swaps || swaps.length === 0) {
      return { candleData: [], volumeData: [], ema7Data: [], ema25Data: [], summaryStats: null };
    }

    const filteredSwaps = swaps.filter((s) => s.proposalId === selectedProposalId);
    const startTs = 1789650000; // Sept 17 13:00 UTC
    const endTs = 1789822800;   // Sept 19 13:00 UTC

    const initialPrice = selectedProposalId === 5 ? 0.6279 : 0.6210;
    let prevClose = initialPrice;

    const cData: Array<{ time: UTCTimestamp; open: number; high: number; low: number; close: number }> = [];
    const vData: Array<{ time: UTCTimestamp; value: number; color: string }> = [];

    let totalVolume = 0;
    let periodHigh = -Infinity;
    let periodLow = Infinity;

    for (let t = startTs; t < endTs; t += stepSeconds) {
      const tEnd = t + stepSeconds;
      const trades = filteredSwaps.filter((s) => s.timestamp >= t && s.timestamp < tEnd);

      let o = prevClose;
      let h = prevClose;
      let l = prevClose;
      let c = prevClose;
      let vol = 0;

      if (trades.length > 0) {
        const rawO = trades[0].priceBefore;
        let rawH = Math.max(rawO, trades[0].priceAfter);
        let rawL = Math.min(rawO, trades[0].priceAfter);

        trades.forEach((tr) => {
          rawH = Math.max(rawH, tr.priceBefore, tr.priceAfter);
          rawL = Math.min(rawL, tr.priceBefore, tr.priceAfter);
          vol += tr.volumeUsdc;
        });

        const rawC = trades[trades.length - 1].priceAfter;
        o = rawO;
        h = rawH;
        l = rawL;
        c = rawC;
        prevClose = c;
      }

      const sanitize = (val: number, fallback = 0.65) => {
        if (!isFinite(val) || isNaN(val) || val <= 0) return fallback;
        if (val > 100) return Number((1 / (val / 1e24)).toFixed(4));
        return Number(val.toFixed(4));
      };

      const cleanO = sanitize(o, prevClose);
      const cleanC = sanitize(c, prevClose);
      const cleanH = Math.max(cleanO, cleanC, sanitize(h, Math.max(cleanO, cleanC)));
      const cleanL = Math.min(cleanO, cleanC, sanitize(l, Math.min(cleanO, cleanC)));

      totalVolume += vol;
      if (cleanH > periodHigh) periodHigh = cleanH;
      if (cleanL < periodLow) periodLow = cleanL;

      const isUp = cleanC >= cleanO;
      const timeVal = t as UTCTimestamp;

      cData.push({
        time: timeVal,
        open: cleanO,
        high: cleanH,
        low: cleanL,
        close: cleanC,
      });

      vData.push({
        time: timeVal,
        value: Math.round(vol),
        color: isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      });
    }

    // EMA calculation
    const calcEma = (period: number) => {
      const k = 2 / (period + 1);
      let ema = cData[0]?.close || initialPrice;
      return cData.map((d) => {
        ema = d.close * k + ema * (1 - k);
        return {
          time: d.time,
          value: Number(ema.toFixed(4)),
        };
      });
    };

    const e7 = calcEma(7);
    const e25 = calcEma(25);

    const firstCandle = cData[0];
    const lastCandle = cData[cData.length - 1];
    const overallChange = lastCandle ? lastCandle.close - firstCandle.open : 0;
    const overallPct = firstCandle?.open > 0 ? (overallChange / firstCandle.open) * 100 : 0;

    return {
      candleData: cData,
      volumeData: vData,
      ema7Data: e7,
      ema25Data: e25,
      summaryStats: {
        lastPrice: lastCandle?.close || 0,
        high: periodHigh === -Infinity ? 0 : periodHigh,
        low: periodLow === Infinity ? 0 : periodLow,
        totalVolume,
        change: overallChange,
        changePct: overallPct,
      },
    };
  }, [swaps, selectedProposalId, stepSeconds]);

  // Initialize and update Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart instance if present
    if (chartApiRef.current) {
      chartApiRef.current.remove();
      chartApiRef.current = null;
    }

    const container = chartContainerRef.current;
    const initialHeight = window.innerWidth < 640 ? 360 : 480;

    // True DEXScreener dark palette configuration
    const chart = createChart(container, {
      width: container.clientWidth || 340,
      height: initialHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E17' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#64748B',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          color: '#64748B',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1E293B',
        },
      },
      rightPriceScale: {
        borderColor: '#1E293B',
        scaleMargins: {
          top: 0.1,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12,
      },
    });

    chartApiRef.current = chart;

    // 1. Candlestick Series (DEXScreener colors: #10B981 emerald, #F43F5E crimson)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderVisible: true,
      borderColor: '#10B981',
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(candleData as any);

    // 2. Volume Series (Histogram at bottom)
    if (showIndicators.volume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // overlay
      });
      volumeSeriesRef.current = volumeSeries;
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8, // volume occupies bottom 20%
          bottom: 0,
        },
      });
      volumeSeries.setData(volumeData as any);
    }

    // 3. EMA 7 (Amber Line)
    if (showIndicators.ema7) {
      const ema7Series = chart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 1,
        title: 'EMA 7',
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      ema7SeriesRef.current = ema7Series;
      ema7Series.setData(ema7Data as any);
    }

    // 4. EMA 25 (Purple Line)
    if (showIndicators.ema25) {
      const ema25Series = chart.addSeries(LineSeries, {
        color: '#A855F7',
        lineWidth: 1,
        title: 'EMA 25',
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      ema25SeriesRef.current = ema25Series;
      ema25Series.setData(ema25Data as any);
    }

    // 5. TWAP Benchmark Price Lines (DEXScreener style horizontal price lines)
    if (showIndicators.twap) {
      if (winningTwap) {
        candleSeries.createPriceLine({
          price: winningTwap,
          color: '#10B981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SETTLEMENT TWAP ($${winningTwap.toFixed(4)})`,
        });
      }

      if (noOpTwap) {
        candleSeries.createPriceLine({
          price: noOpTwap,
          color: '#94A3B8',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `NO-OP BASELINE ($${noOpTwap.toFixed(4)})`,
        });
      }
    }

    // Crosshair hover listener for real-time header legend
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setHoverStats(null);
        return;
      }

      const candle = param.seriesData.get(candleSeries) as any;
      if (candle) {
        const d = new Date((param.time as number) * 1000);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;

        const chg = candle.close - candle.open;
        const chgPct = candle.open > 0 ? (chg / candle.open) * 100 : 0;
        const vol = param.seriesData.get(volumeSeriesRef.current as any) as any;

        setHoverStats({
          timeStr: dateStr,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          change: chg,
          changePercent: chgPct,
          volume: vol?.value || 0,
          isUp: candle.close >= candle.open,
        });
      }
    });

    chart.timeScale().fitContent();

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartApiRef.current) return;
      const { width } = entries[0].contentRect;
      const height = window.innerWidth < 640 ? 360 : 480;
      chartApiRef.current.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, [candleData, volumeData, ema7Data, ema25Data, showIndicators, winningTwap, noOpTwap]);

  const resetZoom = () => {
    if (chartApiRef.current) {
      chartApiRef.current.timeScale().fitContent();
    }
  };

  const selectedProposal = proposals.find((p) => p.id === selectedProposalId);

  return (
    <div className="bg-[#0B0E17] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top DEXScreener-style Trading Header Bar */}
      <div className="bg-[#0F1422] px-5 py-3 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Pair Badge and Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-bold text-slate-100 text-sm tracking-tight">
              UMIA / USDC
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              DEXSCREENER ENGINE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* Outcome Select Options */}
          <div className="flex items-center gap-2 max-w-full min-w-0">
            <span className="text-xs text-slate-400 font-medium shrink-0">Outcome:</span>
            <select
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-100 font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[200px] sm:max-w-xs md:max-w-sm truncate"
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isNoOp ? 'Option #5: No-Op (Status Quo)' : `Option #${p.id}: ${p.title}`}
                  {p.id === winningProposalId ? ' ★ (WINNER)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resolution Buttons & Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Resolution buttons */}
          <div className="flex items-center bg-[#090D16] border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['15m', '30m', '1h', '2h', '4h'] as Resolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  resolution === res
                    ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {res}
              </button>
            ))}
          </div>

          {/* Overlays / Toggles */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() =>
                setShowIndicators((prev) => ({ ...prev, ema7: !prev.ema7 }))
              }
              className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                showIndicators.ema7
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              EMA 7
            </button>
            <button
              onClick={() =>
                setShowIndicators((prev) => ({ ...prev, ema25: !prev.ema25 }))
              }
              className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                showIndicators.ema25
                  ? 'bg-purple-950/40 border-purple-800/80 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              EMA 25
            </button>
            <button
              onClick={() =>
                setShowIndicators((prev) => ({ ...prev, twap: !prev.twap }))
              }
              className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                showIndicators.twap
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              TWAP
            </button>
            <button
              onClick={resetZoom}
              title="Reset Zoom / Fit Content"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DEXScreener Real-Time Ticker & Legend Ribbon */}
      <div className="bg-[#0C101C] px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {hoverStats ? (
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400">{hoverStats.timeStr}</span>
            <span>
              O: <strong className="text-slate-100">${hoverStats.open.toFixed(4)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">${hoverStats.high.toFixed(4)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">${hoverStats.low.toFixed(4)}</strong>
            </span>
            <span>
              C: <strong className="text-slate-100">${hoverStats.close.toFixed(4)}</strong>
            </span>
            <span className="flex items-center gap-1">
              CHG:
              <strong
                className={`font-semibold ${
                  hoverStats.isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {hoverStats.isUp ? '+' : ''}${hoverStats.change.toFixed(4)} (
                {hoverStats.isUp ? '+' : ''}
                {hoverStats.changePercent.toFixed(2)}%)
              </strong>
            </span>
            <span>
              VOL: <strong className="text-slate-200">${hoverStats.volume.toLocaleString()}</strong>
            </span>
          </div>
        ) : summaryStats ? (
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span>
              PRICE: <strong className="text-emerald-400 text-sm font-bold">${summaryStats.lastPrice.toFixed(4)}</strong>
            </span>
            <span>
              HIGH: <strong className="text-slate-200">${summaryStats.high.toFixed(4)}</strong>
            </span>
            <span>
              LOW: <strong className="text-slate-200">${summaryStats.low.toFixed(4)}</strong>
            </span>
            <span>
              CHG:
              <strong
                className={`ml-1 font-semibold ${
                  summaryStats.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summaryStats.change >= 0 ? '+' : ''}${summaryStats.change.toFixed(4)} (
                {summaryStats.changePct >= 0 ? '+' : ''}
                {summaryStats.changePct.toFixed(2)}%)
              </strong>
            </span>
            <span>
              TOTAL VOL: <strong className="text-slate-200">${Math.round(summaryStats.totalVolume).toLocaleString()} USDC</strong>
            </span>
          </div>
        ) : null}

        <div className="text-slate-400 text-[11px] font-mono flex items-center gap-2">
          <span>Scroll to Zoom</span>
          <span className="text-slate-700">·</span>
          <span>Click & Drag to Pan</span>
        </div>
      </div>

      {/* Main Lightweight Charts TradingView Canvas Container */}
      <div className="relative w-full">
        <div ref={chartContainerRef} className="w-full h-[360px] sm:h-[480px]" />

        {/* Watermark in bottom left */}
        <div className="absolute bottom-3 left-4 pointer-events-none select-none text-[11px] font-mono text-slate-700/60 font-semibold tracking-wider">
          UMIA FUTARCHY · DEXSCREENER LIGHTWEIGHT ENGINE
        </div>
      </div>

      {/* Terminal Bottom Audit Footer */}
      <div className="bg-[#090D16] px-5 py-2.5 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-400 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Bullish Candle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>Bearish Candle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
            <span>Settlement TWAP: ${winningTwap.toFixed(4)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 inline-block"></span>
            <span>No-Op Baseline: ${noOpTwap.toFixed(4)}</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Built on TradingView Lightweight Charts v5
        </div>
      </div>
    </div>
  );
};
