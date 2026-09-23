import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FilePlus,
  Copy,
  Upload,
  Download
} from 'lucide-react';
import { VFSNode } from '../types/ide';

interface FileTreeProps {
  nodes: Record<string, VFSNode>;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (parentId: string, name: string) => void;
  onCreateFolder: (parentId: string, name: string) => void;
  onRenameNode: (id: string, newName: string) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onImportFile?: (parentId: string, name: string, content: string) => void;
  onDownloadFile?: (node: VFSNode) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRenameNode,
  onDeleteNode,
  onDuplicateNode,
  onToggleFolder,
  onImportFile,
  onDownloadFile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [creatingIn, setCreatingIn] = useState<{ parentId: string; type: 'file' | 'folder' } | null>(null);
  const [createName, setCreateName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIcon = (node: VFSNode) => {
    if (node.type === 'folder') {
      return node.isOpen ? (
        <FolderOpen size={15} className="text-amber-400 shrink-0" />
      ) : (
        <Folder size={15} className="text-amber-400 shrink-0" />
      );
    }
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode size={15} className="text-sky-400 shrink-0" />;
      case 'js':
      case 'jsx':
        return <FileCode size={15} className="text-yellow-400 shrink-0" />;
      case 'html':
        return <FileCode size={15} className="text-orange-400 shrink-0" />;
      case 'css':
        return <FileCode size={15} className="text-indigo-400 shrink-0" />;
      case 'py':
        return <FileCode size={15} className="text-emerald-400 shrink-0" />;
      case 'json':
        return <FileJson size={15} className="text-amber-300 shrink-0" />;
      case 'md':
        return <FileText size={15} className="text-cyan-300 shrink-0" />;
      default:
        return <FileText size={15} className="text-neutral-400 shrink-0" />;
    }
  };

  const handleStartRename = (node: VFSNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(node.id);
    setEditName(node.name);
  };

  const handleFinishRename = (id: string) => {
    if (editName.trim()) {
      onRenameNode(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleFinishCreate = () => {
    if (creatingIn && createName.trim()) {
      if (creatingIn.type === 'file') {
        onCreateFile(creatingIn.parentId, createName.trim());
      } else {
        onCreateFolder(creatingIn.parentId, createName.trim());
      }
    }
    setCreatingIn(null);
    setCreateName('');
  };

  const renderNode = (nodeId: string, depth = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const isFolder = node.type === 'folder';
    const isActive = node.id === activeFileId;
    const isEditing = editingId === node.id;

    return (
      <div key={node.id} className="relative group">
        <div
          onClick={() => {
            if (isFolder) {
              onToggleFolder(node.id);
            } else {
              onSelectFile(node.id);
            }
          }}
          className={`flex items-center justify-between py-1 px-2 cursor-pointer text-xs transition-colors rounded ${
            isActive
              ? 'bg-neutral-800 text-white font-medium'
              : 'text-neutral-300 hover:bg-neutral-850 hover:text-white'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder ? (
              <span className="text-neutral-400 hover:text-neutral-200">
                {node.isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
            ) : (
              <span className="w-3.5" />
            )}
            {getIcon(node)}

            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleFinishRename(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename(node.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 border border-cyan-500 rounded px-1 text-xs text-white outline-none w-32"
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          {/* Git status indicator */}
          <div className="flex items-center gap-1">
            {node.isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1" title="Unsaved changes" />
            )}
            {node.gitStatus === 'modified' && (
              <span className="text-[10px] font-mono text-amber-400 mr-1 font-bold">M</span>
            )}
            {node.gitStatus === 'untracked' && (
              <span className="text-[10px] font-mono text-emerald-400 mr-1 font-bold">U</span>
            )}

            {/* Actions on hover */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-neutral-400">
              {isFolder && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingIn({ parentId: node.id, type: 'file' });
                    }}
                    title="New File"
                    className="p-1 hover:text-white rounded"
                  >
                    <FilePlus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingIn({ parentId: node.id, type: 'folder' });
                    }}
                    title="New Folder"
                    className="p-1 hover:text-white rounded"
                  >
                    <FolderPlus size={12} />
                  </button>
                </>
              )}
              {!isFolder && onDownloadFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadFile(node);
                  }}
                  title="Download File"
                  className="p-1 hover:text-white rounded"
                >
                  <Download size={12} />
                </button>
              )}
              {node.id !== 'root' && (
                <button
                  onClick={(e) => handleStartRename(node, e)}
                  title="Rename"
                  className="p-1 hover:text-white rounded"
                >
                  <Edit2 size={12} />
                </button>
              )}
              {node.id !== 'root' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode(node.id);
                  }}
                  title="Delete"
                  className="p-1 hover:text-red-400 rounded"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input when creating a new file/folder inside this folder */}
        {isFolder && creatingIn && creatingIn.parentId === node.id && (
          <div
            className="flex items-center gap-1.5 py-1 px-2 text-xs bg-neutral-850"
            style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
          >
            {creatingIn.type === 'file' ? <FileCode size={14} className="text-cyan-400" /> : <Folder size={14} className="text-amber-400" />}
            <input
              autoFocus
              type="text"
              placeholder={creatingIn.type === 'file' ? 'filename.ts' : 'folder-name'}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onBlur={handleFinishCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishCreate();
                if (e.key === 'Escape') {
                  setCreatingIn(null);
                  setCreateName('');
                }
              }}
              className="bg-neutral-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-36"
            />
          </div>
        )}

        {/* Render child nodes */}
        {isFolder && node.isOpen && node.children && (
          <div>
            {node.children.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNode = nodes['root'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onImportFile) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImportFile('root', file.name, content || '');
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!onImportFile) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onImportFile('root', file.name, content || '');
        };
        reader.readAsText(file);
      });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-full flex flex-col bg-neutral-900 text-neutral-300 select-none relative transition-colors ${
        isDraggingOver ? 'bg-cyan-950/30 ring-2 ring-inset ring-cyan-500/50' : ''
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
        <span>Explorer</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="Import / Upload Files"
          >
            <Upload size={13} />
          </button>
          <button
            onClick={() => setCreatingIn({ parentId: 'root', type: 'file' })}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="New File in Root"
          >
            <FilePlus size={13} />
          </button>
          <button
            onClick={() => setCreatingIn({ parentId: 'root', type: 'folder' })}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="New Folder in Root"
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      {/* Root files container */}
      <div className="flex-1 overflow-y-auto py-1">
        {rootNode ? (
          renderNode('root', 0)
        ) : (
          <div className="p-4 text-xs text-neutral-500 text-center">No workspace loaded</div>
        )}
      </div>

      {/* Friendly drop hint or Dragging Overlay */}
      {isDraggingOver ? (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20 pointer-events-none border-2 border-dashed border-cyan-400 rounded-lg m-2">
          <Upload size={24} className="text-cyan-400 mb-2 animate-bounce" />
          <span className="text-xs font-semibold text-white">Drop files to import into workspace</span>
        </div>
      ) : (
        <div className="px-3 py-1.5 border-t border-neutral-800/60 text-[10px] text-neutral-500 flex items-center justify-between">
          <span>Drop files to import</span>
          <span>UTF-8</span>
        </div>
      )}
    </div>
  );
};
