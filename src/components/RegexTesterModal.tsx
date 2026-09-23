import React, { useState, useMemo } from 'react';
import { X, Binary, Copy, Check, Sparkles, BookOpen } from 'lucide-react';

interface RegexTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (type: 'success' | 'info' | 'warn' | 'error', msg: string) => void;
}

const REGEX_LIBRARY = [
  { name: 'Email (RFC 5322)', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', flags: 'i', sample: 'developer.pro@google.com' },
  { name: 'Semantic Versioning (SemVer)', pattern: '^v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$', flags: '', sample: 'v2.4.1-beta.3+exp.sha.5114f85' },
  { name: 'URL / HTTPS Endpoint', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'gi', sample: 'https://api.github.com/repos/facebook/react/commits?per_page=10' },
  { name: 'UUID v4', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', flags: 'i', sample: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
  { name: 'IPv4 Address', pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', flags: '', sample: '192.168.1.254' },
  { name: 'Hex Color Code', pattern: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b', flags: 'g', sample: 'Primary: #06b6d4, Dark: #0b0f19, Accent: #10b981' },
];

export const RegexTesterModal: React.FC<RegexTesterModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [pattern, setPattern] = useState('[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState(
    'Contact the engineering team at dev-lead@google.com or admin@meta.com for support. Invalid: invalid-email@.'
  );
  const [replaceString, setReplaceString] = useState('[REDACTED]');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { matches, error, replacedText } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, replacedText: testString };

    try {
      const reg = new RegExp(pattern, flags);
      const allMatches: { index: number; match: string; groups?: string[] }[] = [];

      if (flags.includes('g')) {
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = reg.exec(testString)) !== null && count < 200) {
          count++;
          allMatches.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
          if (m.index === reg.lastIndex) reg.lastIndex++;
        }
      } else {
        const m = reg.exec(testString);
        if (m) {
          allMatches.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
        }
      }

      const replaced = testString.replace(new RegExp(pattern, flags), replaceString);

      return { matches: allMatches, error: null, replacedText: replaced };
    } catch (err: any) {
      return { matches: [], error: err.message, replacedText: testString };
    }
  }, [pattern, flags, testString, replaceString]);

  const toggleFlag = (flagChar: string) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ''));
    } else {
      setFlags(flags + flagChar);
    }
  };

  const handleCopyCode = () => {
    const snippet = `const regex = new RegExp(${JSON.stringify(pattern)}, '${flags}');\nconst matches = [...str.matchAll(regex)];`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    onNotify?.('success', 'Copied TypeScript RegExp snippet to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400">
              <Binary size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Regex Visual Tester & Pattern Library
              </h2>
              <p className="text-[11px] text-neutral-400">
                Real-time regular expression analyzer with capture groups and substitution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-xs text-neutral-200 flex items-center gap-1.5 transition-colors"
              title="Copy RegExp snippet"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy JS Snippet'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
          {/* Presets Bar */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 flex items-center gap-1">
              <BookOpen size={11} />
              <span>Production Patterns</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {REGEX_LIBRARY.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setPattern(item.pattern);
                    setFlags(item.flags);
                    setTestString(item.sample);
                  }}
                  className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-cyan-500/40 rounded text-[11px] text-neutral-300 hover:text-white transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Regex Input Row */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-300">Regular Expression</label>
            <div className="flex items-center bg-neutral-950 border border-neutral-700 rounded px-2 font-mono">
              <span className="text-neutral-500 mr-1 text-sm">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="pattern..."
                className="flex-1 bg-transparent py-1.5 text-cyan-300 font-mono text-xs focus:outline-none"
              />
              <span className="text-neutral-500 mx-1 text-sm">/</span>
              {/* Flags Selector */}
              <div className="flex items-center gap-1">
                {['g', 'i', 'm', 's'].map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFlag(f)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      flags.includes(f)
                        ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {error && <div className="text-rose-400 text-[11px] font-mono mt-1">{error}</div>}
          </div>

          {/* Test String */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-300">Test String</label>
              <span className="text-[10px] text-neutral-500 font-mono">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
              </span>
            </div>
            <textarea
              rows={3}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-xs text-neutral-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Matches & Group Breakdown */}
          {matches.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-neutral-300">Captured Matches</div>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-neutral-950 rounded border border-neutral-800">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-neutral-900/80 rounded border border-neutral-800 font-mono text-[11px] flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-semibold truncate">
                        #{idx + 1}: &ldquo;{m.match}&rdquo;
                      </span>
                      <span className="text-[10px] text-neutral-500">Index: {m.index}</span>
                    </div>
                    {m.groups && m.groups.length > 0 && (
                      <div className="pl-3 border-l border-neutral-700 space-y-0.5 text-[10px] text-neutral-400">
                        {m.groups.map((g, gIdx) => (
                          <div key={gIdx}>
                            Group {gIdx + 1}: <span className="text-amber-300">&ldquo;{g}&rdquo;</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Substitution / Replacement */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-300">Replacement</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replaceString}
                onChange={(e) => setReplaceString(e.target.value)}
                placeholder="Replace with..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            {testString && (
              <div className="mt-1 p-2 bg-neutral-950 rounded border border-neutral-800 font-mono text-[11px] text-neutral-300 whitespace-pre-wrap">
                {replacedText}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
