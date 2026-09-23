import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { EditorSettings } from '../types/ide';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onChangeSettings: (settings: EditorSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
}) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onChangeSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-5 text-neutral-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Editor Settings</h3>
              <p className="text-[11px] text-neutral-400">Configure font size, indentation, and formatting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Font Size */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-neutral-300 font-medium">Font Size</label>
              <span className="font-mono text-cyan-400">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="22"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Tab Size */}
          <div>
            <label className="block text-neutral-300 mb-1.5 font-medium">Indentation (Tab Size)</label>
            <div className="grid grid-cols-2 gap-2">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting('tabSize', size)}
                  className={`py-2 rounded-lg border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                    settings.tabSize === size
                      ? 'border-cyan-500 bg-neutral-800 text-white font-semibold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span>{size} Spaces</span>
                  {settings.tabSize === size && <Check size={14} className="text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between py-2 border-t border-neutral-800">
            <div>
              <div className="font-medium text-neutral-200">Word Wrap</div>
              <div className="text-[11px] text-neutral-500">Wrap long lines horizontally</div>
            </div>
            <button
              onClick={() => updateSetting('wordWrap', !settings.wordWrap)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.wordWrap ? 'bg-cyan-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  settings.wordWrap ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Line Numbers */}
          <div className="flex items-center justify-between py-2 border-t border-neutral-800">
            <div>
              <div className="font-medium text-neutral-200">Line Numbers</div>
              <div className="text-[11px] text-neutral-500">Show line numbers in editor gutter</div>
            </div>
            <button
              onClick={() => updateSetting('lineNumbers', !settings.lineNumbers)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.lineNumbers ? 'bg-cyan-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  settings.lineNumbers ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Auto Format on Run */}
          <div className="flex items-center justify-between py-2 border-t border-neutral-800">
            <div>
              <div className="font-medium text-neutral-200">Auto-Format on Run</div>
              <div className="text-[11px] text-neutral-500">Automatically clean indentation before executing</div>
            </div>
            <button
              onClick={() => updateSetting('autoFormatOnRun', !settings.autoFormatOnRun)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.autoFormatOnRun ? 'bg-cyan-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  settings.autoFormatOnRun ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
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
