import React from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';
import { EditorSettings, ThemeType } from '../types/ide';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onChangeSettings: (settings: EditorSettings) => void;
  onResetWorkspace: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  onResetWorkspace,
}) => {
  if (!isOpen) return null;

  const themes: { id: ThemeType; name: string; bg: string }[] = [
    { id: 'dark-plus', name: 'Dark+ (VS Code)', bg: '#0d1117' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36' },
    { id: 'one-dark', name: 'One Dark Pro', bg: '#21252b' },
    { id: 'monokai', name: 'Monokai', bg: '#272822' },
    { id: 'tokyo-night', name: 'Tokyo Night', bg: '#1a1b26' },
    { id: 'github-light', name: 'GitHub Light', bg: '#ffffff' },
  ];

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onChangeSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-5 text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">IDE Preferences & Settings</h3>
              <p className="text-[11px] text-neutral-400">Configure editor typography, theme, and behavior</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Theme Selection */}
          <div>
            <label className="block text-neutral-400 mb-2 font-medium">Color Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSetting('theme', t.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    settings.theme === t.id
                      ? 'border-cyan-500 bg-neutral-800 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" style={{ backgroundColor: t.bg }} />
                    <span className="font-medium text-xs">{t.name}</span>
                  </div>
                  {settings.theme === t.id && <Check size={14} className="text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font & Tab Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1.5 font-medium">Font Size ({settings.fontSize}px)</label>
              <input
                type="range"
                min="11"
                max="20"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1.5 font-medium">Tab Size</label>
              <div className="flex gap-2">
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSetting('tabSize', size)}
                    className={`flex-1 py-1.5 rounded border text-xs font-mono transition-colors ${
                      settings.tabSize === size
                        ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {size} Spaces
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-Save */}
          <div>
            <label className="block text-neutral-400 mb-1.5 font-medium">Auto Save</label>
            <div className="flex gap-2">
              {(['off', '1s', '5s', '10s'] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => updateSetting('autoSave', interval)}
                  className={`flex-1 py-1.5 rounded border text-xs capitalize transition-colors ${
                    settings.autoSave === interval
                      ? 'bg-cyan-600 border-cyan-500 text-white font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {interval === 'off' ? 'Off' : `Every ${interval}`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="flex items-center justify-between cursor-pointer p-2 bg-neutral-950 rounded border border-neutral-800">
              <span className="text-neutral-300">Show Minimap</span>
              <input
                type="checkbox"
                checked={settings.showMinimap}
                onChange={(e) => updateSetting('showMinimap', e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 bg-neutral-950 rounded border border-neutral-800">
              <span className="text-neutral-300">Format on Save</span>
              <input
                type="checkbox"
                checked={settings.formatOnSave}
                onChange={(e) => updateSetting('formatOnSave', e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500"
              />
            </label>
          </div>

          {/* Reset Workspace Danger Zone */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-neutral-300 font-semibold">Reset Workspace</div>
              <div className="text-[11px] text-neutral-500">Restore default starter files</div>
            </div>
            <button
              onClick={() => {
                if (confirm('Reset all files in workspace to the template default? Any unsaved edits will be cleared.')) {
                  onResetWorkspace();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-rose-900/60 border border-neutral-700 hover:border-rose-700 rounded text-rose-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
