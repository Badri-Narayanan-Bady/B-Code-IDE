import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  ArrowDown,
  ArrowUp,
  FileCode,
  Upload,
  Copy,
  Check,
  RotateCcw,
  ChevronRight,
  Code2,
  Zap,
  Info,
  HelpCircle,
  Hash,
  Eye,
  Layers
} from 'lucide-react';
import { CodeFile, EditorSettings, CodeAnalysisResult } from '../types/ide';
import {
  tokenizeLine,
  TOKEN_COLOR_MAP,
  extractCodeSymbols,
  getActiveSymbolForLine,
  CodeSymbol,
  HOVER_DOCS,
  HoverDocInfo,
} from '../utils/syntax';
import { LANGUAGES } from '../utils/languages';

interface EditorProps {
  file: CodeFile;
  onChangeContent: (newContent: string) => void;
  onUploadFile: (file: File) => void;
  settings: EditorSettings;
  onRun?: () => void;
  onFormat?: () => void;
  analysis?: CodeAnalysisResult;
  onOpenAnalyzer?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  file,
  onChangeContent,
  onUploadFile,
  settings,
  onRun,
  onFormat,
  analysis,
  onOpenAnalyzer,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find & Replace
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findMatches, setFindMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // VS Code Symbols & Navigation Popover
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);
  const [activeHoverDoc, setActiveHoverDoc] = useState<HoverDocInfo | null>(null);

  const currentLang = LANGUAGES[file.language] || LANGUAGES.python;
  const lines = useMemo(() => file.content.split('\n'), [file.content]);

  // Tokenize all lines using the VS Code-grade tokenizer
  const tokenizedLines = useMemo(() => {
    return lines.map((line) => tokenizeLine(line, file.language));
  }, [lines, file.language]);

  // Extract all symbols (functions, classes, SQL tables)
  const symbols = useMemo(() => {
    return extractCodeSymbols(file.content, file.language);
  }, [file.content, file.language]);

  // Active Symbol based on current line
  const activeSymbol = useMemo(() => {
    return getActiveSymbolForLine(symbols, cursorPos.line);
  }, [symbols, cursorPos.line]);

  // Filtered symbols for picker
  const filteredSymbols = useMemo(() => {
    if (!symbolSearch.trim()) return symbols;
    return symbols.filter(
      (s) =>
        s.name.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        s.signature.toLowerCase().includes(symbolSearch.toLowerCase())
    );
  }, [symbols, symbolSearch]);

  // Sync scroll across textarea, syntax layer, and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  };

  // Update cursor position and detect hovered word doc
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;
    const textBefore = file.content.substring(0, selStart);
    const lineList = textBefore.split('\n');
    const currentLine = lineList.length;
    const currentCol = lineList[lineList.length - 1].length + 1;

    setCursorPos({
      line: currentLine,
      col: currentCol,
    });

    // Detect word at cursor for quick hover doc
    const currentLineText = lineList[lineList.length - 1] || '';
    const match = currentLineText.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    if (match && HOVER_DOCS[match[0]]) {
      setActiveHoverDoc(HOVER_DOCS[match[0]]);
    } else {
      setActiveHoverDoc(null);
    }
  }, [file.content]);

  // Jump to specific line (used by Symbol Picker)
  const jumpToLine = useCallback(
    (targetLine: number) => {
      let charIdx = 0;
      for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
        charIdx += lines[i].length + 1; // +1 for \n
      }

      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charIdx, charIdx);

        // Approximate line scroll
        const approxLineHeight = settings.fontSize * 1.6;
        textareaRef.current.scrollTop = Math.max(0, (targetLine - 4) * approxLineHeight);
        updateCursorPosition();
      }
      setShowSymbolPicker(false);
    },
    [lines, settings.fontSize, updateCursorPosition]
  );

  // Handle Tab key and shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = ' '.repeat(settings.tabSize || 4);

      const newContent = file.content.substring(0, start) + spaces + file.content.substring(end);
      onChangeContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        updateCursorPosition();
      }, 0);
      return;
    }

    // Ctrl+F Find
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowFind(true);
      return;
    }

    // Alt+Shift+F Format
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      onFormat?.();
      return;
    }

    // F5 Run
    if (e.key === 'F5') {
      e.preventDefault();
      onRun?.();
      return;
    }
  };

  // Find matching indices
  useEffect(() => {
    if (!findQuery) {
      setFindMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    const matches: number[] = [];
    let idx = file.content.toLowerCase().indexOf(findQuery.toLowerCase());
    while (idx !== -1) {
      matches.push(idx);
      idx = file.content.toLowerCase().indexOf(findQuery.toLowerCase(), idx + 1);
    }
    setFindMatches(matches);
    setCurrentMatchIndex(0);
  }, [findQuery, file.content]);

  // Jump to match
  const handleNextMatch = () => {
    if (findMatches.length === 0 || !textareaRef.current) return;
    const nextIdx = (currentMatchIndex + 1) % findMatches.length;
    setCurrentMatchIndex(nextIdx);
    const pos = findMatches[nextIdx];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + findQuery.length);
    updateCursorPosition();
  };

  const handlePrevMatch = () => {
    if (findMatches.length === 0 || !textareaRef.current) return;
    const prevIdx = (currentMatchIndex - 1 + findMatches.length) % findMatches.length;
    setCurrentMatchIndex(prevIdx);
    const pos = findMatches[prevIdx];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + findQuery.length);
    updateCursorPosition();
  };

  const handleReplaceCurrent = () => {
    if (findMatches.length === 0 || !textareaRef.current) return;
    const pos = findMatches[currentMatchIndex];
    const newContent =
      file.content.substring(0, pos) + replaceQuery + file.content.substring(pos + findQuery.length);
    onChangeContent(newContent);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const newContent = file.content.replace(regex, replaceQuery);
    onChangeContent(newContent);
  };

  // Drag and drop code files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onUploadFile(droppedFile);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full bg-[#1e1e1e] relative overflow-hidden select-text text-[#d4d4d4]"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md z-50 border-2 border-dashed border-cyan-500 rounded-lg flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950/50">
            <Upload size={32} className="animate-bounce" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Drop your code file here</h3>
          <p className="text-xs text-neutral-400 mt-1">Supports Python, JavaScript, Java, C++, C, SQL</p>
        </div>
      )}

      {/* 1. VS Code Style Subheader: Breadcrumbs & Actions Bar */}
      <div className="h-9 bg-[#252526] border-b border-[#333333] flex items-center justify-between px-3 shrink-0 select-none text-xs">
        {/* Left: VS Code Breadcrumb Path */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-neutral-300">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentLang.color }} />
            <span className="font-mono font-medium truncate max-w-[140px] sm:max-w-[200px]">
              {file.name}
            </span>
          </div>

          <ChevronRight size={13} className="text-neutral-500 shrink-0" />

          {/* Active Symbol Breadcrumb */}
          {activeSymbol ? (
            <button
              onClick={() => setShowSymbolPicker(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#333333] text-neutral-300 font-mono text-[11px] transition-colors group truncate max-w-[220px]"
              title="Click to view all functions and classes in file"
            >
              <span className="text-[#DCDCAA] font-bold">
                {activeSymbol.kind === 'class' ? '🏷️' : activeSymbol.kind === 'table' ? '🗄️' : '⚡'}
              </span>
              <span className="text-[#DCDCAA] font-medium truncate group-hover:underline">
                {activeSymbol.name}
              </span>
              <span className="text-neutral-500 text-[10px]">:{activeSymbol.line}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSymbolPicker(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#333333] text-neutral-400 font-mono text-[11px] transition-colors"
              title="View Outline"
            >
              <Layers size={13} className="text-neutral-400" />
              <span>{symbols.length} symbol{symbols.length === 1 ? '' : 's'}</span>
            </button>
          )}

          {/* Complexity Indicator Pill */}
          {analysis && onOpenAnalyzer && (
            <button
              onClick={onOpenAnalyzer}
              className={`hidden md:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono font-semibold border transition-all ${
                analysis.risk === 'low'
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/60'
                  : analysis.risk === 'moderate'
                  ? 'bg-amber-950/70 text-amber-400 border-amber-800/60 hover:bg-amber-900/60'
                  : 'bg-rose-950/70 text-rose-400 border-rose-800/60 hover:bg-rose-900/60'
              }`}
              title="Thomas McCabe Cyclomatic Complexity & Execution Time"
            >
              <Zap size={11} />
              <span>M={analysis.totalCyclomaticComplexity}</span>
              <span className="opacity-40">•</span>
              <span>{analysis.executionEstimate.asymptoticNotation}</span>
            </button>
          )}
        </div>

        {/* Right: Editor Actions & Quick Syntax Guide Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Symbol Outline Picker Button */}
          <button
            onClick={() => setShowSymbolPicker(!showSymbolPicker)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showSymbolPicker
                ? 'bg-[#007acc] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-[#333333]'
            }`}
            title="Quick Symbols & Functions Outline"
          >
            <Code2 size={13} />
            <span className="hidden sm:inline text-[11px]">Outline ({symbols.length})</span>
          </button>

          {/* Syntax Highlighting Legend Guide Toggle */}
          <button
            onClick={() => setShowSyntaxGuide(!showSyntaxGuide)}
            className={`p-1 rounded text-xs transition-colors ${
              showSyntaxGuide ? 'bg-[#333333] text-cyan-400' : 'text-neutral-400 hover:text-white hover:bg-[#333333]'
            }`}
            title="VS Code Syntax Colors & Token Guide"
          >
            <HelpCircle size={14} />
          </button>

          {/* Find & Replace */}
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1 rounded text-xs transition-colors ${
              showFind ? 'bg-[#333333] text-cyan-400' : 'text-neutral-400 hover:text-white hover:bg-[#333333]'
            }`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search size={14} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded text-neutral-400 hover:text-white hover:bg-[#333333] text-xs transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 2. VS Code Syntax Guide Drawer (Collapsible) */}
      {showSyntaxGuide && (
        <div className="bg-[#252526] border-b border-[#333333] p-2.5 z-30 shadow-lg text-xs animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={13} className="text-cyan-400" />
              VS Code Syntax Palette & Code Tokens ({currentLang.name})
            </span>
            <button
              onClick={() => setShowSyntaxGuide(false)}
              className="p-0.5 text-neutral-400 hover:text-white rounded hover:bg-[#333333]"
            >
              <X size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono text-[11px]">
            <div className="p-1.5 rounded bg-[#1e1e1e] border border-[#333333]">
              <span className="text-[#C586C0] font-semibold">if / return / for</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Control Flow Keywords</p>
            </div>
            <div className="p-1.5 rounded bg-[#1e1e1e] border border-[#333333]">
              <span className="text-[#569CD6] font-semibold">def / const / class</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Declarations & Types</p>
            </div>
            <div className="p-1.5 rounded bg-[#1e1e1e] border border-[#333333]">
              <span className="text-[#DCDCAA] font-semibold">function_call()</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Functions & Methods</p>
            </div>
            <div className="p-1.5 rounded bg-[#1e1e1e] border border-[#333333]">
              <span className="text-[#4EC9B0] font-semibold">String / Scanner</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Classes & Built-ins</p>
            </div>
            <div className="p-1.5 rounded bg-[#1e1e1e] border border-[#333333]">
              <span className="text-[#CE9178]">"hello world"</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">String Literals</p>
            </div>
            <div className="p-1.5 rounded bg-[#1e1e1e] border border-[#333333]">
              <span className="text-[#B5CEA8] font-semibold">42 / 3.1415</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Numbers & Constants</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. VS Code Symbol Outline Modal / Popover */}
      {showSymbolPicker && (
        <div className="absolute top-10 left-3 z-40 w-80 sm:w-96 max-h-96 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-[#333333] flex items-center justify-between bg-[#1e1e1e]">
            <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Code2 size={14} className="text-[#007acc]" />
              File Outline & Functions ({symbols.length})
            </span>
            <button
              onClick={() => setShowSymbolPicker(false)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#333333]"
            >
              <X size={13} />
            </button>
          </div>

          <div className="p-2 border-b border-[#333333] bg-[#252526]">
            <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1">
              <Search size={12} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Filter functions, classes, methods..."
                value={symbolSearch}
                onChange={(e) => setSymbolSearch(e.target.value)}
                className="bg-transparent text-white text-xs outline-none w-full font-mono"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-[#2d2d2d] max-h-72">
            {filteredSymbols.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500">
                {symbols.length === 0 ? 'No functions or classes found in current file.' : 'No symbols match filter.'}
              </div>
            ) : (
              filteredSymbols.map((sym, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToLine(sym.line)}
                  className="w-full text-left p-2.5 hover:bg-[#2a2d2e] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">
                      {sym.kind === 'class' ? '🏷️' : sym.kind === 'table' ? '🗄️' : '⚡'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-medium text-[#DCDCAA] group-hover:text-white truncate">
                        {sym.name}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate opacity-75">
                        {sym.signature}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#1e1e1e] text-neutral-400 border border-[#333333] shrink-0 ml-2">
                    Ln {sym.line}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Find & Replace Bar */}
      {showFind && (
        <div className="bg-[#252526] border-b border-[#333333] p-2 flex flex-wrap items-center gap-2 text-xs z-20 shadow-md">
          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1">
            <Search size={12} className="text-neutral-500" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-32 sm:w-44 text-xs font-mono"
              autoFocus
            />
            {findMatches.length > 0 && (
              <span className="text-[10px] text-neutral-400 font-mono">
                {currentMatchIndex + 1}/{findMatches.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrevMatch}
              className="p-1 hover:bg-[#333333] rounded text-neutral-400 hover:text-white"
              title="Previous match"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={handleNextMatch}
              className="p-1 hover:bg-[#333333] rounded text-neutral-400 hover:text-white"
              title="Next match"
            >
              <ArrowDown size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1">
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-32 sm:w-44 text-xs font-mono"
            />
          </div>

          <button
            onClick={handleReplaceCurrent}
            className="px-2 py-1 bg-[#333333] hover:bg-[#3c3c3c] text-neutral-200 rounded text-[11px]"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-1 bg-[#333333] hover:bg-[#3c3c3c] text-neutral-200 rounded text-[11px]"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 hover:bg-[#333333] rounded text-neutral-400 hover:text-white ml-auto"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 5. Main Dual-Layer Code Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-13 bg-[#1e1e1e] border-r border-[#333333] text-[#858585] select-none overflow-hidden text-right font-mono py-3 pr-2.5 shrink-0"
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6' }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                className={`${
                  cursorPos.line === i + 1
                    ? 'text-white font-bold bg-[#282828] -mr-2.5 pr-2.5 border-l-2 border-[#007acc]'
                    : ''
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Code Canvas Container: Pre Syntax Layer + Transparent Textarea */}
        <div className="flex-1 relative overflow-hidden h-full bg-[#1e1e1e]">
          {/* Syntax Highlighted Rendering Layer (Behind) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-3 m-0 font-mono overflow-hidden pointer-events-none select-none text-[#d4d4d4] leading-[1.6]"
            style={{
              fontSize: `${settings.fontSize}px`,
              tabSize: settings.tabSize,
              whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: settings.wordWrap ? 'break-all' : 'normal',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {tokenizedLines.map((lineTokens, lineIdx) => {
              const isCurrentLine = cursorPos.line === lineIdx + 1;
              return (
                <div
                  key={lineIdx}
                  className={`min-h-[1.6em] ${
                    isCurrentLine ? 'bg-[#282828]/50 rounded-sm' : ''
                  }`}
                >
                  {lineTokens.length === 0 ||
                  (lineTokens.length === 1 && lineTokens[0].text === '') ? (
                    '\n'
                  ) : (
                    lineTokens.map((tok, tIdx) => {
                      const tokenConfig = TOKEN_COLOR_MAP[tok.type];
                      return (
                        <span
                          key={tIdx}
                          className={tokenConfig?.twClass || 'text-[#d4d4d4]'}
                          style={{ color: tokenConfig?.color || '#d4d4d4' }}
                        >
                          {tok.text}
                        </span>
                      );
                    })
                  )}
                </div>
              );
            })}
          </pre>

          {/* Transparent Input Textarea (In Front) */}
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={(e) => {
              onChangeContent(e.target.value);
              updateCursorPosition();
            }}
            onScroll={handleScroll}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full p-3 m-0 font-mono bg-transparent text-transparent caret-[#569CD6] resize-none outline-none overflow-auto border-none focus:ring-0 leading-[1.6] selection:bg-[#264f78]/60 selection:text-transparent"
            style={{
              fontSize: `${settings.fontSize}px`,
              tabSize: settings.tabSize,
              whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: settings.wordWrap ? 'break-all' : 'normal',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
            placeholder={`Paste or write ${currentLang.name} code here...`}
          />

          {/* Quick Hover Documentation Tooltip Card (When cursor touches a keyword or function) */}
          {activeHoverDoc && (
            <div className="absolute bottom-4 right-4 z-30 max-w-sm bg-[#252526] border border-[#454545] rounded-md shadow-2xl p-3 text-xs pointer-events-none animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#333333]">
                <span className="font-mono font-bold text-[#DCDCAA]">
                  {activeHoverDoc.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e1e1e] text-[#4EC9B0] border border-[#333333]">
                  {activeHoverDoc.category}
                </span>
              </div>
              {activeHoverDoc.signature && (
                <div className="font-mono text-[11px] text-[#9CDCFE] bg-[#1e1e1e] p-1.5 rounded mb-1.5 overflow-x-auto whitespace-pre">
                  {activeHoverDoc.signature}
                </div>
              )}
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                {activeHoverDoc.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. VS Code Style Status Bar (Bottom) */}
      <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-mono select-none shrink-0 shadow-inner">
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="opacity-40">|</span>
          <span>Spaces: {settings.tabSize}</span>
          <span className="opacity-40">|</span>
          <span>UTF-8</span>
          <span className="opacity-40">|</span>
          <span>LF</span>
          {activeSymbol && (
            <>
              <span className="opacity-40">|</span>
              <span className="truncate max-w-[160px] sm:max-w-xs text-cyan-100">
                {activeSymbol.signature}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {analysis && (
            <button
              onClick={onOpenAnalyzer}
              className="hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Complexity: {analysis.totalCyclomaticComplexity}</span>
              <span>({analysis.executionEstimate.asymptoticNotation})</span>
            </button>
          )}
          <span className="opacity-40">|</span>
          <span className="font-semibold">{currentLang.name}</span>
        </div>
      </footer>
    </div>
  );
};
