import React, { useState } from 'react';
import {
  Gauge,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  Clock,
  BarChart3,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { PRESET_BENCHMARKS, BenchmarkComparison, runBenchmark } from '../utils/profiler';
import { BenchmarkResult } from '../types/ide';

interface BenchmarkPanelProps {
  onNotify?: (type: 'success' | 'info' | 'warn' | 'error', msg: string, title?: string) => void;
}

interface RunComparisonResult {
  comparisonId: string;
  resultA: BenchmarkResult;
  resultB: BenchmarkResult;
  winner: 'A' | 'B';
  speedup: number;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ onNotify }) => {
  const [selectedComparison, setSelectedComparison] = useState<BenchmarkComparison>(PRESET_BENCHMARKS[0]);
  const [iterations, setIterations] = useState<number>(20000);
  const [isProfiling, setIsProfiling] = useState<boolean>(false);
  const [comparisonResults, setComparisonResults] = useState<Record<string, RunComparisonResult>>({});

  const handleRunComparison = async (comp: BenchmarkComparison) => {
    setIsProfiling(true);
    // Let UI render spinner
    await new Promise((r) => setTimeout(r, 60));

    try {
      const resA = runBenchmark(comp.candidateA.name, comp.candidateA.fn, iterations, comp.title);
      const resB = runBenchmark(comp.candidateB.name, comp.candidateB.fn, iterations, comp.title);

      const speedup = resA.opsPerSec > resB.opsPerSec
        ? parseFloat((resA.opsPerSec / Math.max(1, resB.opsPerSec)).toFixed(2))
        : parseFloat((resB.opsPerSec / Math.max(1, resA.opsPerSec)).toFixed(2));

      const winner = resA.opsPerSec >= resB.opsPerSec ? 'A' : 'B';

      setComparisonResults((prev) => ({
        ...prev,
        [comp.id]: {
          comparisonId: comp.id,
          resultA: resA,
          resultB: resB,
          winner,
          speedup,
        },
      }));

      onNotify?.(
        'success',
        `${winner === 'A' ? comp.candidateA.name : comp.candidateB.name} won by ${speedup}x!`,
        'Benchmark Completed'
      );
    } catch (err: any) {
      onNotify?.('error', err?.message || 'Profiling error', 'Benchmark Failed');
    } finally {
      setIsProfiling(false);
    }
  };

  const currentResult = comparisonResults[selectedComparison.id];

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
        <div className="flex items-center gap-1.5">
          <Gauge size={14} className="text-amber-400" />
          <span>Performance Profiler</span>
        </div>
        <button
          onClick={() => handleRunComparison(selectedComparison)}
          disabled={isProfiling}
          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
        >
          <Zap size={10} fill="currentColor" />
          <span>{isProfiling ? 'Profiling...' : 'Run Benchmark'}</span>
        </button>
      </div>

      {/* Preset Comparison Selector */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/40 space-y-2">
        <div className="text-[11px] font-semibold text-neutral-300">Preset Scenarios</div>
        <div className="space-y-1">
          {PRESET_BENCHMARKS.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedComparison(comp)}
              className={`w-full text-left p-2 rounded border text-xs transition-colors flex items-center justify-between ${
                selectedComparison.id === comp.id
                  ? 'bg-neutral-800/90 border-amber-500/50 text-white'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div>
                <div className="font-medium text-[11px]">{comp.title}</div>
                <div className="text-[10px] text-neutral-500">{comp.description}</div>
              </div>
              {comparisonResults[comp.id] && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {comparisonResults[comp.id].speedup}x
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Iterations selector */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
          <span>Benchmark Iterations:</span>
          <select
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded px-2 py-0.5"
          >
            <option value={5000}>5,000 runs</option>
            <option value={20000}>20,000 runs</option>
            <option value={50000}>50,000 runs</option>
            <option value={100000}>100,000 runs</option>
          </select>
        </div>
      </div>

      {/* Results View Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {currentResult ? (
          <div className="space-y-4">
            {/* Speedup banner */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                  <Sparkles size={15} />
                  <span>
                    {currentResult.winner === 'A'
                      ? selectedComparison.candidateA.name
                      : selectedComparison.candidateB.name}{' '}
                    is {currentResult.speedup}x faster!
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Tested over {currentResult.resultA.iterations.toLocaleString()} iterations with JIT warm-up cycles.
                </div>
              </div>
            </div>

            {/* Side by side cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Candidate A */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  currentResult.winner === 'A'
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-neutral-950/80 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    {currentResult.winner === 'A' && (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    )}
                    <span>{selectedComparison.candidateA.name}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-xs">
                    {currentResult.resultA.opsPerSec.toLocaleString()} ops/sec
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (currentResult.resultA.opsPerSec /
                          Math.max(currentResult.resultA.opsPerSec, currentResult.resultB.opsPerSec)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Mean:</span> {currentResult.resultA.meanTimeMs}µs
                  </div>
                  <div>
                    <span className="text-neutral-500">Min:</span> {currentResult.resultA.minTimeMs}µs
                  </div>
                  <div>
                    <span className="text-neutral-500">Total:</span> {currentResult.resultA.totalTimeMs}ms
                  </div>
                </div>
              </div>

              {/* Candidate B */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  currentResult.winner === 'B'
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-neutral-950/80 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    {currentResult.winner === 'B' && (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    )}
                    <span>{selectedComparison.candidateB.name}</span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {currentResult.resultB.opsPerSec.toLocaleString()} ops/sec
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (currentResult.resultB.opsPerSec /
                          Math.max(currentResult.resultA.opsPerSec, currentResult.resultB.opsPerSec)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Mean:</span> {currentResult.resultB.meanTimeMs}µs
                  </div>
                  <div>
                    <span className="text-neutral-500">Min:</span> {currentResult.resultB.minTimeMs}µs
                  </div>
                  <div>
                    <span className="text-neutral-500">Total:</span> {currentResult.resultB.totalTimeMs}ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-500 space-y-2">
            <Gauge size={28} className="mx-auto text-neutral-600 opacity-60" />
            <div className="text-xs text-neutral-400">Ready to profile selected scenario</div>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              Executes real-time micro-benchmarks with V8 JIT warmup cycles to measure Ops/Sec and sub-millisecond execution times.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-neutral-800 bg-neutral-950 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>Engine: High-Precision performance.now()</span>
        <span>JIT Warmup: Enabled</span>
      </div>
    </div>
  );
};
