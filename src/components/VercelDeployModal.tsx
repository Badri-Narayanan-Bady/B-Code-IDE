import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Globe
} from 'lucide-react';
import { VFSNode } from '../types/ide';
import { createVercelDeployZip } from '../services/storage';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  vfs: Record<string, VFSNode>;
  projectName?: string;
  onNotify?: (type: 'success' | 'info' | 'warn' | 'error', msg: string, title?: string) => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
  vfs,
  projectName = 'My B Code Project',
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'ide'>('project');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    onNotify?.('info', 'Command copied to clipboard');
  };

  const handleDownloadVercelPackage = async () => {
    setIsExporting(true);
    try {
      const blob = await createVercelDeployZip(vfs, projectName.toLowerCase().replace(/\s+/g, '-'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-vercel.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify?.('success', 'Vercel-ready ZIP bundle downloaded successfully!', 'Export Ready');
    } catch (e) {
      console.error('Export failed:', e);
      onNotify?.('error', 'Failed to generate deployment package', 'Export Error');
    } finally {
      setIsExporting(false);
    }
  };

  const vercelCliCommand = `npm install\nnpx vercel`;
  const vercelJsonSnippet = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black border border-neutral-700 flex items-center justify-center text-white font-bold">
              {/* Vercel Triangle */}
              <svg width="18" height="18" viewBox="0 0 1155 1000" fill="currentColor">
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Deploy to Vercel
                <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Zero-Config Ready
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Deploy projects or host B Code IDE with global edge CDN and custom domains.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-5 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('project')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'project'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers size={14} /> Deploy Current Project
          </button>
          <button
            onClick={() => setActiveTab('ide')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'ide'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe size={14} /> Deploy B Code IDE App
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'project' ? (
            <>
              {/* Fast track banner */}
              <div className="bg-gradient-to-r from-neutral-800 to-neutral-850 border border-neutral-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-white text-sm">Download Ready-to-Deploy Bundle</div>
                  <div className="text-neutral-400 text-xs mt-1">
                    Auto-configured with <code className="text-cyan-400">vercel.json</code>, build scripts, and static entry points.
                  </div>
                </div>
                <button
                  onClick={handleDownloadVercelPackage}
                  disabled={isExporting}
                  className="px-4 py-2.5 bg-white text-black hover:bg-neutral-200 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Download size={14} />
                  <span>{isExporting ? 'Packaging...' : 'Download Vercel ZIP'}</span>
                </button>
              </div>

              {/* Step by Step options */}
              <div className="space-y-4">
                <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Terminal size={14} className="text-cyan-400" /> Option 1: Deploy with Vercel CLI (30 seconds)
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 relative font-mono text-[11px] text-neutral-300">
                  <pre className="overflow-x-auto">{vercelCliCommand}</pre>
                  <button
                    onClick={() => handleCopy(vercelCliCommand, 'cli')}
                    className="absolute top-2.5 right-2.5 p-1 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-750 rounded transition-colors"
                    title="Copy command"
                  >
                    {copiedCode === 'cli' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="font-semibold text-neutral-200 flex items-center gap-1.5 pt-2">
                  <Globe size={14} className="text-indigo-400" /> Option 2: Deploy via Vercel Web Dashboard & Git
                </div>

                <ol className="list-decimal list-inside space-y-2 text-neutral-300 leading-relaxed pl-1">
                  <li>Download the Vercel ZIP bundle above and push it to a new GitHub repository.</li>
                  <li>
                    Visit{' '}
                    <a
                      href="https://vercel.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                    >
                      vercel.com/new <ExternalLink size={11} />
                    </a>{' '}
                    and select your repository.
                  </li>
                  <li>
                    Framework Preset will auto-detect as <span className="font-semibold text-white">Vite</span>.
                  </li>
                  <li>Click <span className="font-semibold text-white">Deploy</span>. Your site will be live instantly!</li>
                </ol>

                {/* vercel.json preview */}
                <div className="pt-2">
                  <div className="text-neutral-400 mb-1.5 flex items-center justify-between text-[11px]">
                    <span>Included vercel.json:</span>
                    <button
                      onClick={() => handleCopy(vercelJsonSnippet, 'json')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedCode === 'json' ? <Check size={12} /> : <Copy size={12} />} Copy JSON
                    </button>
                  </div>
                  <pre className="bg-neutral-950 border border-neutral-850 rounded-lg p-3 font-mono text-[11px] text-neutral-400 overflow-x-auto">
                    {vercelJsonSnippet}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Deploying IDE section */}
              <div className="space-y-4">
                <div className="bg-neutral-800/80 border border-neutral-700/70 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    B Code IDE is 100% Vercel & Multi-User Ready
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    This entire repository has been configured with <code className="text-white bg-neutral-900 px-1 py-0.5 rounded">vercel.json</code>, optimized single-page rewrites, and client-isolated storage.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Vercel Deployment Settings</h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="text-neutral-400 font-medium">Framework Preset</div>
                      <div className="text-white font-mono font-semibold mt-1">Vite</div>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="text-neutral-400 font-medium">Root Directory</div>
                      <div className="text-white font-mono font-semibold mt-1">./</div>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="text-neutral-400 font-medium">Build Command</div>
                      <div className="text-emerald-400 font-mono font-semibold mt-1">npm run build</div>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="text-neutral-400 font-medium">Output Directory</div>
                      <div className="text-cyan-400 font-mono font-semibold mt-1">dist</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-semibold text-white">Multi-User Safety Assurance</h3>
                  <div className="space-y-1.5 text-neutral-300">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span><strong>Isolated Sandbox:</strong> Every visitor gets their own scoped local environment.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span><strong>Independent Workspaces:</strong> Users can create multiple separate projects without conflict.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span><strong>Dedicated Rooms:</strong> Collaborative sessions use isolated room channels so peers only sync with intended invitees.</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Import & Deploy on Vercel Now</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-neutral-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            Designed for seamless high-performance static hosting on Vercel Edge.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
