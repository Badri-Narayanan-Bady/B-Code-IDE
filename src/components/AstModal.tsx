import React, { useState } from 'react';
import { X, Network, Copy, Check, ChevronRight, ChevronDown, Code2 } from 'lucide-react';
import { ASTNode } from '../types/ide';

interface AstModalProps {
  isOpen: boolean;
  onClose: () => void;
  ast: ASTNode;
  fileName?: string;
  onSelectLine?: (line: number) => void;
}

export const AstModal: React.FC<AstModalProps> = ({
  isOpen,
  onClose,
  ast,
  fileName = 'Source Code',
  onSelectLine,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
  });

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(ast, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderNode = (node: ASTNode, path: string = 'root', depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[path] ?? (depth < 2);

    const getNodeColor = (type: string) => {
      switch (type) {
        case 'Program':
          return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
        case 'ClassDeclaration':
          return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        case 'FunctionDeclaration':
          return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        case 'MethodDefinition':
          return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        case 'TSInterfaceDeclaration':
          return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
        case 'ImportDeclaration':
          return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
        default:
          return 'text-neutral-400 bg-neutral-800 border-neutral-700';
      }
    };

    return (
      <div key={path} className="font-mono text-xs select-none">
        <div
          onClick={() => {
            if (hasChildren) toggleExpand(path);
            if (node.line && onSelectLine) onSelectLine(node.line);
          }}
          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-neutral-800/80 cursor-pointer transition-colors"
        >
          {hasChildren ? (
            <span className="text-neutral-500">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getNodeColor(
              node.type
            )}`}
          >
            {node.type}
          </span>

          {node.name && (
            <span className="text-white font-medium">{node.name}</span>
          )}

          {node.raw && (
            <span className="text-neutral-500 text-[11px] truncate max-w-sm">
              {node.raw}
            </span>
          )}

          {node.line && (
            <span className="ml-auto text-[10px] text-neutral-600 font-sans">
              Line {node.line}:{node.col}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="pl-5 border-l border-neutral-800/80 ml-3.5 space-y-0.5">
            {node.children!.map((child, idx) =>
              renderNode(child, `${path}-${idx}`, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400">
              <Network size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                Abstract Syntax Tree (AST) Inspector
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 rounded">
                  Compiler View
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Visualizing lexical tokens and parsed syntax nodes for <code className="text-neutral-300">{fileName}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-xs text-neutral-200 flex items-center gap-1.5 transition-colors"
              title="Copy parsed AST JSON"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tree Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19] space-y-1">
          {renderNode(ast)}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span className="text-[11px]">
            Click any node to navigate to its line number in the source editor.
          </span>
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
