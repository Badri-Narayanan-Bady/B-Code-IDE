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
} from 'lucide-react';
import { CodeFile, EditorSettings, CodeAnalysisResult } from '../types/ide';
import {
  tokenizeLine,
  TOKEN_COLOR_MAP,
  extractCodeSymbols,
  getActiveSymbolForLine,
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

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find & Replace
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findMatches, setFindMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const currentLang = LANGUAGES[file.language] || LANGUAGES.python;
  const lines = useMemo(() => file.content.split('\n'), [file.content]);

  // Tokenize lines for high-fidelity syntax highlighting
  const tokenizedLines = useMemo(() => {
    return lines.map((line) => tokenizeLine(line, file.language));
  }, [lines, file.language]);

  // Extract functions / symbols for breadcrumb display
  const symbols = useMemo(() => {
    return extractCodeSymbols(file.content, file.language);
  }, [file.content, file.language]);

  const activeSymbol = useMemo(() => {
    return getActiveSymbolForLine(symbols, cursorPos.line);
  }, [symbols, cursorPos.line]);

  // Sync scroll between textarea and syntax highlight pre layer
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textBeforeCursor = textareaRef.current.value.substring(
      0,
      textareaRef.current.selectionStart
    );
    const lineNum = textBeforeCursor.split('\n').length;
    const lastLineStart = textBeforeCursor.lastIndexOf('\n');
    const colNum =
      lastLineStart === -1
        ? textBeforeCursor.length + 1
        : textBeforeCursor.length - lastLineStart;
    setCursorPos({ line: lineNum, col: colNum });
  };

  // Keyboard Shortcuts: Tab handling, Auto-indentation, Find (Ctrl+F)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl / Cmd + F => Find
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowFind(true);
      return;
    }

    // Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const spaces = ' '.repeat(settings.tabSize);

      const newContent =
        file.content.substring(0, start) + spaces + file.content.substring(end);
      onChangeContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
            start + spaces.length;
          updateCursorPosition();
        }
      }, 0);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const textBefore = file.content.substring(0, start);
      const currentLine = textBefore.split('\n').pop() || '';
      const indentMatch = currentLine.match(/^(\s+)/);
      let indent = indentMatch ? indentMatch[1] : '';

      if (
        currentLine.trim().endsWith(':') ||
        currentLine.trim().endsWith('{')
      ) {
        indent += ' '.repeat(settings.tabSize);
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newContent =
          file.content.substring(0, start) +
          '\n' +
          indent +
          file.content.substring(start);
        onChangeContent(newContent);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
              start + 1 + indent.length;
            updateCursorPosition();
          }
        }, 0);
      }
    }
  };

  // Find & Replace matches
  useEffect(() => {
    if (!findQuery) {
      setFindMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    const matches: number[] = [];
    let pos = file.content.indexOf(findQuery);
    while (pos !== -1) {
      matches.push(pos);
      pos = file.content.indexOf(findQuery, pos + 1);
    }
    setFindMatches(matches);
    setCurrentMatchIndex(0);
  }, [findQuery, file.content]);

  const handleNextMatch = () => {
    if (findMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % findMatches.length;
    setCurrentMatchIndex(nextIdx);
    selectMatch(findMatches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (findMatches.length === 0) return;
    const prevIdx =
      (currentMatchIndex - 1 + findMatches.length) % findMatches.length;
    setCurrentMatchIndex(prevIdx);
    selectMatch(findMatches[prevIdx]);
  };

  const selectMatch = (startPos: number) => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(
      startPos,
      startPos + findQuery.length
    );
    updateCursorPosition();
  };

  const handleReplaceOne = () => {
    if (findMatches.length === 0) return;
    const start = findMatches[currentMatchIndex];
    const newContent =
      file.content.substring(0, start) +
      replaceQuery +
      file.content.substring(start + findQuery.length);
    onChangeContent(newContent);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const newContent = file.content.replaceAll(findQuery, replaceQuery);
    onChangeContent(newContent);
  };

  // Drag and drop code files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onUploadFile(droppedFile);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden relative select-text"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. Drag & Drop File Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-neutral-900/95 z-50 border-2 border-dashed border-cyan-500 rounded-lg flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm animate-in fade-in">
          <Upload size={36} className="text-cyan-400 mb-2 animate-bounce" />
          <h3 className="text-base font-semibold text-white">
            Drop code file to open
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Supports .py, .js, .java, .cpp, .c, .sql
          </p>
        </div>
      )}

      {/* 2. Breadcrumb Navigation Bar */}
      <div className="h-8 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between px-3 shrink-0 select-none text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <span className="flex items-center gap-1.5 font-mono text-neutral-200">
            <FileCode size={13} style={{ color: currentLang.color }} />
            <span>{file.name}</span>
          </span>

          {activeSymbol && (
            <>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400 font-mono text-[11px] truncate max-w-xs">
                {activeSymbol.signature}
              </span>
            </>
          )}
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1 rounded text-xs transition-colors ${
              showFind
                ? 'bg-neutral-800 text-cyan-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search size={13} />
          </button>
          <button
            onClick={handleCopyCode}
            className="p-1 rounded text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* 3. Minimalist Find & Replace Panel */}
      {showFind && (
        <div className="bg-[#252526] border-b border-[#333333] px-3 py-1.5 flex flex-wrap items-center gap-2 z-20 text-xs shadow-md">
          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5">
            <Search size={12} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-28 sm:w-36 font-mono text-xs"
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
              className="p-1 hover:bg-[#333] text-neutral-300 rounded"
              title="Previous match"
            >
              <ArrowUp size={12} />
            </button>
            <button
              onClick={handleNextMatch}
              className="p-1 hover:bg-[#333] text-neutral-300 rounded"
              title="Next match"
            >
              <ArrowDown size={12} />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5">
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-28 sm:w-36 font-mono text-xs"
            />
          </div>

          <button
            onClick={handleReplaceOne}
            className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-neutral-200 rounded text-[11px]"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-neutral-200 rounded text-[11px]"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 hover:bg-[#333] text-neutral-400 hover:text-white rounded ml-auto"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 4. Main Code Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Column */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-12 bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 text-right pr-3 select-none overflow-hidden font-mono text-neutral-600 text-xs shrink-0 leading-[1.6]"
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === cursorPos.line;
              return (
                <div
                  key={idx}
                  className={`${
                    isCurrent ? 'text-neutral-300 font-semibold' : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        {/* Dual-Layer Code Area */}
        <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
          {/* Syntax Highlighted Render Layer (Behind) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full p-3 m-0 font-mono pointer-events-none overflow-hidden leading-[1.6] select-none"
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
              const isCurrent = lineIdx + 1 === cursorPos.line;
              return (
                <div
                  key={lineIdx}
                  className={`relative ${
                    isCurrent ? 'bg-[#282828]/60 -mx-3 px-3' : ''
                  }`}
                >
                  {lineTokens.length === 0 ? (
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
            placeholder={`# code here`}
          />
        </div>
      </div>

      {/* 5. Minimalist Status Bar */}
      <footer className="h-5 bg-[#181818] border-t border-[#2d2d2d] text-neutral-400 flex items-center justify-between px-3 text-[11px] font-mono select-none shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="opacity-40">|</span>
          <span>Tab: {settings.tabSize}</span>
          <span className="opacity-40">|</span>
          <span>UTF-8</span>
        </div>

        <div className="flex items-center gap-3">
          {analysis && (
            <button
              onClick={onOpenAnalyzer}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>Complexity: {analysis.totalCyclomaticComplexity}</span>
              <span className="opacity-60">({analysis.executionEstimate.asymptoticNotation})</span>
            </button>
          )}
          <span className="opacity-40">|</span>
          <span className="text-neutral-300 font-medium">{currentLang.name}</span>
        </div>
      </footer>
    </div>
  );
};
