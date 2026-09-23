import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronRight,
  Play,
  Copy,
  Check,
  ShieldCheck,
  Gauge
} from 'lucide-react';
import { ActiveBottomTab, Diagnostic, VFSNode } from '../types/ide';

interface TerminalProps {
  activeTab: ActiveBottomTab;
  onChangeTab: (tab: ActiveBottomTab) => void;
  diagnostics: Diagnostic[];
  onSelectDiagnosticLine: (line: number) => void;
  outputLogs: { type: 'log' | 'warn' | 'error' | 'info'; text: string; time: string }[];
  onClearLogs: () => void;
  onExecuteCommand: (cmd: string) => Promise<string | void>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  testComponent?: React.ReactNode;
  profilerComponent?: React.ReactNode;
  failedTestsCount?: number;
}

export const Terminal: React.FC<TerminalProps> = ({
  activeTab,
  onChangeTab,
  diagnostics,
  onSelectDiagnosticLine,
  outputLogs,
  onClearLogs,
  onExecuteCommand,
  isExpanded,
  onToggleExpand,
  testComponent,
  profilerComponent,
  failedTestsCount = 0,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [terminalLines, setTerminalLines] = useState<{ id: string; text: string; type: 'prompt' | 'output' | 'error' | 'success' }[]>([
    { id: '1', text: 'B Code Sandbox v1.0.0 [Linux x86_64 web-container]', type: 'output' },
    { id: '2', text: 'Type "help" to see available terminal commands, or "run" to execute current project.', type: 'output' },
  ]);
  const [copied, setCopied] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines, outputLogs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    // Add prompt line
    setTerminalLines((prev) => [
      ...prev,
      { id: 'cmd-' + Date.now(), text: `b-code@sandbox:~/project$ ${cmd}`, type: 'prompt' },
    ]);
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInput('');

    if (cmd === 'clear') {
      setTerminalLines([]);
      return;
    }

    try {
      const response = await onExecuteCommand(cmd);
      if (response) {
        setTerminalLines((prev) => [
          ...prev,
          { id: 'res-' + Date.now(), text: response, type: 'output' },
        ]);
      }
    } catch (err: any) {
      setTerminalLines((prev) => [
        ...prev,
        { id: 'err-' + Date.now(), text: err?.message || String(err), type: 'error' },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] || '');
      }
    }
  };

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div
      className={`bg-[#0b0f19] border-t border-neutral-800 flex flex-col shrink-0 transition-all duration-200 ${
        isExpanded ? 'h-96' : 'h-48'
      }`}
    >
      {/* Tab Navigation Header */}
      <div className="h-8 bg-neutral-900 border-b border-neutral-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => onChangeTab('terminal')}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'terminal'
                ? 'bg-[#0b0f19] text-white border-t-2 border-t-cyan-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TerminalIcon size={13} />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => onChangeTab('output')}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'output'
                ? 'bg-[#0b0f19] text-white border-t-2 border-t-cyan-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ChevronRight size={13} />
            <span>Output</span>
            {outputLogs.length > 0 && (
              <span className="text-[10px] bg-neutral-800 px-1 rounded-full font-mono">
                {outputLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeTab('problems')}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'problems'
                ? 'bg-[#0b0f19] text-white border-t-2 border-t-cyan-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <AlertCircle size={13} className={errorCount > 0 ? 'text-rose-400' : ''} />
            <span>Problems</span>
            {diagnostics.length > 0 && (
              <span
                className={`text-[10px] px-1 rounded-full font-mono ${
                  errorCount > 0 ? 'bg-rose-900/60 text-rose-300' : 'bg-amber-900/60 text-amber-300'
                }`}
              >
                {diagnostics.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeTab('tests')}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'tests'
                ? 'bg-[#0b0f19] text-white border-t-2 border-t-cyan-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Test Suite</span>
            {failedTestsCount > 0 && (
              <span className="text-[10px] bg-rose-900/60 text-rose-300 px-1 rounded-full font-mono">
                {failedTestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeTab('profiler')}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'profiler'
                ? 'bg-[#0b0f19] text-white border-t-2 border-t-cyan-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gauge size={13} className="text-amber-400" />
            <span>Profiler</span>
          </button>
        </div>

        {/* Tab Controls (Clear, Maximize) */}
        <div className="flex items-center gap-1 text-neutral-400">
          <button
            onClick={() => {
              if (activeTab === 'terminal') setTerminalLines([]);
              else onClearLogs();
            }}
            className="p-1 hover:text-white hover:bg-neutral-800 rounded"
            title="Clear panel"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1 hover:text-white hover:bg-neutral-800 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-neutral-300">
        {/* TAB 1: TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-1" onClick={() => inputRef.current?.focus()}>
            {terminalLines.map((line) => (
              <div
                key={line.id}
                className={`whitespace-pre-wrap leading-relaxed ${
                  line.type === 'prompt'
                    ? 'text-cyan-400 font-semibold'
                    : line.type === 'error'
                    ? 'text-rose-400'
                    : line.type === 'success'
                    ? 'text-emerald-400'
                    : 'text-neutral-300'
                }`}
              >
                {line.text}
              </div>
            ))}

            {/* Current prompt input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-1 pt-1">
              <span className="text-cyan-400 font-semibold select-none">
                b-code@sandbox:~/project$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white outline-none border-none p-0 font-mono text-xs"
                autoFocus
              />
            </form>
            <div ref={endRef} />
          </div>
        )}

        {/* TAB 2: OUTPUT / CONSOLE */}
        {activeTab === 'output' && (
          <div className="space-y-1">
            {outputLogs.length === 0 ? (
              <div className="text-neutral-500 py-4 text-center">No program output recorded yet. Run a script or preview app.</div>
            ) : (
              outputLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5 leading-relaxed">
                  <span className="text-[10px] text-neutral-500 shrink-0 select-none">
                    [{log.time}]
                  </span>
                  <span
                    className={`whitespace-pre-wrap ${
                      log.type === 'error'
                        ? 'text-rose-400 font-semibold'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : log.type === 'info'
                        ? 'text-sky-400'
                        : 'text-neutral-200'
                    }`}
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        )}

        {/* TAB 3: PROBLEMS / DIAGNOSTICS */}
        {activeTab === 'problems' && (
          <div className="space-y-1.5">
            {diagnostics.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 py-4 px-2">
                <CheckCircle2 size={16} />
                <span>No problems detected in the current workspace.</span>
              </div>
            ) : (
              diagnostics.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onSelectDiagnosticLine(d.line)}
                  className="flex items-center justify-between p-1.5 hover:bg-neutral-800 rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {d.severity === 'error' ? (
                      <AlertCircle size={14} className="text-rose-400 shrink-0" />
                    ) : d.severity === 'warning' ? (
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
                    )}
                    <span className="text-neutral-200">{d.message}</span>
                    {d.source && (
                      <span className="text-[10px] text-neutral-500 font-sans">({d.source})</span>
                    )}
                  </div>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    Ln {d.line}, Col {d.column}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: TEST RUNNER */}
        {activeTab === 'tests' && (
          <div className="h-full -m-3">
            {testComponent}
          </div>
        )}

        {/* TAB 5: PERFORMANCE PROFILER */}
        {activeTab === 'profiler' && (
          <div className="h-full -m-3">
            {profilerComponent}
          </div>
        )}
      </div>
    </div>
  );
};
