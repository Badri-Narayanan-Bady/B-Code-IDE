import React, { useState } from 'react';
import {
  X,
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Code2,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  TrendingUp,
  Cpu,
  ArrowRight,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { CodeAnalysisResult, SupportedLanguage, RiskLevel } from '../types/ide';
import { LANGUAGES } from '../utils/languages';

interface CodeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: CodeAnalysisResult;
  fileName: string;
  language: SupportedLanguage;
}

export const CodeAnalyzerModal: React.FC<CodeAnalyzerModalProps> = ({
  isOpen,
  onClose,
  analysis,
  fileName,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'functions' | 'performance' | 'recommendations'>(
    'overview'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const langMeta = LANGUAGES[language] || LANGUAGES.python;

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'low':
        return {
          bg: 'bg-emerald-950/70 border-emerald-800/50 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'Low Risk (1-5)',
          desc: 'Simple and maintainable. Low defect probability; easily covered by unit tests.',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-950/70 border-amber-800/50 text-amber-400',
          dot: 'bg-amber-400',
          label: 'Moderate Risk (6-10)',
          desc: 'Acceptable complexity. Good structure, moderate test branches needed.',
        };
      case 'high':
        return {
          bg: 'bg-orange-950/70 border-orange-800/50 text-orange-400',
          dot: 'bg-orange-400',
          label: 'High Risk (11-20)',
          desc: 'Elevated complexity. Consider splitting logic or applying guard clauses.',
        };
      case 'critical':
        return {
          bg: 'bg-rose-950/70 border-rose-800/50 text-rose-400',
          dot: 'bg-rose-400',
          label: 'Critical Risk (>20)',
          desc: 'Very complex, high defect hazard. Strongly recommend decomposition.',
        };
    }
  };

  const currentRisk = getRiskBadge(analysis.risk);

  const handleCopyReport = () => {
    const report = [
      `=== B CODE IDE - STATIC ANALYSIS REPORT ===`,
      `File: ${fileName} (${langMeta.name})`,
      `Lines of Code: ${analysis.linesOfCode} (LOC) | Comments: ${analysis.commentLines}`,
      ``,
      `--- CYCLOMATIC COMPLEXITY ---`,
      `Total Cyclomatic Complexity: ${analysis.totalCyclomaticComplexity}`,
      `Risk Assessment: ${analysis.risk.toUpperCase()}`,
      `Cognitive Complexity: ${analysis.cognitiveComplexity}`,
      `Branches (if/else/case): ${analysis.breakdown.branches}`,
      `Loops (for/while): ${analysis.breakdown.loops}`,
      `Logical Ops (&&, ||): ${analysis.breakdown.logicalOps}`,
      `Ternary Operators: ${analysis.breakdown.ternaryOps}`,
      `Exception Handlers: ${analysis.breakdown.exceptions}`,
      ``,
      `--- ESTIMATED EXECUTION TIME & ASYMPTOTICS ---`,
      `Asymptotic Bound: ${analysis.executionEstimate.asymptoticNotation} (${analysis.executionEstimate.asymptoticLabel})`,
      `Estimated Runtime: ${analysis.executionEstimate.durationRange} (N=10,000)`,
      `Max Loop Nesting Depth: ${analysis.executionEstimate.maxLoopDepth}`,
      `Recursive Hazard: ${analysis.executionEstimate.recursiveCallsDetected ? 'Detected' : 'None'}`,
      ``,
      `--- MAINTAINABILITY ---`,
      `Maintainability Index (SEI): ${analysis.maintainabilityIndex}/100 (${analysis.maintainabilityLabel})`,
      `Halstead Volume: ${analysis.halsteadVolume}`,
      ``,
      `--- RECOMMENDATIONS ---`,
      ...analysis.recommendations.map((r, i) => `${i + 1}. ${r}`),
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-violet-600/30 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Code Static Analyzer</h2>
                <span
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${langMeta.color}15`,
                    borderColor: `${langMeta.color}40`,
                    color: langMeta.color,
                  }}
                >
                  {langMeta.name}
                </span>
                <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                  • {fileName}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Thomas McCabe Cyclomatic Complexity, Big-O runtime modeling & Maintainability Index
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
              title="Copy analysis audit report"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span className="hidden sm:inline">Copy Report</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 4 Key KPI Scorecards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-neutral-950/60 border-b border-neutral-800 shrink-0">
          {/* 1. Cyclomatic Complexity Score */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <GitBranch size={14} className="text-cyan-400" />
                Cyclomatic (M)
              </span>
              <span className="text-[10px] uppercase font-mono text-neutral-500">McCabe</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {analysis.totalCyclomaticComplexity}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                / {analysis.linesOfCode} LOC
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${currentRisk.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentRisk.dot}`} />
              <span className="truncate">{currentRisk.label}</span>
            </div>
          </div>

          {/* 2. Estimated Execution Time & Big-O */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" />
                Estimated Time
              </span>
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">
                {analysis.executionEstimate.asymptoticNotation}
              </span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
                {analysis.executionEstimate.durationRange}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              {analysis.executionEstimate.asymptoticLabel}
            </div>
          </div>

          {/* 3. Maintainability Index */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-400" />
                Maintainability
              </span>
              <span className="text-[10px] uppercase font-mono text-neutral-500">SEI Index</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {analysis.maintainabilityIndex}
              </span>
              <span className="text-xs text-neutral-400 font-mono">/ 100</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analysis.maintainabilityIndex >= 85
                    ? 'bg-emerald-500'
                    : analysis.maintainabilityIndex >= 65
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, analysis.maintainabilityIndex))}%` }}
              />
            </div>
          </div>

          {/* 4. Cognitive Complexity */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                Cognitive Load
              </span>
              <span className="text-[10px] uppercase font-mono text-neutral-500">Nesting</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {analysis.cognitiveComplexity}
              </span>
              <span className="text-xs text-neutral-400 font-mono">points</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Max nesting depth: <span className="font-mono text-neutral-200">{analysis.executionEstimate.maxLoopDepth}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-neutral-800 bg-neutral-950/30 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers size={14} />
            <span>Complexity & Decisions</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'performance'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu size={14} />
            <span>Execution Time & Big-O</span>
          </button>
          <button
            onClick={() => setActiveTab('functions')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'functions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 size={14} />
            <span>Functions Breakdown</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {analysis.functions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'recommendations'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Refactoring Suggestions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 font-mono border border-amber-800/40">
              {analysis.recommendations.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-5">
          {/* TAB 1: OVERVIEW & DECISION POINTS BREAKDOWN */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Cyclomatic Risk Summary Card */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">McCabe Complexity Analysis</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${currentRisk.bg}`}>
                      {analysis.risk.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed max-w-xl">
                    {currentRisk.desc}
                  </p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center min-w-32">
                  <div className="text-[10px] uppercase text-neutral-500 font-mono">Base Formula</div>
                  <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                    M = π + 1 = {analysis.totalCyclomaticComplexity}
                  </div>
                  <div className="text-[10px] text-neutral-400">π = {analysis.totalCyclomaticComplexity - 1} decision points</div>
                </div>
              </div>

              {/* Decision Points Breakdown Grid */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                  Decision Points Composition
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="text-neutral-400 text-[11px]">Branches (if / elif / case)</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                      {analysis.breakdown.branches}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Linear branch points</div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="text-neutral-400 text-[11px]">Loops (for / while)</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      {analysis.breakdown.loops}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Iterative control structures</div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="text-neutral-400 text-[11px]">Logical Operators (&& / ||)</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                      {analysis.breakdown.logicalOps}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Compound boolean decisions</div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="text-neutral-400 text-[11px]">Ternary Conditionals</div>
                    <div className="text-lg font-bold font-mono text-purple-400 mt-1">
                      {analysis.breakdown.ternaryOps}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Inline conditional expressions</div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="text-neutral-400 text-[11px]">Exception Handlers</div>
                    <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                      {analysis.breakdown.exceptions}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">catch / except rescue blocks</div>
                  </div>

                  {language === 'sql' ? (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="text-neutral-400 text-[11px]">SQL Filter & Join Clauses</div>
                      <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
                        {analysis.breakdown.sqlClauses}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">WHERE, HAVING, JOIN, UNION</div>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="text-neutral-400 text-[11px]">Halstead Volume</div>
                      <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
                        {analysis.halsteadVolume}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">Token vocabulary density</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Codebase Volume Statistics */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Source Code Structure & Density
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-850">
                    <div className="text-[11px] text-neutral-400">Executable Lines</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {analysis.linesOfCode}
                    </div>
                  </div>
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-850">
                    <div className="text-[11px] text-neutral-400">Comments</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-1">
                      {analysis.commentLines}
                    </div>
                  </div>
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-850">
                    <div className="text-[11px] text-neutral-400">Blank Lines</div>
                    <div className="text-base font-bold font-mono text-neutral-400 mt-1">
                      {analysis.blankLines}
                    </div>
                  </div>
                  <div className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-850">
                    <div className="text-[11px] text-neutral-400">Functions / Blocks</div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                      {analysis.functions.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION TIME ESTIMATION & BIG-O */}
          {activeTab === 'performance' && (
            <div className="space-y-5">
              {/* Asymptotic Runtime Hero Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-neutral-950 to-neutral-950 border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {analysis.executionEstimate.asymptoticNotation}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      • {analysis.executionEstimate.asymptoticLabel}
                    </span>
                  </div>
                  <p className="text-neutral-400 text-xs mt-1.5 max-w-lg leading-relaxed">
                    Estimated runtime modeling based on control-flow analysis, loop nesting hierarchy,
                    recursive branching, and instruction sequence evaluation.
                  </p>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 text-right shrink-0">
                  <div className="text-[10px] uppercase text-neutral-500 font-mono">Estimated Duration (N=10,000)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    {analysis.executionEstimate.durationRange}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Category: <span className="capitalize font-semibold text-neutral-200">{analysis.executionEstimate.category}</span>
                  </div>
                </div>
              </div>

              {/* Theoretical Operations Scaling Table */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <TrendingUp size={15} className="text-cyan-400" />
                    Theoretical Scaling & Operation Growth
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">Modern 3.2 GHz CPU Reference</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="text-[11px] text-neutral-400 font-medium">Small Input (N = 100)</div>
                    <div className="text-sm font-bold font-mono text-cyan-400 mt-1">
                      {analysis.executionEstimate.estimatedOpsSmall}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">&lt; 0.05 ms latency</div>
                  </div>

                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="text-[11px] text-neutral-400 font-medium">Medium Input (N = 10,000)</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                      {analysis.executionEstimate.estimatedOpsMedium}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      ~{analysis.executionEstimate.estimatedDurationMs} ms estimated
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="text-[11px] text-neutral-400 font-medium">Large Input (N = 100,000)</div>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                      {analysis.executionEstimate.estimatedOpsLarge}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Production scale estimate</div>
                  </div>
                </div>
              </div>

              {/* Hardware Latency Breakdown Simulation */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu size={14} className="text-indigo-400" />
                    Simulated Hardware Pipeline Allocation
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Total: {(analysis.executionEstimate.estimatedDurationMs).toFixed(3)} ms
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">CPU Arithmetic & Logic Cycles (ALU)</span>
                      <span className="font-mono text-cyan-400">65% (~{(analysis.executionEstimate.latencyBreakdown.cpuCyclesNs / 1000).toFixed(1)} µs)</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">Memory & L1/L2 Cache Access</span>
                      <span className="font-mono text-emerald-400">25% (~{(analysis.executionEstimate.latencyBreakdown.memoryAccessNs / 1000).toFixed(1)} µs)</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">System Calls & I/O Latency</span>
                      <span className="font-mono text-amber-400">10% (~{(analysis.executionEstimate.latencyBreakdown.ioLatencyNs / 1000).toFixed(1)} µs)</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recursion & Loop Analysis Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">Loop Nesting Depth</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Maximum consecutive nested loop levels
                    </div>
                  </div>
                  <div className="text-base font-bold font-mono px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-cyan-400">
                    {analysis.executionEstimate.maxLoopDepth} levels
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">Recursive Branching</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Self-referencing call chain check
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-2.5 py-1 rounded border">
                    {analysis.executionEstimate.recursiveCallsDetected ? (
                      <span className="text-rose-400 border-rose-800 bg-rose-950/60 px-2 py-0.5 rounded">
                        Active Recursion
                      </span>
                    ) : (
                      <span className="text-emerald-400 border-emerald-800 bg-emerald-950/60 px-2 py-0.5 rounded">
                        Iterative / Flat
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUNCTIONS BREAKDOWN */}
          {activeTab === 'functions' && (
            <div className="space-y-4">
              {analysis.functions.length === 0 ? (
                <div className="p-8 text-center bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 space-y-2">
                  <Code2 size={32} className="mx-auto text-neutral-600" />
                  <div className="text-sm font-medium text-neutral-300">No Named Functions Found</div>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    The code runs as top-level script statements. Total file cyclomatic complexity is {analysis.totalCyclomaticComplexity}.
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-900/80 border-b border-neutral-800 text-[11px] text-neutral-400 uppercase font-mono">
                        <th className="py-2.5 px-3">Function / Block</th>
                        <th className="py-2.5 px-3">Lines</th>
                        <th className="py-2.5 px-3">LOC</th>
                        <th className="py-2.5 px-3">Cyclomatic (M)</th>
                        <th className="py-2.5 px-3">Risk</th>
                        <th className="py-2.5 px-3">Suggestion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 font-mono text-xs">
                      {analysis.functions.map((fn, idx) => {
                        const badge = getRiskBadge(fn.risk);
                        return (
                          <tr key={idx} className="hover:bg-neutral-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-cyan-300">
                              {fn.name}()
                            </td>
                            <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                              L{fn.startLine} - L{fn.endLine}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-300">{fn.loc}</td>
                            <td className="py-2.5 px-3 font-bold text-white">
                              {fn.cyclomaticComplexity}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}
                              >
                                {fn.risk.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] font-sans text-neutral-400">
                              {fn.suggestion || 'Structured properly'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Targeted Static Analysis Insights
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {analysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <p className="text-neutral-300 text-xs leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Practice Reference Card */}
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-2">
                <h4 className="text-xs font-semibold text-neutral-300">
                  How McCabe Cyclomatic Complexity Impacts Quality
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-neutral-400 mt-2">
                  <div className="p-2.5 rounded bg-neutral-900/40 border border-neutral-850">
                    <span className="font-semibold text-emerald-400 block mb-1">M ≤ 10 (Target)</span>
                    Ideal for core production algorithms. Requires minimal unit test branches to reach 100% path coverage.
                  </div>
                  <div className="p-2.5 rounded bg-neutral-900/40 border border-neutral-850">
                    <span className="font-semibold text-rose-400 block mb-1">M &gt; 15 (Refactor)</span>
                    Exponentially increases cognitive maintenance burden and bug regression frequency according to NIST SEI standards.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0 text-xs">
          <div className="text-neutral-500 font-mono text-[11px]">
            Analyzed {analysis.linesOfCode} lines of {langMeta.name} code • Real-time in-browser AST
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
          >
            Close Analyzer
          </button>
        </div>
      </div>
    </div>
  );
};
