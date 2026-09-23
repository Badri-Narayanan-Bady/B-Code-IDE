import React, { useRef } from 'react';
import {
  Play,
  Upload,
  Download,
  FileCode,
  Sparkles,
  Settings,
  Keyboard,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  FilePlus,
  Terminal as TerminalIcon,
  Activity,
  GitBranch,
  Clock
} from 'lucide-react';
import { SupportedLanguage, CodeFile, CodeAnalysisResult } from '../types/ide';
import { LANGUAGES } from '../utils/languages';

interface TopBarProps {
  file: CodeFile;
  onUpdateFileName: (name: string) => void;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onUploadFile: (file: File) => void;
  onDownloadFile: () => void;
  onFormatCode: () => void;
  onResetCode: () => void;
  onNewTemplate: (lang: SupportedLanguage) => void;
  onRun: () => void;
  isRunning: boolean;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onToggleTerminal?: () => void;
  analysis?: CodeAnalysisResult;
  onOpenAnalyzer?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  file,
  onUpdateFileName,
  onSelectLanguage,
  onUploadFile,
  onDownloadFile,
  onFormatCode,
  onResetCode,
  onNewTemplate,
  onRun,
  isRunning,
  onOpenSettings,
  onOpenShortcuts,
  onToggleTerminal,
  analysis,
  onOpenAnalyzer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentLangMeta = LANGUAGES[file.language] || LANGUAGES.python;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onUploadFile(selected);
    }
    // Reset input so same file can be re-uploaded if desired
    e.target.value = '';
  };

  const lineCount = file.content.split('\n').length;
  const charCount = file.content.length;
  const fileSizeKb = (new Blob([file.content]).size / 1024).toFixed(1);

  return (
    <header className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-3 md:px-4 shrink-0 select-none z-30">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".py,.js,.java,.cpp,.cc,.cxx,.c,.h,.sql,.txt"
      />

      {/* Left: Brand + Active File Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-2 border-r border-neutral-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-900/30">
            <span className="text-sm font-mono tracking-tighter">B</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
              B Code IDE
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                Sandbox
              </span>
            </h1>
          </div>
        </div>

        {/* Active File Editor Tab & Metadata */}
        <div className="flex items-center gap-2">
          {/* File Name input / badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
            <FileCode size={14} style={{ color: currentLangMeta.color }} />
            <input
              type="text"
              value={file.name}
              onChange={(e) => onUpdateFileName(e.target.value)}
              className="bg-transparent text-xs font-mono font-medium text-neutral-200 focus:text-white outline-none w-28 md:w-36 transition-all"
              title="Click to rename active file"
            />
            {file.isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved modifications" />
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <select
              value={file.language}
              onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs rounded-md px-2.5 py-1.5 font-medium outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors"
            >
              <option value="python">Python 3.12 (.py)</option>
              <option value="javascript">JavaScript (.js)</option>
              <option value="java">Java 21 (.java)</option>
              <option value="cpp">C++20 (.cpp)</option>
              <option value="c">C17 (.c)</option>
              <option value="sql">SQL (MySQL) (.sql)</option>
            </select>
          </div>

          {/* File Statistics Badge */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-400 px-2 py-1 rounded bg-neutral-900/60 border border-neutral-850 font-mono">
            <span>{lineCount} lines</span>
            <span className="text-neutral-600">•</span>
            <span>{charCount} chars</span>
            <span className="text-neutral-600">•</span>
            <span>{fileSizeKb} KB</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Upload File Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-medium transition-all shadow-sm active:scale-95"
          title="Upload code file from your device (.py, .js, .java, .cpp, .c, .sql)"
        >
          <Upload size={14} className="text-cyan-400" />
          <span className="hidden sm:inline">Upload File</span>
        </button>

        {/* Download File Button */}
        <button
          onClick={onDownloadFile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-medium transition-all shadow-sm active:scale-95"
          title="Download edited code file"
        >
          <Download size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">Download</span>
        </button>

        {/* Format Document Button */}
        <button
          onClick={onFormatCode}
          className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-medium transition-all"
          title="Format Code (Alt + Shift + F)"
        >
          <Sparkles size={15} className="text-amber-400" />
        </button>

        {/* Starter Template Selector */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-medium transition-all"
            title="Load starter template"
          >
            <FilePlus size={14} className="text-indigo-400" />
            <span className="hidden md:inline">Templates</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-50 text-xs">
            <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              Starter Boilerplates
            </div>
            <button
              onClick={() => onNewTemplate('python')}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>Python 3</span>
              <span className="text-[10px] font-mono text-sky-400">.py</span>
            </button>
            <button
              onClick={() => onNewTemplate('javascript')}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>JavaScript</span>
              <span className="text-[10px] font-mono text-yellow-400">.js</span>
            </button>
            <button
              onClick={() => onNewTemplate('java')}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>Java 21</span>
              <span className="text-[10px] font-mono text-orange-400">.java</span>
            </button>
            <button
              onClick={() => onNewTemplate('cpp')}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>C++20</span>
              <span className="text-[10px] font-mono text-purple-400">.cpp</span>
            </button>
            <button
              onClick={() => onNewTemplate('c')}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>C17</span>
              <span className="text-[10px] font-mono text-cyan-400">.c</span>
            </button>
            <button
              onClick={() => onNewTemplate('sql')}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>MySQL</span>
              <span className="text-[10px] font-mono text-emerald-400">.sql</span>
            </button>
          </div>
        </div>

        {/* Code Static Analyzer Button */}
        {onOpenAnalyzer && (
          <button
            onClick={onOpenAnalyzer}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-cyan-500/50 text-xs font-medium text-neutral-200 transition-all shadow-sm active:scale-95 group"
            title="Static Code Analysis: McCabe Cyclomatic Complexity & Estimated Execution Time"
          >
            <Activity size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Analyze</span>
            {analysis && (
              <span className="flex items-center gap-1 pl-1 ml-0.5 border-l border-neutral-750 font-mono text-[10px]">
                <span className={`px-1 py-0.2 rounded font-bold ${
                  analysis.risk === 'low'
                    ? 'text-emerald-400 bg-emerald-950/70'
                    : analysis.risk === 'moderate'
                    ? 'text-amber-400 bg-amber-950/70'
                    : 'text-rose-400 bg-rose-950/70'
                }`}>
                  M:{analysis.totalCyclomaticComplexity}
                </span>
                <span className="hidden md:inline text-neutral-400">
                  {analysis.executionEstimate.asymptoticNotation}
                </span>
              </span>
            )}
          </button>
        )}

        {/* Run Code Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold text-xs shadow-md transition-all active:scale-95 ${
            isRunning
              ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:shadow-emerald-900/60'
          }`}
          title="Execute code (F5)"
        >
          {isRunning ? (
            <>
              <RefreshCw size={14} className="animate-spin text-emerald-300" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-white" />
              <span>Run Code</span>
              <kbd className="hidden md:inline px-1 py-0.2 bg-emerald-700/60 rounded text-[10px] font-mono">
                F5
              </kbd>
            </>
          )}
        </button>

        {/* Settings & Shortcuts */}
        <div className="flex items-center border-l border-neutral-800 pl-1.5 gap-1">
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={16} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Editor Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
