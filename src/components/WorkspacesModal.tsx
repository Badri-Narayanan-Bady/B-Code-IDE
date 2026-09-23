import React, { useState } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Users,
  Copy,
  Trash2,
  Edit2,
  Check,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { WorkspaceMeta } from '../types/ide';
import { TEMPLATES } from '../services/storage';

interface WorkspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: WorkspaceMeta[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, templateKey: string, isPrivate: boolean, roomId?: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onRenameWorkspace: (id: string, newName: string) => void;
  onDuplicateWorkspace: (id: string) => void;
  onNotify?: (type: 'success' | 'info' | 'warn' | 'error', msg: string, title?: string) => void;
}

export const WorkspacesModal: React.FC<WorkspacesModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onRenameWorkspace,
  onDuplicateWorkspace,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'my-workspaces' | 'new-workspace' | 'join-room'>('my-workspaces');
  const [newWsName, setNewWsName] = useState('');
  const [newWsTemplate, setNewWsTemplate] = useState('react');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    onCreateWorkspace(newWsName.trim(), newWsTemplate, true);
    setNewWsName('');
    setActiveTab('my-workspaces');
    onNotify?.('success', `Created workspace "${newWsName}"`, 'Workspace Created');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    const cleanRoom = roomCodeInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    onCreateWorkspace(`Room: ${cleanRoom}`, 'react', false, cleanRoom);
    setRoomCodeInput('');
    setActiveTab('my-workspaces');
    onNotify?.('info', `Joined collaboration room "${cleanRoom}"`, 'Room Joined');
  };

  const startRename = (ws: WorkspaceMeta) => {
    setRenamingId(ws.id);
    setRenameValue(ws.name);
  };

  const saveRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameWorkspace(id, renameValue.trim());
      onNotify?.('info', 'Workspace renamed');
    }
    setRenamingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <FolderKanban size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Workspace Manager
                <span className="text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full">
                  {workspaces.length} Project{workspaces.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Partitioned sandbox environments for multi-user safety and zero interference.
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

        {/* Tab Bar */}
        <div className="flex border-b border-neutral-800 px-5 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('my-workspaces')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-workspaces'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers size={14} /> My Projects
          </button>
          <button
            onClick={() => setActiveTab('new-workspace')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new-workspace'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus size={14} /> New Workspace
          </button>
          <button
            onClick={() => setActiveTab('join-room')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'join-room'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users size={14} /> Join Collaboration Room
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'my-workspaces' && (
            <>
              {/* Isolation safety assurance callout */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-2.5 text-emerald-200">
                <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Multi-User Isolation Enabled:</strong> Each workspace maintains its own virtual file system, git history, and runtime state. Even if multiple users or tabs access B Code IDE at the same time, workspaces never collide.
                </div>
              </div>

              {/* Workspaces list */}
              <div className="space-y-2">
                {workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  const isRenaming = renamingId === ws.id;

                  return (
                    <div
                      key={ws.id}
                      onClick={() => !isRenaming && onSelectWorkspace(ws.id)}
                      className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800/90 border-cyan-500/60 shadow-sm'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            ws.isPrivate
                              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-700/50'
                          }`}
                        >
                          {ws.isPrivate ? 'WS' : 'ROOM'}
                        </div>

                        <div className="min-w-0 flex-1">
                          {isRenaming ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename(ws.id);
                                  if (e.key === 'Escape') setRenamingId(null);
                                }}
                                className="bg-neutral-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white outline-none w-48"
                              />
                              <button
                                onClick={() => saveRename(ws.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate text-xs">{ws.name}</span>
                              {isActive && (
                                <span className="text-[10px] font-medium bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full shrink-0">
                                  Current Active
                                </span>
                              )}
                              {!ws.isPrivate && (
                                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full shrink-0">
                                  #{ws.roomId}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="text-[11px] text-neutral-400 flex items-center gap-3 mt-1">
                            <span>Template: {TEMPLATES[ws.template]?.name || ws.template}</span>
                            <span>•</span>
                            <span>Updated: {new Date(ws.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startRename(ws)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Rename workspace"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            onDuplicateWorkspace(ws.id);
                            onNotify?.('success', `Duplicated "${ws.name}"`);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Duplicate workspace"
                        >
                          <Copy size={13} />
                        </button>
                        {workspaces.length > 1 && (
                          <button
                            onClick={() => {
                              onDeleteWorkspace(ws.id);
                              onNotify?.('info', `Deleted "${ws.name}"`);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                            title="Delete workspace"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'new-workspace' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Next Dashboard, Quick Benchmark"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Starter Template</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(TEMPLATES).map(([key, t]) => (
                    <label
                      key={key}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                        newWsTemplate === key
                          ? 'bg-neutral-800 border-cyan-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={key}
                        checked={newWsTemplate === key}
                        onChange={() => setNewWsTemplate(key)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold text-white text-xs">{t.name}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{t.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Create Isolated Workspace</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'join-room' && (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-lg p-3 text-indigo-200">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-400" /> Multi-User Collaborative Rooms
                </div>
                <div className="text-[11px] leading-relaxed mt-1 text-indigo-300">
                  Collaborative rooms synchronize edits, live cursor positions, and team chat across participants using the same room identifier. Enter an existing room ID or invent a new one to invite peers.
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Room ID or Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dev-sprint-42, pair-interview"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowRight size={15} />
                  <span>Connect to Room</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
