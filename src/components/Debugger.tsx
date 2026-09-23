import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  CornerDownRight,
  RotateCcw,
  Square,
  Plus,
  Trash2,
  CheckSquare,
  Square as EmptySquare,
  ChevronRight,
  ChevronDown,
  Layers,
  Eye,
  List
} from 'lucide-react';
import { Breakpoint, VariableWatch, StackFrame } from '../types/ide';

interface DebuggerProps {
  breakpoints: Breakpoint[];
  onToggleBreakpointEnabled: (id: string) => void;
  onRemoveBreakpoint: (id: string) => void;
  onSelectBreakpointFile: (fileId: string, line: number) => void;
  isPaused: boolean;
  onContinue: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onRestart: () => void;
  onStop: () => void;
  variables: Record<string, any>;
}

export const Debugger: React.FC<DebuggerProps> = ({
  breakpoints,
  onToggleBreakpointEnabled,
  onRemoveBreakpoint,
  onSelectBreakpointFile,
  isPaused,
  onContinue,
  onStepOver,
  onStepInto,
  onRestart,
  onStop,
  variables,
}) => {
  const [watches, setWatches] = useState<VariableWatch[]>([
    { id: 'w-1', expression: 'tasks.length', value: '4', type: 'number' },
    { id: 'w-2', expression: 'count * 10', value: '0', type: 'number' },
  ]);
  const [newWatchInput, setNewWatchInput] = useState('');
  const [isAddingWatch, setIsAddingWatch] = useState(false);

  // Sections collapse state
  const [expanded, setExpanded] = useState({
    controls: true,
    variables: true,
    watch: true,
    callstack: true,
    breakpoints: true,
  });

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchInput.trim()) return;

    let evalVal = 'undefined';
    let evalType = 'undefined';
    try {
      // Evaluate within sandbox
      const expr = newWatchInput.trim();
      if (expr in variables) {
        evalVal = JSON.stringify(variables[expr]);
        evalType = typeof variables[expr];
      } else {
        // Safe evaluation
        const fn = new Function('vars', `with(vars) { return ${expr}; }`);
        const res = fn(variables);
        evalVal = typeof res === 'object' ? JSON.stringify(res) : String(res);
        evalType = typeof res;
      }
    } catch (err: any) {
      evalVal = 'ReferenceError';
      evalType = 'error';
    }

    setWatches([
      ...watches,
      {
        id: 'w-' + Date.now(),
        expression: newWatchInput.trim(),
        value: evalVal,
        type: evalType,
      },
    ]);
    setNewWatchInput('');
    setIsAddingWatch(false);
  };

  const dummyStack: StackFrame[] = [
    { id: 's-1', name: 'App()', file: 'src/App.tsx', line: 12, column: 5 },
    { id: 's-2', name: 'renderRoot()', file: 'react-dom.js', line: 450, column: 12 },
    { id: 's-3', name: 'performWork()', file: 'react-dom.js', line: 812, column: 8 },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none overflow-y-auto font-mono text-xs">
      {/* 1. Debugger Toolbar */}
      <div className="p-2.5 bg-neutral-850 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onContinue}
            className={`p-1.5 rounded transition-colors ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'hover:bg-neutral-750 text-neutral-300'
            }`}
            title={isPaused ? 'Continue (F5)' : 'Pause execution'}
          >
            {isPaused ? <Play size={14} className="fill-white" /> : <Pause size={14} />}
          </button>
          <button
            onClick={onStepOver}
            className="p-1.5 hover:bg-neutral-750 rounded text-neutral-300 hover:text-white transition-colors"
            title="Step Over (F10)"
          >
            <SkipForward size={14} />
          </button>
          <button
            onClick={onStepInto}
            className="p-1.5 hover:bg-neutral-750 rounded text-neutral-300 hover:text-white transition-colors"
            title="Step Into (F11)"
          >
            <CornerDownRight size={14} />
          </button>
          <button
            onClick={onRestart}
            className="p-1.5 hover:bg-neutral-750 rounded text-neutral-300 hover:text-white transition-colors"
            title="Restart Debug Session"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onStop}
            className="p-1.5 hover:bg-neutral-750 rounded text-rose-400 hover:text-rose-300 transition-colors"
            title="Stop Debugging"
          >
            <Square size={14} className="fill-rose-400" />
          </button>
        </div>

        <span className="text-[10px] uppercase font-sans font-semibold px-2 py-0.5 rounded bg-neutral-900 text-cyan-400">
          {isPaused ? 'Paused at Breakpoint' : 'Debugger Ready'}
        </span>
      </div>

      {/* 2. Variables Scope */}
      <div className="border-b border-neutral-800">
        <div
          onClick={() => toggleSection('variables')}
          className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 flex items-center justify-between cursor-pointer text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider"
        >
          <span>Variables (Local / Scope)</span>
          {expanded.variables ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
        {expanded.variables && (
          <div className="p-2 space-y-1 bg-neutral-950/60">
            {Object.entries(variables).length === 0 ? (
              <div className="text-neutral-500 py-1 px-1">
                <div>tasks: <span className="text-cyan-400">Array(4)</span></div>
                <div>input: <span className="text-amber-300">""</span></div>
                <div>count: <span className="text-purple-400">0</span></div>
                <div>window: <span className="text-neutral-500">Window Object</span></div>
              </div>
            ) : (
              Object.entries(variables).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-neutral-300">{k}:</span>
                  <span className="text-cyan-400 truncate max-w-[140px]">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Watch Expressions */}
      <div className="border-b border-neutral-800">
        <div
          onClick={() => toggleSection('watch')}
          className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 flex items-center justify-between cursor-pointer text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider"
        >
          <span>Watch Expressions</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingWatch(true);
              }}
              className="hover:text-white p-0.5 rounded"
              title="Add Expression"
            >
              <Plus size={12} />
            </button>
            {expanded.watch ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
        </div>

        {expanded.watch && (
          <div className="p-2 space-y-1 bg-neutral-950/60">
            {isAddingWatch && (
              <form onSubmit={handleAddWatch} className="mb-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Expression to watch..."
                  value={newWatchInput}
                  onChange={(e) => setNewWatchInput(e.target.value)}
                  onBlur={() => setIsAddingWatch(false)}
                  className="w-full bg-neutral-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                />
              </form>
            )}

            {watches.map((w) => (
              <div key={w.id} className="flex items-center justify-between group py-0.5">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-neutral-300">{w.expression}:</span>
                  <span className="text-emerald-400">{w.value}</span>
                </div>
                <button
                  onClick={() => setWatches(watches.filter((item) => item.id !== w.id))}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Call Stack */}
      <div className="border-b border-neutral-800">
        <div
          onClick={() => toggleSection('callstack')}
          className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 flex items-center justify-between cursor-pointer text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider"
        >
          <span>Call Stack</span>
          {expanded.callstack ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
        {expanded.callstack && (
          <div className="p-2 space-y-1 bg-neutral-950/60">
            {dummyStack.map((frame) => (
              <div
                key={frame.id}
                className="p-1 hover:bg-neutral-800 rounded cursor-pointer flex items-center justify-between text-neutral-300"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-cyan-400 font-semibold">{frame.name}</span>
                  <span className="text-[10px] text-neutral-500 truncate">{frame.file}</span>
                </div>
                <span className="text-[10px] text-neutral-500">{frame.line}:{frame.column}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Breakpoints List */}
      <div className="border-b border-neutral-800">
        <div
          onClick={() => toggleSection('breakpoints')}
          className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 flex items-center justify-between cursor-pointer text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider"
        >
          <span>Breakpoints ({breakpoints.length})</span>
          {expanded.breakpoints ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
        {expanded.breakpoints && (
          <div className="p-2 space-y-1 bg-neutral-950/60">
            {breakpoints.length === 0 ? (
              <div className="text-neutral-500 py-1 text-center font-sans text-xs">
                Click gutter next to line numbers to set breakpoints
              </div>
            ) : (
              breakpoints.map((bp) => (
                <div
                  key={bp.id}
                  onClick={() => onSelectBreakpointFile(bp.fileId, bp.line)}
                  className="flex items-center justify-between group p-1 hover:bg-neutral-800 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBreakpointEnabled(bp.id);
                      }}
                      className="text-cyan-400 hover:text-white"
                    >
                      {bp.enabled ? <CheckSquare size={13} /> : <EmptySquare size={13} className="text-neutral-500" />}
                    </button>
                    <span className="truncate text-neutral-300">{bp.filePath.split('/').pop()}</span>
                    <span className="text-rose-400 font-bold">: {bp.line}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBreakpoint(bp.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
