import React, { useState, useMemo } from 'react';
import {
  Search,
  Replace,
  CaseSensitive,
  WholeWord,
  Regex,
  ChevronRight,
  ChevronDown,
  FileCode,
  Check
} from 'lucide-react';
import { VFSNode } from '../types/ide';

interface GlobalSearchProps {
  files: Record<string, VFSNode>;
  onSelectFileAndLine: (fileId: string, line: number) => void;
  onReplaceInFiles: (matches: { fileId: string; line: number; oldText: string; newText: string }[]) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  files,
  onSelectFileAndLine,
  onReplaceInFiles,
}) => {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [includeFiles, setIncludeFiles] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Compute search results across all files in workspace
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: {
      file: VFSNode;
      matches: { line: number; text: string; startIndex: number; length: number }[];
    }[] = [];

    const fileList = Object.values(files).filter((f) => f.type === 'file' && f.content);

    for (const file of fileList) {
      if (includeFiles.trim() && !file.name.includes(includeFiles.trim())) {
        continue;
      }

      const contentLines = (file.content || '').split('\n');
      const fileMatches: { line: number; text: string; startIndex: number; length: number }[] = [];

      contentLines.forEach((lineText, idx) => {
        let pattern: RegExp;
        try {
          if (useRegex) {
            pattern = new RegExp(query, matchCase ? 'g' : 'gi');
          } else {
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBound = matchWholeWord ? `\\b${escaped}\\b` : escaped;
            pattern = new RegExp(wordBound, matchCase ? 'g' : 'gi');
          }

          let m: RegExpExecArray | null;
          while ((m = pattern.exec(lineText)) !== null) {
            fileMatches.push({
              line: idx + 1,
              text: lineText,
              startIndex: m.index,
              length: m[0].length,
            });
            if (!pattern.global) break;
          }
        } catch (e) {
          // Invalid regex
        }
      });

      if (fileMatches.length > 0) {
        results.push({ file, matches: fileMatches });
      }
    }

    return results;
  }, [files, query, matchCase, matchWholeWord, useRegex, includeFiles]);

  const totalMatches = searchResults.reduce((acc, curr) => acc + curr.matches.length, 0);

  const toggleFileExpand = (fileId: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileId]: prev[fileId] === false ? true : false }));
  };

  const handleReplaceAll = () => {
    if (!query || searchResults.length === 0) return;
    const items: { fileId: string; line: number; oldText: string; newText: string }[] = [];

    searchResults.forEach((res) => {
      res.matches.forEach((m) => {
        items.push({
          fileId: res.file.id,
          line: m.line,
          oldText: query,
          newText: replaceQuery,
        });
      });
    });

    onReplaceInFiles(items);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-800 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
        <span>Search</span>
      </div>

      {/* Search Inputs */}
      <div className="p-3 space-y-2 border-b border-neutral-800">
        {/* Find Input with options */}
        <div className="relative flex items-center bg-neutral-950 border border-neutral-750 rounded px-2 py-1">
          <Search size={13} className="text-neutral-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search in files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white outline-none pr-16"
          />
          <div className="absolute right-1 flex items-center gap-0.5">
            <button
              onClick={() => setMatchCase(!matchCase)}
              className={`p-1 rounded text-xs ${matchCase ? 'bg-cyan-600 text-white' : 'text-neutral-500 hover:text-white'}`}
              title="Match Case"
            >
              <CaseSensitive size={12} />
            </button>
            <button
              onClick={() => setMatchWholeWord(!matchWholeWord)}
              className={`p-1 rounded text-xs ${matchWholeWord ? 'bg-cyan-600 text-white' : 'text-neutral-500 hover:text-white'}`}
              title="Match Whole Word"
            >
              <WholeWord size={12} />
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={`p-1 rounded text-xs ${useRegex ? 'bg-cyan-600 text-white' : 'text-neutral-500 hover:text-white'}`}
              title="Use Regular Expression"
            >
              <Regex size={12} />
            </button>
          </div>
        </div>

        {/* Replace Input */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center bg-neutral-950 border border-neutral-750 rounded px-2 py-1">
            <Replace size={13} className="text-neutral-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white outline-none"
            />
          </div>
          <button
            onClick={handleReplaceAll}
            disabled={totalMatches === 0}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 border border-neutral-700 rounded text-xs text-neutral-200 transition-colors shrink-0"
            title="Replace All"
          >
            Replace All
          </button>
        </div>

        {/* Files to include filter */}
        <input
          type="text"
          placeholder="Files to include (e.g. .tsx, .js)"
          value={includeFiles}
          onChange={(e) => setIncludeFiles(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-300 placeholder-neutral-600 outline-none"
        />

        {query.trim() && (
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
            <span>{totalMatches} results in {searchResults.length} files</span>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto py-1">
        {searchResults.length === 0 ? (
          <div className="p-4 text-xs text-neutral-500 text-center">
            {query.trim() ? 'No matching results' : 'Type a query to search across project'}
          </div>
        ) : (
          searchResults.map((res) => {
            const isExpanded = expandedFiles[res.file.id] !== false;
            return (
              <div key={res.file.id} className="text-xs">
                <div
                  onClick={() => toggleFileExpand(res.file.id)}
                  className="flex items-center justify-between px-3 py-1.5 bg-neutral-850/40 hover:bg-neutral-800 cursor-pointer text-neutral-200 font-medium"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    <FileCode size={14} className="text-cyan-400 shrink-0" />
                    <span className="truncate">{res.file.name}</span>
                  </div>
                  <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-neutral-400">
                    {res.matches.length}
                  </span>
                </div>

                {isExpanded && (
                  <div className="py-0.5 space-y-0.5 pl-6 pr-2 font-mono text-[11px]">
                    {res.matches.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectFileAndLine(res.file.id, m.line)}
                        className="p-1 hover:bg-neutral-800 rounded cursor-pointer flex items-baseline gap-2 text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        <span className="text-neutral-500 shrink-0 select-none">{m.line}:</span>
                        <span className="truncate text-neutral-300">
                          {m.text.trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
