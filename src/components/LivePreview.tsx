import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  X,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { VFSNode } from '../types/ide';
import { buildPreviewHTML } from '../utils/runner';

interface LivePreviewProps {
  files: Record<string, VFSNode>;
  onClose: () => void;
  onReceiveLog?: (type: 'log' | 'warn' | 'error' | 'info', message: string) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ files, onClose, onReceiveLog }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [urlCopied, setUrlCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for console logs emitted from the preview iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'B_CODE_PREVIEW_LOG') {
        onReceiveLog?.(e.data.level, e.data.message);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReceiveLog]);

  const previewHtml = buildPreviewHTML(files);

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('http://localhost:3000');
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 border-l border-neutral-800 select-none overflow-hidden">
      {/* Top Address & Controls Bar */}
      <div className="h-10 bg-neutral-850 border-b border-neutral-800 px-3 flex items-center justify-between gap-2 shrink-0">
        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-750">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1 rounded transition-colors ${
              device === 'desktop' ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-400 hover:text-white'
            }`}
            title="Desktop view"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1 rounded transition-colors ${
              device === 'tablet' ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-400 hover:text-white'
            }`}
            title="Tablet view (768px)"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1 rounded transition-colors ${
              device === 'mobile' ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-400 hover:text-white'
            }`}
            title="Mobile view (375px)"
          >
            <Smartphone size={14} />
          </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-sm flex items-center bg-neutral-900 border border-neutral-750 rounded px-2.5 py-1 text-xs text-neutral-300">
          <Globe size={13} className="text-emerald-400 mr-2 shrink-0" />
          <span className="font-mono truncate">http://localhost:3000/</span>
          <button
            onClick={handleCopyUrl}
            className="ml-auto text-neutral-400 hover:text-white p-0.5"
            title="Copy URL"
          >
            {urlCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>

        {/* Refresh & Close Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            title="Reload Preview"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            title="Close Preview"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-neutral-950 flex items-center justify-center p-2 overflow-auto">
        <div
          className="h-full bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-200 relative"
          style={{ width: getContainerWidth() }}
        >
          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={previewHtml}
            title="B Code Sandbox"
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
