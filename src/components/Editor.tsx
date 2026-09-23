import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  ArrowDown,
  ArrowUp,
  FileCode,
  Upload,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { CodeFile, EditorSettings } from '../types/ide';
import { tokenizeLine } from '../utils/syntax';
import { LANGUAGES } from '../utils/languages';

interface EditorProps {
  file: CodeFile;
  onChangeContent: (newContent: string) => void;
  onUploadFile: (file: File) => void;
  settings: EditorSettings;
  onRun?: () => void;
  onFormat?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  file,
  onChangeContent,
  onUploadFile,
  settings,
  onRun,
  onFormat,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const currentLang = LANGUAGES[file.language] || LANGUAGES.python;
  const lines = file.content.split('\n');

  // Sync scroll
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Update cursor position
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textBefore = file.content.substring(0, textareaRef.current.selectionStart);
    const lineList = textBefore.split('\n');
    setCursorPos({
      line: lineList.length,
      col: lineList[lineList.length - 1].length + 1,
    });
  };

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full bg-neutral-950 relative overflow-hidden select-text"
      style={{ fontSize: `${settings.fontSize}px` }}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm z-50 border-2 border-dashed border-cyan-500 rounded-lg flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950/50">
            <Upload size={32} className="animate-bounce" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Drop your code file here</h3>
          <p className="text-xs text-neutral-400 mt-1">Supports Python, JavaScript, Java, C++, C, SQL</p>
        </div>
      )}

      {/* Editor Subheader & Toolbar */}
      <div className="h-9 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentLang.color }} />
          <span className="text-xs font-mono font-medium text-neutral-300">{file.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
            {currentLang.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1 rounded text-xs transition-colors ${
              showFind ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-400 hover:text-white'
            }`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search size={14} />
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs transition-colors"
            title="Copy entire code to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFind && (
        <div className="bg-neutral-900 border-b border-neutral-800 p-2 flex flex-wrap items-center gap-2 text-xs z-20 shadow-md">
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1">
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
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
              title="Previous match"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={handleNextMatch}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
              title="Next match"
            >
              <ArrowDown size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1">
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
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px]"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px]"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white ml-auto"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Textarea + Line Numbers Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-12 bg-neutral-950 border-r border-neutral-850/80 text-neutral-600 select-none overflow-hidden text-right font-mono py-3 pr-2.5 shrink-0"
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6' }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                className={`${cursorPos.line === i + 1 ? 'text-cyan-400 font-semibold' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Code Input Textarea */}
        <div className="flex-1 relative overflow-hidden h-full">
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
            className="w-full h-full p-3 font-mono bg-neutral-950 text-neutral-200 resize-none outline-none overflow-auto border-none focus:ring-0 leading-[1.6] selection:bg-cyan-900/40"
            style={{
              fontSize: `${settings.fontSize}px`,
              tabSize: settings.tabSize,
              whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
            }}
            placeholder={`Paste or write ${currentLang.name} code here, or drag & drop a ${currentLang.extension} file...`}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 bg-neutral-900 border-t border-neutral-800/80 flex items-center justify-between px-3 text-[11px] text-neutral-400 font-mono select-none shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="text-neutral-700">|</span>
          <span>{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Spaces: {settings.tabSize}</span>
          <span className="text-neutral-700">|</span>
          <span>UTF-8</span>
          <span className="text-neutral-700">|</span>
          <span className="text-cyan-400 font-medium">{currentLang.name}</span>
        </div>
      </footer>
    </div>
  );
};
