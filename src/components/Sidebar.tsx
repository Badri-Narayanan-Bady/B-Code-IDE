import React from 'react';
import {
  Files,
  Search,
  GitBranch,
  Bug,
  Users,
  Settings,
  ListTree,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { ActiveSidePanel } from '../types/ide';

interface SidebarProps {
  activePanel: ActiveSidePanel | null;
  onSelectPanel: (panel: ActiveSidePanel) => void;
  uncommittedChangesCount: number;
  problemsCount: number;
  collaboratorsCount: number;
  failedTestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePanel,
  onSelectPanel,
  uncommittedChangesCount,
  problemsCount,
  collaboratorsCount,
  failedTestsCount = 0,
}) => {
  const topButtons: { id: ActiveSidePanel; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: <Files size={18} /> },
    { id: 'outline', label: 'Symbol Outline & AST', icon: <ListTree size={18} /> },
    { id: 'search', label: 'Search in Workspace (Ctrl+Shift+F)', icon: <Search size={18} /> },
    {
      id: 'tests',
      label: 'Test Suite Runner (Jest/Vitest)',
      icon: <ShieldCheck size={18} />,
      badge: failedTestsCount > 0 ? failedTestsCount : undefined,
      badgeColor: 'bg-rose-600',
    },
    { id: 'benchmarks', label: 'Performance Profiler & Benchmarks', icon: <Gauge size={18} /> },
    {
      id: 'git',
      label: 'Source Control',
      icon: <GitBranch size={18} />,
      badge: uncommittedChangesCount > 0 ? uncommittedChangesCount : undefined,
    },
    {
      id: 'debug',
      label: 'Run & Debug',
      icon: <Bug size={18} />,
      badge: problemsCount > 0 ? problemsCount : undefined,
    },
    {
      id: 'collab',
      label: 'Live Collaboration',
      icon: <Users size={18} />,
      badge: collaboratorsCount > 1 ? collaboratorsCount : undefined,
    },
  ];

  return (
    <aside className="w-12 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between items-center py-2 shrink-0 select-none z-20">
      <div className="flex flex-col items-center gap-1 w-full">
        {topButtons.map((btn) => {
          const isActive = activePanel === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => onSelectPanel(btn.id)}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? 'text-white bg-neutral-800 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500 before:rounded-r'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
              title={btn.label}
            >
              {btn.icon}
              {btn.badge !== undefined && (
                <span className={`absolute top-1 right-1 px-1 min-w-4 h-4 ${btn.badgeColor || 'bg-cyan-600'} text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono`}>
                  {btn.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1 w-full">
        <button
          onClick={() => onSelectPanel('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            activePanel === 'settings'
              ? 'text-white bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
};
