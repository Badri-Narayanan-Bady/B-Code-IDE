import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CodeAnalyzerModal } from './components/CodeAnalyzerModal';
import { ToastContainer } from './components/Toast';
import {
  CodeFile,
  SupportedLanguage,
  ExecutionResult,
  EditorSettings,
  ToastMessage,
} from './types/ide';
import { LANGUAGES, detectLanguage, getDefaultExtension, getDefaultComment } from './utils/languages';
import { executeCode } from './utils/engine';
import { formatCode } from './utils/formatter';
import { analyzeCode } from './utils/analyzer';

// Clear legacy persistent code from localStorage so user never has stale code from previous closures
try {
  localStorage.removeItem('b_code_active_file');
  localStorage.removeItem('b_code_active_file_v2');
  localStorage.removeItem('b_code_active_file_v3');
  localStorage.removeItem('b_code_stdin');
  localStorage.removeItem('b_code_stdin_v3');
} catch {}

const STORAGE_SETTINGS_KEY = 'b_code_settings_v3';
const SESSION_FILE_KEY = 'b_code_session_file_v4';
const SESSION_STDIN_KEY = 'b_code_session_stdin_v4';

export const createFreshFile = (lang: SupportedLanguage = 'python'): CodeFile => {
  const meta = LANGUAGES[lang] || LANGUAGES.python;
  const initialContent = getDefaultComment(lang);
  return {
    name: meta.defaultFileName,
    content: initialContent,
    language: lang,
    size: new Blob([initialContent]).size,
    lastModified: Date.now(),
    isDirty: false,
  };
};

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  theme: 'dark',
  lineNumbers: true,
  autoFormatOnRun: false,
};

export function App() {
  // 1. Settings State (Persists user preferences like font size, tab size)
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
  // Kept empty by default with "# code here" comment when landing on main page.
  // Maintained in sessionStorage only for the open tab/window (discarded once tab/page is closed).
  const [file, setFile] = useState<CodeFile>(() => {
    try {
      const sessionSaved = sessionStorage.getItem(SESSION_FILE_KEY);
      if (sessionSaved) {
        return JSON.parse(sessionSaved);
      }
    } catch {}
    return createFreshFile('python');
  });

  // Keep in sessionStorage during the open session
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_FILE_KEY, JSON.stringify(file));
    } catch {}
  }, [file]);

  // 3. Stdin & Execution State (Scoped to current session)
  const [stdinInput, setStdinInput] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_STDIN_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STDIN_KEY, stdinInput);
    } catch {}
  }, [stdinInput]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(false);

  // 4. Modals and Toasts
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 5. Static Code Analysis (McCabe Cyclomatic Complexity, Big-O, Execution Estimation)
  const analysis = useMemo(() => {
    return analyzeCode(file.content, file.language);
  }, [file.content, file.language]);

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

  // 8. Load Starter Template / Reset Handler
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

  const handleResetCode = useCallback(
    (lang: SupportedLanguage = file.language) => {
      const fresh = createFreshFile(lang);
      setFile(fresh);
      setExecutionResult(null);
      try {
        sessionStorage.setItem(SESSION_FILE_KEY, JSON.stringify(fresh));
      } catch {}
      addToast('info', `Reset editor to fresh ${LANGUAGES[lang].name} canvas`, 'Fresh Start');
    },
    [file.language, addToast]
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
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const updatedName = `${baseName}${meta.extension}`;

    // If current file only contains a default comment or is empty, switch comment to match the selected language
    const isDefaultComment =
      !file.content.trim() ||
      Object.keys(LANGUAGES).some(
        (l) => file.content.trim() === getDefaultComment(l as SupportedLanguage).trim()
      );

    const newContent = isDefaultComment ? getDefaultComment(newLang) : file.content;

    setFile((prev) => ({
      ...prev,
      name: updatedName,
      language: newLang,
      content: newContent,
      size: new Blob([newContent]).size,
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
        addToast(
          'success',
          `Executed in ${result.executionTimeMs} ms`,
          `${LANGUAGES[file.language].name} Success`
        );
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
      // Alt + A to toggle Static Code Analyzer
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAnalyzerOpen((prev) => !prev);
        return;
      }
      // Esc to close modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
        setIsAnalyzerOpen(false);
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
        onResetCode={() => handleResetCode(file.language)}
        onNewTemplate={handleNewTemplate}
        onRun={handleRun}
        isRunning={isRunning}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        analysis={analysis}
        onOpenAnalyzer={() => setIsAnalyzerOpen(true)}
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
            analysis={analysis}
            onOpenAnalyzer={() => setIsAnalyzerOpen(true)}
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
          analysis={analysis}
          onOpenAnalyzerModal={() => setIsAnalyzerOpen(true)}
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

      {/* Professional Static Code Analyzer Inspector Modal */}
      <CodeAnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
        analysis={analysis}
        fileName={file.name}
        language={file.language}
      />

      {/* 4. Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
