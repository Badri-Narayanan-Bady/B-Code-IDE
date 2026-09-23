import React, { useState } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  Circle,
  Radio,
  UserCheck
} from 'lucide-react';
import { Collaborator, ChatMessage } from '../types/ide';

interface CollaborationPanelProps {
  collaborators: Collaborator[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onToggleSimulatedPeer: () => void;
  isSimulating: boolean;
  onOpenShareModal: () => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  collaborators,
  messages,
  onSendMessage,
  onToggleSimulatedPeer,
  isSimulating,
  onOpenShareModal,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none text-xs">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Live Collaboration
        </div>
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-[11px] transition-colors"
        >
          <Share2 size={12} />
          <span>Invite</span>
        </button>
      </div>

      {/* Collaborators List */}
      <div className="p-3 border-b border-neutral-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
          <span>ACTIVE PEERS ({collaborators.length})</span>
          <button
            onClick={onToggleSimulatedPeer}
            className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              isSimulating
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
            }`}
            title="Toggle simulated co-workers"
          >
            <Radio size={10} className={isSimulating ? 'animate-pulse text-emerald-400' : ''} />
            <span>{isSimulating ? 'Sim Co-worker: ON' : 'Sim Co-worker'}</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-2 bg-neutral-950 border border-neutral-800 rounded"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shadow shrink-0"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.name.slice(0, 2)}
                </div>
                <div className="truncate">
                  <div className="font-medium text-neutral-200 truncate">{c.name}</div>
                  <div className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{c.cursorLine ? `Line ${c.cursorLine}` : 'idle'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Chat Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 flex items-center gap-1 border-b border-neutral-800">
          <MessageSquare size={12} />
          <span>TEAM CHAT</span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 py-6">
              Workspace chat is ready. Send a message or code review request to teammates.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold" style={{ color: m.senderColor }}>
                    {m.sender}
                  </span>
                  <span className="text-neutral-500 font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-200 leading-relaxed text-xs">
                  {m.text}
                </div>
                {m.codeSnippet && (
                  <div className="mt-1 p-2 bg-neutral-900 border border-neutral-750 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto">
                    <div className="text-[9px] text-neutral-500 mb-1">
                      {m.codeSnippet.file}:{m.codeSnippet.line}
                    </div>
                    <code>{m.codeSnippet.code}</code>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-2 border-t border-neutral-800 flex gap-1.5">
          <input
            type="text"
            placeholder="Type a team message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-750 rounded px-2.5 py-1 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded transition-colors"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
