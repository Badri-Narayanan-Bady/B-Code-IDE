import { BenchmarkResult } from '../types/ide';

export interface BenchmarkTask {
  id: string;
  name: string;
  description: string;
  iterations: number;
  fn: () => void;
}

export interface BenchmarkComparison {
  id: string;
  category: string;
  title: string;
  description: string;
  iterations: number;
  candidateA: { name: string; fn: () => void };
  candidateB: { name: string; fn: () => void };
}

/**
 * Executes a function repeatedly with warm-up cycles to calculate
 * statistically sound runtime performance metrics.
 */
export function runBenchmark(
  name: string,
  fn: () => void,
  iterations: number = 10000,
  description?: string
): BenchmarkResult {
  // 1. JIT Warm-up phase (prevents cold-start compilation skew)
  const warmupCount = Math.min(1000, Math.floor(iterations * 0.1));
  for (let i = 0; i < warmupCount; i++) {
    fn();
  }

  // 2. High-precision measurement phase
  const times: number[] = [];
  const startTotal = performance.now();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    const t1 = performance.now();
    times.push(t1 - t0);
  }

  const endTotal = performance.now();
  const totalTimeMs = endTotal - startTotal;

  // 3. Statistical aggregation
  times.sort((a, b) => a - b);
  const minTimeMs = times[0];
  const maxTimeMs = times[times.length - 1];
  const sum = times.reduce((acc, val) => acc + val, 0);
  const meanTimeMs = sum / times.length;

  // Calculate variance and standard deviation
  const variance = times.reduce((acc, val) => acc + Math.pow(val - meanTimeMs, 2), 0) / times.length;

  // Calculate operations per second (ops/sec)
  const opsPerSec = totalTimeMs > 0 ? Math.round((iterations / (totalTimeMs / 1000))) : 0;

  return {
    id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    description,
    iterations,
    totalTimeMs: parseFloat(totalTimeMs.toFixed(3)),
    meanTimeMs: parseFloat((meanTimeMs * 1000).toFixed(3)), // in microseconds
    minTimeMs: parseFloat((minTimeMs * 1000).toFixed(3)),
    maxTimeMs: parseFloat((maxTimeMs * 1000).toFixed(3)),
    opsPerSec,
    variance: parseFloat(variance.toFixed(4)),
  };
}

/**
 * Standard pre-built MAANG performance comparisons
 */
export const PRESET_BENCHMARKS: BenchmarkComparison[] = [
  {
    id: 'set-vs-array',
    category: 'Algorithms & Complexity',
    title: 'O(1) Set Lookup vs O(N) Array Search',
    description: 'Compares item search in a 5,000-item Set vs Array.includes()',
    iterations: 20000,
    candidateA: {
      name: 'Set.has() [O(1) Hash Map]',
      fn: (() => {
        const set = new Set(Array.from({ length: 5000 }, (_, i) => `item_${i}`));
        return () => {
          set.has('item_4990');
        };
      })(),
    },
    candidateB: {
      name: 'Array.includes() [O(N) Linear Scan]',
      fn: (() => {
        const arr = Array.from({ length: 5000 }, (_, i) => `item_${i}`);
        return () => {
          arr.includes('item_4990');
        };
      })(),
    },
  },
  {
    id: 'loop-iteration',
    category: 'V8 Engine Optimization',
    title: 'for(;;) Loop vs Array.forEach() vs for...of',
    description: 'Iterates through an array of 5,000 integers to test JIT optimization',
    iterations: 5000,
    candidateA: {
      name: 'Index-based for loop [for(let i=0...)]',
      fn: (() => {
        const data = Array.from({ length: 5000 }, (_, i) => i);
        return () => {
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            sum += data[i];
          }
        };
      })(),
    },
    candidateB: {
      name: 'Array.forEach(fn) [Functional Closure]',
      fn: (() => {
        const data = Array.from({ length: 5000 }, (_, i) => i);
        return () => {
          let sum = 0;
          data.forEach((val) => {
            sum += val;
          });
        };
      })(),
    },
  },
  {
    id: 'map-vs-object',
    category: 'Memory & Cache Access',
    title: 'ES6 Map vs Plain Object Property Lookup',
    description: 'Tests lookup speed across 1,000 dynamic keys',
    iterations: 25000,
    candidateA: {
      name: 'Map.get(key)',
      fn: (() => {
        const map = new Map();
        for (let i = 0; i < 1000; i++) map.set(`k_${i}`, i);
        return () => {
          map.get('k_850');
        };
      })(),
    },
    candidateB: {
      name: 'Object[key]',
      fn: (() => {
        const obj: Record<string, number> = {};
        for (let i = 0; i < 1000; i++) obj[`k_${i}`] = i;
        return () => {
          const val = obj['k_850'];
        };
      })(),
    },
  },
];
