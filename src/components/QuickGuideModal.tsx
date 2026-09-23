import React from 'react';
import {
  X,
  Play,
  Eye,
  Shield,
  GitBranch,
  Terminal,
  Bug,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeploy?: () => void;
  onOpenWorkspaces?: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenDeploy,
  onOpenWorkspaces,
}) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Play size={18} className="text-emerald-400" />,
      title: 'Run & Live Sandbox (F5)',
      description: 'Execute React, JavaScript, and Python scripts directly in your browser with zero latency. Toggle the Live Preview pane to interact with running web applications.',
    },
    {
      icon: <Shield size={18} className="text-cyan-400" />,
      title: 'Multi-User Concurrent Safety',
      description: 'Each visitor is automatically assigned their own isolated virtual file system. Even when thousands of people visit your deployed Vercel URL, their workspaces remain strictly separate.',
    },
    {
      icon: <Sparkles size={18} className="text-teal-400" />,
      title: 'Automated Test Suite (Jest/Vitest)',
      description: 'Full BDD test engine supporting `describe`, `it`, `expect` assertions with pass/fail telemetry, execution timing, and error traces right in the IDE.',
    },
    {
      icon: <Layers size={18} className="text-amber-400" />,
      title: 'Microbenchmarks & Performance Profiler',
      description: 'Engineered for systems engineering. Benchmarks algorithms with JIT warm-up loops, ops/sec throughput, and millisecond latency bounds.',
    },
    {
      icon: <Bug size={18} className="text-rose-400" />,
      title: 'Step Debugger & AST Inspector',
      description: 'Set gutter breakpoints and inspect full Abstract Syntax Tree (AST) representations and lexical symbols of your code in real time.',
    },
    {
      icon: <Terminal size={18} className="text-sky-400" />,
      title: 'Interactive In-Browser Terminal',
      description: 'Built-in shell supporting commands like `node`, `python`, `test`, `npm`, `git`, `cat`, `ls`, `mkdir`, and `format`. Press Ctrl + ` to toggle anytime.',
    },
    {
      icon: <GitBranch size={18} className="text-violet-400" />,
      title: 'Git Version Control & Diff Viewer',
      description: 'Stage modified files, inspect side-by-side or inline diffs, commit changes, and view full commit history without leaving the browser.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 1155 1000" fill="currentColor" className="text-white">
          <path d="m577.3 0 577.4 1000H0z" />
        </svg>
      ),
      title: 'Zero-Config Vercel Deployment',
      description: '1-click download of a pre-configured Vercel package including vercel.json and Vite config. Ready for immediate deployment with global edge CDN.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Welcome to B Code IDE
                <span className="text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  Quick Guide
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                A high-performance development environment built entirely for the browser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                      {feat.icon}
                    </div>
                    <div className="font-semibold text-white text-xs leading-snug">{feat.title}</div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Banner */}
          <div className="bg-neutral-800/80 border border-neutral-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
            <div>
              <div className="font-semibold text-white text-xs">Ready to publish your work?</div>
              <div className="text-[11px] text-neutral-400">
                Generate a ready-to-deploy package or deploy directly to Vercel.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onOpenDeploy?.();
                }}
                className="px-3 py-2 bg-white text-black hover:bg-neutral-200 font-semibold rounded-lg flex items-center gap-1.5 text-xs transition-colors"
              >
                <span>Deploy to Vercel</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-neutral-400 text-[11px]">
          <span>Tip: Press <code className="text-cyan-400 font-mono">Ctrl + P</code> (or Cmd + P) to open the Command Palette.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md font-medium transition-colors"
          >
            Got it, Let's Code
          </button>
        </div>
      </div>
    </div>
  );
};
