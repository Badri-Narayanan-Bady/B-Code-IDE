import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { TestSuiteResult, TestCaseResult } from '../types/ide';

interface TestRunnerPanelProps {
  suites: TestSuiteResult[];
  isRunning: boolean;
  onRunAllTests: () => void;
  onRunActiveFileTests: () => void;
  onLoadMaangTestSuite: () => void;
  onSelectFileLine?: (line: number) => void;
}

export const TestRunnerPanel: React.FC<TestRunnerPanelProps> = ({
  suites,
  isRunning,
  onRunAllTests,
  onRunActiveFileTests,
  onLoadMaangTestSuite,
  onSelectFileLine,
}) => {
  const [collapsedSuites, setCollapsedSuites] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed'>('all');

  const toggleCollapse = (id: string) => {
    setCollapsedSuites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalTests = suites.reduce((acc, s) => acc + s.tests.length, 0);
  const totalPassed = suites.reduce((acc, s) => acc + s.passedCount, 0);
  const totalFailed = suites.reduce((acc, s) => acc + s.failedCount, 0);
  const totalDuration = suites.reduce((acc, s) => acc + s.durationMs, 0);

  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 100;

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Test Suite Runner</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onLoadMaangTestSuite}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
            title="Load standard MAANG Interview Test Suite"
          >
            <Sparkles size={11} className="text-amber-400" />
            <span>MAANG Suite</span>
          </button>
          <button
            onClick={onRunAllTests}
            disabled={isRunning}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Play size={10} fill="currentColor" />
            <span>{isRunning ? 'Running...' : 'Run All'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              {totalPassed} passed
            </span>
            {totalFailed > 0 && (
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <XCircle size={13} />
                {totalFailed} failed
              </span>
            )}
            <span className="text-neutral-500 text-[11px] flex items-center gap-1">
              <Clock size={11} />
              {totalDuration.toFixed(1)}ms
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-400">
            {passRate}% Passing
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${totalTests > 0 ? (totalPassed / totalTests) * 100 : 100}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${totalTests > 0 ? (totalFailed / totalTests) * 100 : 0}%` }}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1 pt-1 text-[10px]">
          {(['all', 'failed', 'passed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded capitalize transition-colors ${
                filter === f
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f} ({f === 'all' ? totalTests : f === 'passed' ? totalPassed : totalFailed})
            </button>
          ))}
        </div>
      </div>

      {/* Suites List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
        {suites.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 space-y-2">
            <ShieldCheck size={28} className="mx-auto text-neutral-600 opacity-60" />
            <div className="text-xs">No test suites executed yet</div>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              Click &ldquo;MAANG Suite&rdquo; or &ldquo;Run All&rdquo; to execute unit tests using Jest/Vitest assertion matchers.
            </p>
          </div>
        ) : (
          suites.map((suite) => {
            const isCollapsed = collapsedSuites[suite.id] ?? false;
            const filteredCases = suite.tests.filter((t) => {
              if (filter === 'failed') return t.status === 'failed';
              if (filter === 'passed') return t.status === 'passed';
              return true;
            });

            if (filteredCases.length === 0 && filter !== 'all') return null;

            return (
              <div
                key={suite.id}
                className="bg-neutral-950/60 border border-neutral-800 rounded-lg overflow-hidden"
              >
                {/* Suite Header */}
                <div
                  onClick={() => toggleCollapse(suite.id)}
                  className="px-3 py-2 bg-neutral-900/80 hover:bg-neutral-850 cursor-pointer flex items-center justify-between border-b border-neutral-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-neutral-500">
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </span>
                    <span className="font-semibold text-neutral-200 truncate">
                      {suite.suiteTitle}
                    </span>
                    {suite.fileName && (
                      <span className="text-[10px] text-neutral-500 font-mono truncate">
                        ({suite.fileName})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                    <span className="text-emerald-400 font-semibold">{suite.passedCount}✓</span>
                    {suite.failedCount > 0 && (
                      <span className="text-rose-400 font-semibold">{suite.failedCount}✗</span>
                    )}
                    <span className="text-neutral-500">{suite.durationMs}ms</span>
                  </div>
                </div>

                {/* Test Cases */}
                {!isCollapsed && (
                  <div className="p-1 space-y-1">
                    {filteredCases.map((tc) => (
                      <div
                        key={tc.id}
                        className={`p-2 rounded font-mono text-[11px] transition-colors ${
                          tc.status === 'failed'
                            ? 'bg-rose-950/20 border border-rose-900/40 text-rose-200'
                            : 'hover:bg-neutral-900 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            {tc.status === 'passed' ? (
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle size={13} className="text-rose-400 shrink-0" />
                            )}
                            <span className={tc.status === 'failed' ? 'font-semibold text-rose-300' : ''}>
                              {tc.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 shrink-0 ml-2">
                            {tc.durationMs}ms
                          </span>
                        </div>

                        {/* Error Message & Diff */}
                        {tc.error && (
                          <div className="mt-1.5 p-2 bg-neutral-950 rounded border border-rose-900/30 text-[11px] text-rose-300 whitespace-pre-wrap overflow-x-auto">
                            {tc.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-[10px] text-neutral-500">
        <span>Framework: Browser BDD / Jest Compatible</span>
        <button
          onClick={onRunActiveFileTests}
          className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Test Active File
        </button>
      </div>
    </div>
  );
};
