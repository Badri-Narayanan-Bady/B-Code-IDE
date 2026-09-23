import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Table as TableIcon,
  FileText,
  AlertCircle,
  Play,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  Activity,
  Zap,
  ShieldCheck,
  GitBranch,
  Cpu,
  ExternalLink
} from 'lucide-react';
import { ExecutionResult, SupportedLanguage, SQLQueryResult, CodeAnalysisResult } from '../types/ide';

interface TerminalProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  language: SupportedLanguage;
  stdinInput: string;
  onChangeStdin: (val: string) => void;
  onClearOutput: () => void;
  onRun: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  analysis?: CodeAnalysisResult;
  onOpenAnalyzerModal?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  result,
  isRunning,
  language,
  stdinInput,
  onChangeStdin,
  onClearOutput,
  onRun,
  isExpanded = false,
  onToggleExpand,
  analysis,
  onOpenAnalyzerModal,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'sql' | 'stdin' | 'compiler' | 'analysis'>(
    language === 'sql' ? 'sql' : 'output'
  );
  const [copied, setCopied] = useState(false);

  // Switch to SQL tab automatically if language is SQL and we get results
  React.useEffect(() => {
    if (language === 'sql' && result?.sqlResults && result.sqlResults.length > 0) {
      setActiveTab('sql');
    }
  }, [language, result]);

  const handleCopyOutput = () => {
    if (!result) return;
    const combined = [...result.stdout, ...result.stderr].join('\n');
    navigator.clipboard.writeText(combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasOutput = result && (result.stdout.length > 0 || result.stderr.length > 0);

  return (
    <div
      className={`bg-neutral-950 border-t border-neutral-800 flex flex-col transition-all duration-200 select-text ${
        isExpanded ? 'h-96 md:h-[480px]' : 'h-64 md:h-72'
      }`}
    >
      {/* Terminal Header & Navigation Tabs */}
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 select-none">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'output'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <TerminalIcon size={14} className="text-cyan-400" />
            <span>Output</span>
            {result && result.stderr.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* SQL Results Tab */}
          {language === 'sql' && (
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'sql'
                  ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Database size={14} />
              <span>SQL Tables</span>
              {result?.sqlResults && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/40">
                  {result.sqlResults.length}
                </span>
              )}
            </button>
          )}

          {/* Program Input (STDIN) Tab */}
          <button
            onClick={() => setActiveTab('stdin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'stdin'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
            title="Custom inputs fed to cin, scanf, input(), or Scanner"
          >
            <FileText size={14} />
            <span>Program Input (STDIN)</span>
            {stdinInput.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Compiler Diagnostics Tab */}
          <button
            onClick={() => setActiveTab('compiler')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'compiler'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <AlertCircle size={14} className="text-violet-400" />
            <span>Diagnostics</span>
          </button>

          {/* Static Code Analysis Tab */}
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-neutral-800 text-cyan-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
            title="Cyclomatic Complexity, Big-O, and Estimated Execution Time"
          >
            <Activity size={14} className="text-cyan-400" />
            <span>Analysis</span>
            {analysis && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold border ${
                analysis.risk === 'low'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50'
                  : analysis.risk === 'moderate'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800/50'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800/50'
              }`}>
                M={analysis.totalCyclomaticComplexity}
              </span>
            )}
          </button>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-2">
          {/* Execution Time & Status Badge */}
          {result && !isRunning && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-950/80 border border-neutral-800 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-neutral-400">
                <Clock size={12} />
                {result.executionTimeMs} ms
              </span>
              <span className="text-neutral-700">•</span>
              {result.success ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={12} /> Exit 0
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle size={12} /> Exit {result.exitCode || 1}
                </span>
              )}
            </div>
          )}

          {/* Copy Button */}
          {hasOutput && (
            <button
              onClick={handleCopyOutput}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Copy output text"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          )}

          {/* Clear Output */}
          <button
            onClick={onClearOutput}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Clear output logs"
          >
            <RotateCcw size={14} />
          </button>

          {/* Toggle Expand / Collapse */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body Content */}
      <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed">
        {/* TAB 1: OUTPUT (STDOUT / STDERR) */}
        {activeTab === 'output' && (
          <div className="space-y-1">
            {isRunning && (
              <div className="flex items-center gap-2 text-cyan-400 py-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Executing {language} program...</span>
              </div>
            )}

            {!isRunning && !result && (
              <div className="text-neutral-500 py-6 text-center">
                <p>Ready to run. Click "Run Code" or press F5 to execute.</p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Supports standard I/O, loops, arithmetic, functions, and algorithms.
                </p>
              </div>
            )}

            {result && (
              <>
                {result.stdout.map((line, idx) => (
                  <div key={`out-${idx}`} className="text-neutral-200 whitespace-pre-wrap break-all">
                    {line}
                  </div>
                ))}
                {result.stderr.map((err, idx) => (
                  <div key={`err-${idx}`} className="text-rose-400 font-medium whitespace-pre-wrap break-all">
                    {err}
                  </div>
                ))}

                {result.stdout.length === 0 && result.stderr.length === 0 && (
                  <div className="text-neutral-500 italic">
                    Program exited with code {result.exitCode} (No output printed).
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: SQL RESULTS TABLE */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            {!result?.sqlResults || result.sqlResults.length === 0 ? (
              <div className="text-neutral-500 py-6 text-center">
                <Database size={24} className="mx-auto mb-2 text-neutral-600" />
                <p>Run your SQL queries to see live MySQL relational data tables.</p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Supports CREATE TABLE, INSERT INTO, SELECT, WHERE, ORDER BY, GROUP BY.
                </p>
              </div>
            ) : (
              result.sqlResults.map((qr, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  {/* Query Header */}
                  <div className="px-3 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
                    <span className="text-cyan-300 font-medium truncate max-w-lg">
                      {qr.statement}
                    </span>
                    <span className="text-[11px] text-neutral-400 shrink-0">
                      {qr.rows.length} rows ({qr.executionTimeMs} ms)
                    </span>
                  </div>

                  {/* Relational Table Grid */}
                  {qr.isSelect && qr.columns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-neutral-850/80 border-b border-neutral-800 text-neutral-300">
                            {qr.columns.map((col, cIdx) => (
                              <th key={cIdx} className="p-2 font-semibold border-r border-neutral-800/60 last:border-none">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {qr.rows.length === 0 ? (
                            <tr>
                              <td colSpan={qr.columns.length} className="p-3 text-center text-neutral-500">
                                Empty set (0 rows)
                              </td>
                            </tr>
                          ) : (
                            qr.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={`border-b border-neutral-800/40 hover:bg-neutral-800/40 ${
                                  rIdx % 2 === 0 ? 'bg-neutral-900/60' : 'bg-neutral-900'
                                }`}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="p-2 border-r border-neutral-800/40 last:border-none text-neutral-200"
                                  >
                                    {cell === null ? (
                                      <span className="text-neutral-500 italic">NULL</span>
                                    ) : (
                                      String(cell)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-emerald-400">
                      Query OK, {qr.affectedRows || 0} rows affected ({qr.executionTimeMs / 1000} sec)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: PROGRAM INPUT (STDIN) */}
        {activeTab === 'stdin' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Standard Input Stream (stdin)</span>
              <span className="text-[11px] text-neutral-500">One input per line</span>
            </div>
            <textarea
              value={stdinInput}
              onChange={(e) => onChangeStdin(e.target.value)}
              placeholder="Enter inputs here before running your program (e.g. for cin >> x, input(), or Scanner.nextInt())..."
              className="flex-1 w-full bg-neutral-900 border border-neutral-800 rounded-md p-2.5 font-mono text-xs text-neutral-200 resize-none outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              rows={6}
            />
          </div>
        )}

        {/* TAB 4: COMPILER DIAGNOSTICS */}
        {activeTab === 'compiler' && (
          <div className="space-y-2">
            <div className="text-xs text-neutral-400 font-semibold mb-2">
              Compiler / Runtime Diagnostics
            </div>
            {result?.compilerOutput ? (
              <pre className="bg-neutral-900 border border-neutral-800 p-3 rounded text-neutral-300 whitespace-pre-wrap">
                {result.compilerOutput}
              </pre>
            ) : (
              <div className="text-neutral-500 py-4 text-center">
                No compilation warnings or errors reported.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STATIC CODE ANALYSIS & METRICS */}
        {activeTab === 'analysis' && analysis && (
          <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Cyclomatic Complexity */}
              <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <GitBranch size={13} className="text-cyan-400" />
                    Cyclomatic (M)
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                    analysis.risk === 'low'
                      ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/40'
                      : analysis.risk === 'moderate'
                      ? 'text-amber-400 bg-amber-950/80 border border-amber-800/40'
                      : 'text-rose-400 bg-rose-950/80 border border-rose-800/40'
                  }`}>
                    {analysis.risk}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {analysis.totalCyclomaticComplexity}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {analysis.totalCyclomaticComplexity - 1} decision branches
                </div>
              </div>

              {/* Estimated Execution Time */}
              <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-emerald-400" />
                    Est. Runtime
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                    {analysis.executionEstimate.asymptoticNotation}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  {analysis.executionEstimate.durationRange}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5 truncate">
                  {analysis.executionEstimate.asymptoticLabel}
                </div>
              </div>

              {/* Maintainability Index */}
              <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-indigo-400" />
                    Maintainability
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {analysis.maintainabilityLabel}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {analysis.maintainabilityIndex}
                  <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${
                      analysis.maintainabilityIndex >= 85
                        ? 'bg-emerald-500'
                        : analysis.maintainabilityIndex >= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${analysis.maintainabilityIndex}%` }}
                  />
                </div>
              </div>

              {/* Cognitive & Nesting */}
              <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Zap size={13} className="text-amber-400" />
                    Cognitive Load
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Depth {analysis.executionEstimate.maxLoopDepth}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {analysis.cognitiveComplexity}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {analysis.executionEstimate.recursiveCallsDetected ? 'Recursive call chain' : 'Linear nesting'}
                </div>
              </div>
            </div>

            {/* Decision Points Breakdown Badges */}
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-neutral-400 text-[11px]">Decision Points:</span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-cyan-300">
                  Branches: <strong className="text-white font-mono">{analysis.breakdown.branches}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-300">
                  Loops: <strong className="text-white font-mono">{analysis.breakdown.loops}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-300">
                  Logical Ops: <strong className="text-white font-mono">{analysis.breakdown.logicalOps}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-purple-300">
                  Ternary: <strong className="text-white font-mono">{analysis.breakdown.ternaryOps}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-rose-300">
                  Exceptions: <strong className="text-white font-mono">{analysis.breakdown.exceptions}</strong>
                </span>
              </div>

              {onOpenAnalyzerModal && (
                <button
                  onClick={onOpenAnalyzerModal}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/50 text-xs font-medium transition-colors"
                >
                  <span>Inspect Full Static Report</span>
                  <ExternalLink size={12} />
                </button>
              )}
            </div>

            {/* Top Recommendation Preview */}
            {analysis.recommendations.length > 0 && (
              <div className="p-2.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-neutral-300 flex items-start gap-2">
                <span className="text-amber-400 text-sm font-bold">💡</span>
                <div className="leading-relaxed">
                  <strong className="text-neutral-200">Analyzer Recommendation: </strong>
                  {analysis.recommendations[0]}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
