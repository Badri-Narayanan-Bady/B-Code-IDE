import React, { useRef } from 'react';
import {
  Upload,
  FileCode,
  Sparkles,
  Terminal,
  Database,
  Code2
} from 'lucide-react';
import { SupportedLanguage } from '../types/ide';
import { LANGUAGES } from '../utils/languages';

interface EmptyStateProps {
  onUploadFile: (file: File) => void;
  onSelectLanguageTemplate: (lang: SupportedLanguage) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadFile,
  onSelectLanguageTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-neutral-950 overflow-y-auto select-none"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onUploadFile(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
        accept=".py,.js,.java,.cpp,.cc,.cxx,.c,.h,.sql,.txt"
      />

      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-900/30 font-bold text-2xl font-mono">
          B
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            B Code IDE
          </h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-lg">
            A fast, focused browser IDE for single-file development. Upload your code file or pick a starter template to compile, execute, and debug instantly.
          </p>
        </div>

        {/* Big Drag & Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-neutral-750 hover:border-cyan-500/80 bg-neutral-900/60 hover:bg-neutral-900 rounded-xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center group shadow-lg"
        >
          <div className="w-14 h-14 rounded-full bg-neutral-800 border border-neutral-700 group-hover:border-cyan-500/50 group-hover:bg-cyan-950/40 flex items-center justify-center text-neutral-400 group-hover:text-cyan-400 mb-3 transition-colors">
            <Upload size={24} className="group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <span className="text-sm font-semibold text-neutral-200 group-hover:text-white">
            Upload Code File from Device
          </span>
          <span className="text-xs text-neutral-500 mt-1">
            Drag & drop here, or click to browse (.py, .js, .java, .cpp, .c, .sql)
          </span>
        </div>

        {/* Quick Language Starters */}
        <div className="w-full text-left pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 text-center">
            Or select a language template
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((langKey) => {
              const meta = LANGUAGES[langKey];
              return (
                <button
                  key={langKey}
                  onClick={() => onSelectLanguageTemplate(langKey)}
                  className="p-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left transition-all group flex flex-col justify-between h-20 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-white">
                      {meta.name}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{meta.defaultFileName}</span>
                    <span className="text-neutral-500 group-hover:text-cyan-400 transition-colors">
                      Open →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
