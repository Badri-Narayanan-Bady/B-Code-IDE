import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Circle,
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Code2,
  FileCode
} from 'lucide-react';
import { VFSNode, Diagnostic, Breakpoint, AutoCompleteItem, Collaborator, EditorSettings } from '../types/ide';
import { tokenizeLine, Token } from '../utils/syntax';
import { getCompletions } from '../utils/snippets';

interface EditorProps {
  files: Record<string, VFSNode>;
  openFileIds: string[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCloseFile: (id: string) => void;
  onChangeContent: (fileId: string, content: string) => void;
  diagnostics: Diagnostic[];
  breakpoints: Breakpoint[];
  onToggleBreakpoint: (fileId: string, line: number) => void;
  collaborators: Collaborator[];
  settings: EditorSettings;
  onCursorMove?: (fileId: string, line: number, col: number) => void;
}

export const Editor: React.FC<EditorProps> = ({
  files,
  openFileIds,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onChangeContent,
  diagnostics,
  breakpoints,
  onToggleBreakpoint,
  collaborators,
  settings,
  onCursorMove,
}) => {
  const activeFile = activeFileId ? files[activeFileId] : null;
  const content = activeFile?.content || '';
  const lines = useMemo(() => content.split('\n'), [content]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Cursor state
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, index: 0 });
  const [hoveredDiag, setHoveredDiag] = useState<{ diag: Diagnostic; x: number; y: number } | null>(null);

  // Find & Replace
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findMatches, setFindMatches] = useState<{ line: number; col: number; length: number }[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Autocomplete
  const [autoCompleteItems, setAutoCompleteItems] = useState<AutoCompleteItem[]>([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [autoCompletePos, setAutoCompletePos] = useState<{ top: number; left: number } | null>(null);
  const [currentWordPrefix, setCurrentWordPrefix] = useState('');

  // Synchronize scroll between textarea and syntax highlight display
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
  };

  // Update cursor position and check autocomplete on keyup/click
  const handleCursorUpdate = () => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, selStart);
    const lineArr = textBefore.split('\n');
    const currentLine = lineArr.length;
    const currentCol = lineArr[lineArr.length - 1].length + 1;

    setCursorPos({ line: currentLine, col: currentCol, index: selStart });
    if (activeFileId && onCursorMove) {
      onCursorMove(activeFileId, currentLine, currentCol);
    }

    // Check autocomplete trigger
    const match = textBefore.match(/([a-zA-Z0-9_$]+)$/);
    if (match && match[1].length >= 2) {
      const word = match[1];
      setCurrentWordPrefix(word);
      const suggestions = getCompletions(word, activeFile?.language || 'javascript');
      if (suggestions.length > 0) {
        setAutoCompleteItems(suggestions);
        setAutoCompleteIndex(0);

        // Approximate popup position
        const lineHeight = 20; // 20px per line
        const charWidth = 8.5; // JetBrains mono char width approx
        const top = Math.min((currentLine + 1) * lineHeight + 8, 400);
        const left = Math.min(60 + currentCol * charWidth, 500);
        setAutoCompletePos({ top, left });
        return;
      }
    }
    setAutoCompletePos(null);
  };

  // Keyboard shortcut handlers (Tab, Enter in autocomplete, Find)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete popup navigation
    if (autoCompletePos && autoCompleteItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutoCompleteIndex((prev) => (prev + 1) % autoCompleteItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutoCompleteIndex((prev) => (prev - 1 + autoCompleteItems.length) % autoCompleteItems.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(autoCompleteItems[autoCompleteIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setAutoCompletePos(null);
        return;
      }
    }

    // Ctrl+F / Cmd+F Find
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowFind(true);
      return;
    }

    // Handle Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!textareaRef.current || !activeFileId) return;
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const indent = '  '; // 2 spaces

      const newContent = content.substring(0, start) + indent + content.substring(end);
      onChangeContent(activeFileId, newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indent.length;
          handleCursorUpdate();
        }
      }, 0);
    }
  };

  const insertSuggestion = (item: AutoCompleteItem) => {
    if (!textareaRef.current || !activeFileId) return;
    const start = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, start);
    const prefixLen = currentWordPrefix.length;
    const cleanInsert = item.insertText.replace(/\$\d/g, '');

    const newContent =
      textBefore.substring(0, textBefore.length - prefixLen) +
      cleanInsert +
      content.substring(start);

    onChangeContent(activeFileId, newContent);
    setAutoCompletePos(null);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start - prefixLen + cleanInsert.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
        handleCursorUpdate();
      }
    }, 0);
  };

  // Search logic
  useEffect(() => {
    if (!findQuery.trim()) {
      setFindMatches([]);
      return;
    }
    const matches: { line: number; col: number; length: number }[] = [];
    const query = findQuery.toLowerCase();

    lines.forEach((line, idx) => {
      let startIndex = 0;
      const lowerLine = line.toLowerCase();
      while ((startIndex = lowerLine.indexOf(query, startIndex)) !== -1) {
        matches.push({
          line: idx + 1,
          col: startIndex + 1,
          length: findQuery.length,
        });
        startIndex += findQuery.length;
      }
    });
    setFindMatches(matches);
    setActiveMatchIndex(0);
  }, [findQuery, content]);

  const handleReplaceCurrent = () => {
    if (findMatches.length === 0 || !activeFileId) return;
    const match = findMatches[activeMatchIndex];
    let charOffset = 0;
    for (let i = 0; i < match.line - 1; i++) {
      charOffset += lines[i].length + 1;
    }
    charOffset += match.col - 1;

    const newContent =
      content.substring(0, charOffset) +
      replaceQuery +
      content.substring(charOffset + match.length);

    onChangeContent(activeFileId, newContent);
  };

  const handleReplaceAll = () => {
    if (!findQuery || !activeFileId) return;
    const newContent = content.replaceAll(findQuery, replaceQuery);
    onChangeContent(activeFileId, newContent);
  };

  // File diagnostics grouped by line
  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, Diagnostic[]>();
    for (const d of diagnostics) {
      if (!map.has(d.line)) map.set(d.line, []);
      map.get(d.line)!.push(d);
    }
    return map;
  }, [diagnostics]);

  // Breakpoints grouped by line
  const breakpointsByLine = useMemo(() => {
    const set = new Set<number>();
    for (const b of breakpoints) {
      if (b.fileId === activeFileId && b.enabled) {
        set.add(b.line);
      }
    }
    return set;
  }, [breakpoints, activeFileId]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-neutral-500">
        <Code2 size={48} className="text-neutral-700 mb-3" />
        <p className="text-sm font-medium text-neutral-400">No file open</p>
        <p className="text-xs text-neutral-600 mt-1">Select a file from the explorer or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-neutral-200 overflow-hidden relative">
      {/* 1. Editor Tabs Bar */}
      <div className="h-9 bg-neutral-900 border-b border-neutral-800 flex items-center overflow-x-auto select-none shrink-0">
        {openFileIds.map((fId) => {
          const file = files[fId];
          if (!file) return null;
          const isActive = fId === activeFileId;
          return (
            <div
              key={fId}
              onClick={() => onSelectFile(fId)}
              className={`group h-full flex items-center gap-2 px-3 border-r border-neutral-800 text-xs cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#0d1117] text-white border-t-2 border-t-cyan-500'
                  : 'text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
              }`}
            >
              <FileCode size={13} className={isActive ? 'text-cyan-400' : 'text-neutral-500'} />
              <span>{file.name}</span>
              {file.isDirty ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(fId);
                  }}
                  className="w-2 h-2 rounded-full bg-cyan-400 hover:bg-red-400 group-hover:block"
                />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(fId);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Breadcrumb bar */}
      <div className="h-6 bg-[#0d1117] border-b border-neutral-850 px-4 flex items-center justify-between text-[11px] text-neutral-400 select-none">
        <div className="flex items-center gap-1.5 font-mono">
          <span>{activeFile.path.replace(/^\//, '').replace(/\//g, ' > ')}</span>
        </div>
        <div className="flex items-center gap-3">
          {diagnostics.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400">
              <AlertTriangle size={11} />
              <span>{diagnostics.length} problems</span>
            </div>
          )}
          <button
            onClick={() => setShowFind(!showFind)}
            className="hover:text-white text-neutral-400 transition-colors p-0.5"
            title="Find & Replace (Ctrl+F)"
          >
            <Search size={13} />
          </button>
        </div>
      </div>

      {/* 3. In-File Find & Replace Bar */}
      {showFind && (
        <div className="bg-neutral-850 border-b border-neutral-800 p-2 text-xs flex flex-wrap items-center gap-2 z-20 shadow-md">
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <Search size={12} className="text-neutral-400 mr-1.5" />
            <input
              autoFocus
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-36 text-xs"
            />
            <span className="text-[10px] text-neutral-500 font-mono ml-2">
              {findMatches.length > 0 ? `${activeMatchIndex + 1}/${findMatches.length}` : '0 results'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveMatchIndex((prev) => (prev > 0 ? prev - 1 : findMatches.length - 1))}
              disabled={findMatches.length === 0}
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 disabled:opacity-30"
              title="Previous match"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => setActiveMatchIndex((prev) => (prev < findMatches.length - 1 ? prev + 1 : 0))}
              disabled={findMatches.length === 0}
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 disabled:opacity-30"
              title="Next match"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <Replace size={12} className="text-neutral-400 mr-1.5" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-36 text-xs"
            />
          </div>

          <button
            onClick={handleReplaceCurrent}
            disabled={findMatches.length === 0}
            className="px-2 py-1 bg-neutral-750 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] text-neutral-200 disabled:opacity-30"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={findMatches.length === 0}
            className="px-2 py-1 bg-neutral-750 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] text-neutral-200 disabled:opacity-30"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white ml-auto"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. Main Code Canvas (Gutter + Textarea Overlay + Highlight Layer) */}
      <div ref={editorContainerRef} className="flex-1 flex relative overflow-hidden font-mono text-[13px] leading-5">
        {/* Line Numbers & Breakpoint Gutter */}
        <div
          ref={lineNumbersRef}
          className="w-14 bg-[#0d1117] border-r border-neutral-850 py-2 select-none overflow-hidden shrink-0 flex flex-col text-right pr-2 text-neutral-500 font-mono text-xs"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasBreakpoint = breakpointsByLine.has(lineNum);
            const lineDiags = diagnosticsByLine.get(lineNum);
            const isCurrentLine = cursorPos.line === lineNum;

            return (
              <div
                key={lineNum}
                className="h-5 flex items-center justify-end gap-1.5 cursor-pointer group"
                onClick={() => onToggleBreakpoint(activeFile.id, lineNum)}
              >
                {/* Breakpoint toggle indicator */}
                <span className="w-2.5 h-2.5 flex items-center justify-center">
                  {hasBreakpoint ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-rose-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </span>

                {/* Line number or diagnostic indicator */}
                <span
                  className={`${
                    lineDiags?.some((d) => d.severity === 'error')
                      ? 'text-rose-400 font-bold'
                      : isCurrentLine
                      ? 'text-neutral-200 font-semibold'
                      : 'text-neutral-600'
                  }`}
                >
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 relative h-full overflow-auto">
          {/* Syntax Highlighted Backdrop */}
          <div className="absolute inset-0 py-2 px-3 pointer-events-none whitespace-pre select-none font-mono">
            {lines.map((lineText, lineIdx) => {
              const lineNum = lineIdx + 1;
              const isCurrent = cursorPos.line === lineNum;
              const lineDiags = diagnosticsByLine.get(lineNum);
              const tokens = tokenizeLine(lineText, activeFile.language);

              return (
                <div
                  key={lineIdx}
                  className={`h-5 flex items-center ${isCurrent ? 'active-line-bg' : ''}`}
                >
                  {tokens.map((tok, tokIdx) => {
                    const tokClass =
                      tok.type === 'keyword'
                        ? 'tok-keyword'
                        : tok.type === 'fn'
                        ? 'tok-fn'
                        : tok.type === 'string'
                        ? 'tok-string'
                        : tok.type === 'number'
                        ? 'tok-number'
                        : tok.type === 'comment'
                        ? 'tok-comment'
                        : tok.type === 'tag'
                        ? 'tok-tag'
                        : tok.type === 'type'
                        ? 'tok-type'
                        : tok.type === 'operator'
                        ? 'tok-operator'
                        : tok.type === 'boolean'
                        ? 'tok-boolean'
                        : 'text-neutral-200';

                    const hasError = lineDiags?.some((d) => d.severity === 'error');
                    const hasWarn = lineDiags?.some((d) => d.severity === 'warning');

                    return (
                      <span
                        key={tokIdx}
                        className={`${tokClass} ${
                          hasError ? 'diagnostic-error' : hasWarn ? 'diagnostic-warning' : ''
                        }`}
                      >
                        {tok.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Active Collaborator Cursors Overlay */}
          {collaborators
            .filter((c) => c.activeFileId === activeFile.id && c.cursorLine !== undefined)
            .map((c) => {
              const topPx = (c.cursorLine! - 1) * 20 + 8;
              const leftPx = (c.cursorCol || 1) * 8 + 12;
              return (
                <div
                  key={c.id}
                  className="absolute pointer-events-none flex flex-col z-10 transition-all duration-150"
                  style={{ top: `${topPx}px`, left: `${leftPx}px` }}
                >
                  <div
                    className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium text-white shadow"
                    style={{ backgroundColor: c.avatarColor }}
                  >
                    {c.name}
                  </div>
                  <div className="w-0.5 h-5" style={{ backgroundColor: c.avatarColor }} />
                </div>
              );
            })}

          {/* Transparent Input Textarea Overlay */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              onChangeContent(activeFile.id, e.target.value);
              handleCursorUpdate();
            }}
            onKeyUp={handleCursorUpdate}
            onClick={handleCursorUpdate}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full py-2 px-3 bg-transparent text-transparent caret-cyan-400 font-mono text-[13px] leading-5 resize-none outline-none overflow-auto border-none z-10 whitespace-pre"
            style={{ tabSize: settings.tabSize }}
          />
        </div>

        {/* Minimap preview bar on the right */}
        {settings.showMinimap && (
          <div className="w-16 bg-neutral-900/40 border-l border-neutral-850 hidden lg:block overflow-hidden py-2 px-1 select-none pointer-events-none shrink-0">
            <div className="scale-[0.25] origin-top-left w-[400%] opacity-40 font-mono leading-none">
              {lines.slice(0, 100).map((l, i) => (
                <div key={i} className="truncate text-cyan-300">
                  {l.trim().length > 0 ? l : ' '}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Autocomplete IntelliSense Popup */}
      {autoCompletePos && autoCompleteItems.length > 0 && (
        <div
          className="absolute z-50 w-72 bg-neutral-850 border border-neutral-700 rounded-lg shadow-2xl py-1 text-xs overflow-hidden"
          style={{ top: `${autoCompletePos.top}px`, left: `${autoCompletePos.left}px` }}
        >
          <div className="max-h-48 overflow-y-auto">
            {autoCompleteItems.map((item, idx) => {
              const isSelected = idx === autoCompleteIndex;
              return (
                <div
                  key={idx}
                  onClick={() => insertSuggestion(item)}
                  className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-600 text-white font-medium' : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-mono uppercase px-1 py-0.5 rounded ${
                        item.kind === 'snippet'
                          ? 'bg-amber-900/60 text-amber-300'
                          : item.kind === 'function'
                          ? 'bg-purple-900/60 text-purple-300'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {item.kind}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.detail && (
                    <span className="text-[10px] opacity-60 truncate ml-2 font-mono">{item.detail}</span>
                  )}
                </div>
              );
            })}
          </div>
          {autoCompleteItems[autoCompleteIndex]?.documentation && (
            <div className="border-t border-neutral-750 px-3 py-1.5 bg-neutral-900/80 text-[11px] text-neutral-400">
              {autoCompleteItems[autoCompleteIndex].documentation}
            </div>
          )}
        </div>
      )}

      {/* 6. Footer Status Bar */}
      <footer className="h-6 bg-neutral-900 border-t border-neutral-800 px-4 flex items-center justify-between text-[11px] text-neutral-400 select-none shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-mono">
            <span>Ln {cursorPos.line}</span>, <span>Col {cursorPos.col}</span>
          </span>
          <span>Spaces: {settings.tabSize}</span>
          <span>UTF-8</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300">
            {activeFile.language || 'plaintext'}
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Check size={12} /> Ready
          </span>
        </div>
      </footer>
    </div>
  );
};
