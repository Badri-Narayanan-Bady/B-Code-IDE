import React, { useState, useMemo } from 'react';
import {
  ListTree,
  Search,
  Code2,
  Boxes,
  FunctionSquare,
  Variable,
  FileCode,
  Layers,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { SymbolItem, SymbolKind } from '../types/ide';

interface SymbolOutlineProps {
  symbols: SymbolItem[];
  activeFileName?: string;
  onSelectSymbol: (line: number, col: number) => void;
  onOpenAstModal: () => void;
}

export const SymbolOutline: React.FC<SymbolOutlineProps> = ({
  symbols,
  activeFileName = 'Current File',
  onSelectSymbol,
  onOpenAstModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKind, setFilterKind] = useState<string>('all');
  const [collapsedClasses, setCollapsedClasses] = useState<Record<string, boolean>>({});

  const toggleClassCollapse = (id: string) => {
    setCollapsedClasses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSymbols = useMemo(() => {
    return symbols.filter((sym) => {
      const matchesSearch =
        sym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sym.signature && sym.signature.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesKind = filterKind === 'all' || sym.kind === filterKind;

      return matchesSearch && matchesKind;
    });
  }, [symbols, searchQuery, filterKind]);

  const getKindIcon = (kind: SymbolKind) => {
    switch (kind) {
      case 'function':
        return <FunctionSquare size={13} className="text-amber-400" />;
      case 'class':
        return <Boxes size={13} className="text-cyan-400" />;
      case 'method':
        return <Code2 size={13} className="text-emerald-400" />;
      case 'variable':
        return <Variable size={13} className="text-violet-400" />;
      case 'interface':
        return <Layers size={13} className="text-sky-400" />;
      case 'import':
        return <FileCode size={13} className="text-neutral-400" />;
      default:
        return <Code2 size={13} className="text-neutral-400" />;
    }
  };

  const getKindBadge = (kind: SymbolKind) => {
    switch (kind) {
      case 'function':
        return 'fn';
      case 'class':
        return 'cls';
      case 'method':
        return 'mth';
      case 'variable':
        return 'var';
      case 'interface':
        return 'type';
      case 'import':
        return 'imp';
      default:
        return 'sym';
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
        <div className="flex items-center gap-1.5 truncate">
          <ListTree size={14} className="text-cyan-400 shrink-0" />
          <span className="truncate">Outline: {activeFileName}</span>
        </div>
        <button
          onClick={onOpenAstModal}
          className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
          title="Inspect Abstract Syntax Tree"
        >
          <Eye size={11} />
          <span>AST</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-2 border-b border-neutral-800/80 space-y-1.5">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2 text-neutral-500" />
          <input
            type="text"
            placeholder="Filter symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded pl-7 pr-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Kind Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
          {['all', 'function', 'class', 'variable', 'interface'].map((k) => (
            <button
              key={k}
              onClick={() => setFilterKind(k)}
              className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                filterKind === k
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-xs">
        {filteredSymbols.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-xs">
            {symbols.length === 0 ? 'No symbols found in current file' : 'No matching symbols'}
          </div>
        ) : (
          filteredSymbols.map((sym) => {
            const hasChildren = sym.children && sym.children.length > 0;
            const isCollapsed = collapsedClasses[sym.id] ?? false;

            return (
              <div key={sym.id} className="space-y-0.5">
                <div
                  onClick={() => onSelectSymbol(sym.line, sym.col)}
                  className="group flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-800/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    {hasChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassCollapse(sym.id);
                        }}
                        className="p-0.5 hover:text-white rounded"
                      >
                        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                    <span className="shrink-0">{getKindIcon(sym.kind)}</span>
                    <span className="font-mono text-neutral-200 truncate group-hover:text-white">
                      {sym.name}
                    </span>
                    {sym.signature && (
                      <span className="text-[10px] text-neutral-500 font-mono truncate hidden group-hover:inline">
                        {sym.signature}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-neutral-500 font-mono text-[10px]">
                    <span className="opacity-60">{getKindBadge(sym.kind)}</span>
                    <span>:{sym.line}</span>
                  </div>
                </div>

                {/* Nested Children (Methods inside Class) */}
                {hasChildren && !isCollapsed && (
                  <div className="pl-4 border-l border-neutral-800 ml-3 space-y-0.5">
                    {sym.children!.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => onSelectSymbol(child.line, child.col)}
                        className="group flex items-center justify-between px-2 py-0.5 rounded hover:bg-neutral-800/60 cursor-pointer transition-colors text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate flex-1 mr-2">
                          <span className="shrink-0">{getKindIcon(child.kind)}</span>
                          <span className="font-mono text-neutral-300 truncate group-hover:text-white">
                            {child.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">:{child.line}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>{filteredSymbols.length} symbols indexed</span>
        <button
          onClick={onOpenAstModal}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>AST Inspector</span>
          <ArrowUpRight size={10} />
        </button>
      </div>
    </div>
  );
};
