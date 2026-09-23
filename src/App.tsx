import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { EmptyState } from './components/EmptyState';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ToastContainer } from './components/Toast';
import {
  CodeFile,
  SupportedLanguage,
  ExecutionResult,
  EditorSettings,
  ToastMessage,
} from './types/ide';
import { LANGUAGES, detectLanguage, getDefaultExtension } from './utils/languages';
import { executeCode } from './utils/engine';
import { formatCode } from './utils/formatter';

const STORAGE_FILE_KEY = 'b_code_active_file_v3';
const STORAGE_SETTINGS_KEY = 'b_code_settings_v3';
const STORAGE_STDIN_KEY = 'b_code_stdin_v3';

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  theme: 'dark',
  lineNumbers: true,
  autoFormatOnRun: false,
};

export function App() {
  // 1. Settings State
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // 2. Active Uploaded / Input Code File State
  const [file, setFile] = useState<CodeFile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FILE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default starter file: Python
    const defaultMeta = LANGUAGES.python;
    return {
      name: defaultMeta.defaultFileName,
      content: defaultMeta.sampleCode,
      language: 'python',
      size: new Blob([defaultMeta.sampleCode]).size,
      lastModified: Date.now(),
      isDirty: false,
    };
  });

  // Save active file changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FILE_KEY, JSON.stringify(file));
    } catch {}
  }, [file]);

  // 3. Stdin & Execution State
  const [stdinInput, setStdinInput] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_STDIN_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STDIN_KEY, stdinInput);
    } catch {}
  }, [stdinInput]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(false);

  // 4. Modals and Toasts
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: 'success' | 'info' | 'warn' | 'error', message: string, title?: string) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, message, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 5. File Upload Handler (via file input or drag-and-drop)
  const handleUploadFile = useCallback(
    (uploadedFile: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const textContent = (e.target?.result as string) || '';
        const detectedLang = detectLanguage(uploadedFile.name);

        const newFile: CodeFile = {
          name: uploadedFile.name,
          content: textContent,
          language: detectedLang,
          size: uploadedFile.size,
          lastModified: uploadedFile.lastModified || Date.now(),
          isDirty: false,
        };

        setFile(newFile);
        setExecutionResult(null);
        addToast(
          'success',
          `Loaded "${uploadedFile.name}" (${(uploadedFile.size / 1024).toFixed(1)} KB) as ${LANGUAGES[detectedLang].name}`,
          'File Uploaded'
        );
      };

      reader.onerror = () => {
        addToast('error', `Failed to read file "${uploadedFile.name}"`, 'Upload Error');
      };

      reader.readAsText(uploadedFile);
    },
    [addToast]
  );

  // 6. Download / Save File Handler
  const handleDownloadFile = useCallback(() => {
    try {
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFile((prev) => ({ ...prev, isDirty: false }));
      addToast('success', `Saved "${file.name}" to your downloads`, 'File Downloaded');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to download file', 'Download Error');
    }
  }, [file, addToast]);

  // 7. Format Code Handler
  const handleFormatCode = useCallback(() => {
    if (!file.content.trim()) {
      addToast('info', 'File is empty');
      return;
    }
    const formatted = formatCode(file.content, file.language, settings.tabSize);
    if (formatted !== file.content) {
      setFile((prev) => ({
        ...prev,
        content: formatted,
        isDirty: true,
      }));
      addToast('success', `Cleaned code layout and indentation`, 'Code Formatted');
    } else {
      addToast('info', `${file.name} is already formatted`);
    }
  }, [file, settings.tabSize, addToast]);

  // 8. Load Starter Template Handler
  const handleNewTemplate = useCallback(
    (lang: SupportedLanguage) => {
      const meta = LANGUAGES[lang] || LANGUAGES.python;
      setFile({
        name: meta.defaultFileName,
        content: meta.sampleCode,
        language: lang,
        size: new Blob([meta.sampleCode]).size,
        lastModified: Date.now(),
        isDirty: false,
      });
      setExecutionResult(null);
      addToast('info', `Loaded ${meta.name} starter template`, 'Template Ready');
    },
    [addToast]
  );

  // 9. Update Active File Name & Language
  const handleUpdateFileName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const newLang = detectLanguage(trimmed);
    setFile((prev) => ({
      ...prev,
      name: trimmed,
      language: newLang,
      isDirty: true,
    }));
  };

  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    const meta = LANGUAGES[newLang];
    // Rename extension if needed
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const updatedName = `${baseName}${meta.extension}`;

    setFile((prev) => ({
      ...prev,
      name: updatedName,
      language: newLang,
      isDirty: true,
    }));
    addToast('info', `Switched environment to ${meta.name}`, 'Language Updated');
  };

  // 10. Execute Code Sandbox
  const handleRun = useCallback(async () => {
    if (isRunning) return;

    // Optional auto format
    let currentCode = file.content;
    if (settings.autoFormatOnRun && currentCode.trim()) {
      currentCode = formatCode(currentCode, file.language, settings.tabSize);
      setFile((prev) => ({ ...prev, content: currentCode }));
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const result = await executeCode(currentCode, file.language, stdinInput);
      setExecutionResult(result);

      if (result.success) {
        addToast('success', `Executed in ${result.executionTimeMs} ms`, `${LANGUAGES[file.language].name} Success`);
      } else {
        addToast('warn', `Exited with error (${result.executionTimeMs} ms)`, 'Execution Notice');
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stdout: [],
        stderr: [err?.message || String(err)],
        executionTimeMs: 0,
        exitCode: 1,
      });
      addToast('error', err?.message || 'Execution failed', 'Runtime Error');
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, file, settings, stdinInput, addToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F5 to Run
      if (e.key === 'F5') {
        e.preventDefault();
        handleRun();
        return;
      }
      // Ctrl / Cmd + S to Download / Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadFile();
        return;
      }
      // Alt + Shift + F to Format
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFormatCode();
        return;
      }
      // Esc to close modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleRun, handleDownloadFile, handleFormatCode]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none">
      {/* 1. Focused Top Navigation Bar */}
      <TopBar
        file={file}
        onUpdateFileName={handleUpdateFileName}
        onSelectLanguage={handleSelectLanguage}
        onUploadFile={handleUploadFile}
        onDownloadFile={handleDownloadFile}
        onFormatCode={handleFormatCode}
        onResetCode={() => handleNewTemplate(file.language)}
        onNewTemplate={handleNewTemplate}
        onRun={handleRun}
        isRunning={isRunning}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Main Workspace Body: Single-File Editor + Terminal */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          <Editor
            file={file}
            onChangeContent={(newContent) =>
              setFile((prev) => ({
                ...prev,
                content: newContent,
                size: new Blob([newContent]).size,
                lastModified: Date.now(),
                isDirty: true,
              }))
            }
            onUploadFile={handleUploadFile}
            settings={settings}
            onRun={handleRun}
            onFormat={handleFormatCode}
          />
        </div>

        {/* Integrated Terminal & Execution Panel */}
        <Terminal
          result={executionResult}
          isRunning={isRunning}
          language={file.language}
          stdinInput={stdinInput}
          onChangeStdin={setStdinInput}
          onClearOutput={() => setExecutionResult(null)}
          onRun={handleRun}
          isExpanded={isTerminalExpanded}
          onToggleExpand={() => setIsTerminalExpanded(!isTerminalExpanded)}
        />
      </main>

      {/* 3. Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* 4. Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
export default App;
