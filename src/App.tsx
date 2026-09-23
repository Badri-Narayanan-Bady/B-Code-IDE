/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import {
  VFSNode,
  ActiveSidePanel,
  ActiveBottomTab,
  Diagnostic,
  Breakpoint,
  Collaborator,
  ChatMessage,
  GitCommit,
  EditorSettings,
  WorkspaceMeta,
  ToastMessage,
  TestSuiteResult,
} from './types/ide';
import {
  loadVFS,
  saveVFS,
  resetVFSToTemplate,
  TEMPLATES,
  getInitialWorkspaceId,
  listWorkspaces,
  ensureWorkspaceRegistered,
  createWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  renameWorkspace,
  getWorkspaceMeta,
} from './services/storage';
import { runDiagnostics } from './utils/linter';
import { executeJavaScript, executePython } from './utils/runner';
import { collabEngine } from './services/broadcast';
import { parseSymbols, buildAST } from './utils/astParser';
import { runTestScript, BUILT_IN_MAANG_TESTS } from './utils/testRunner';
import { formatCode } from './utils/formatter';

// Components
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { FileTree } from './components/FileTree';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { LivePreview } from './components/LivePreview';
import { GlobalSearch } from './components/GlobalSearch';
import { GitPanel } from './components/GitPanel';
import { DiffViewer } from './components/DiffViewer';
import { Debugger } from './components/Debugger';
import { CollaborationPanel } from './components/CollaborationPanel';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { CommandPalette } from './components/CommandPalette';
import { VercelDeployModal } from './components/VercelDeployModal';
import { WorkspacesModal } from './components/WorkspacesModal';
import { QuickGuideModal } from './components/QuickGuideModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ToastContainer } from './components/Toast';
import { SymbolOutline } from './components/SymbolOutline';
import { AstModal } from './components/AstModal';
import { TestRunnerPanel } from './components/TestRunnerPanel';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { RegexTesterModal } from './components/RegexTesterModal';

export default function App() {
  // 0. Multi-User Workspace & Isolation State
  const initialInfo = useMemo(() => getInitialWorkspaceId(), []);
  const [workspaceId, setWorkspaceId] = useState<string>(initialInfo.workspaceId);
  const [roomId, setRoomId] = useState<string | undefined>(initialInfo.roomId);
  const [workspacesList, setWorkspacesList] = useState<WorkspaceMeta[]>(() => {
    const list = listWorkspaces();
    if (list.length === 0) {
      const def = ensureWorkspaceRegistered(
        initialInfo.workspaceId,
        initialInfo.roomId ? `Room: ${initialInfo.roomId}` : 'Personal Project',
        'react',
        !initialInfo.roomId,
        initialInfo.roomId
      );
      return [def];
    }
    return list;
  });

  const currentWorkspace = useMemo(() => {
    return (
      workspacesList.find((w) => w.id === workspaceId) ||
      ensureWorkspaceRegistered(
        workspaceId,
        roomId ? `Room: ${roomId}` : 'Personal Project',
        'react',
        !roomId,
        roomId
      )
    );
  }, [workspacesList, workspaceId, roomId]);

  // 1. Virtual File System State (partitioned by workspace)
  const [vfs, setVfs] = useState<Record<string, VFSNode>>(() => loadVFS(initialInfo.workspaceId));
  const [activeTemplate, setActiveTemplate] = useState<string>(currentWorkspace.template || 'react');
  const [openFileIds, setOpenFileIds] = useState<string[]>(['app-tsx']);
  const [activeFileId, setActiveFileId] = useState<string | null>('app-tsx');
  const [diffFile, setDiffFile] = useState<VFSNode | null>(null);

  // 2. UI Layout Panels & Modals
  const [activeSidePanel, setActiveSidePanel] = useState<ActiveSidePanel | null>('explorer');
  const [activeBottomTab, setActiveBottomTab] = useState<ActiveBottomTab>('terminal');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isVercelDeployOpen, setIsVercelDeployOpen] = useState<boolean>(false);
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isAstModalOpen, setIsAstModalOpen] = useState<boolean>(false);
  const [isRegexTesterOpen, setIsRegexTesterOpen] = useState<boolean>(false);

  // 2.2. Automated Testing Suite State
  const [testSuites, setTestSuites] = useState<TestSuiteResult[]>([]);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // 2.5. Toast Notification System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((type: 'success' | 'info' | 'warn' | 'error', message: string, title?: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 3. Editor Settings
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'dark-plus',
    fontSize: 13,
    tabSize: 2,
    wordWrap: true,
    autoSave: '5s',
    formatOnSave: true,
    showMinimap: true,
    lineNumbers: true,
  });

  // 4. Output Logs & Terminal History
  const [outputLogs, setOutputLogs] = useState<{ type: 'log' | 'warn' | 'error' | 'info'; text: string; time: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 5. Diagnostics, AST & Lexical Symbols
  const currentActiveFile = activeFileId ? vfs[activeFileId] : null;
  const diagnostics = useMemo(() => {
    if (!currentActiveFile || currentActiveFile.type !== 'file' || !currentActiveFile.content) {
      return [];
    }
    return runDiagnostics(currentActiveFile.content, currentActiveFile.language, currentActiveFile.name);
  }, [currentActiveFile]);

  // Real-time parsed symbols and AST for current source code
  const currentSymbols = useMemo(() => {
    if (!currentActiveFile || currentActiveFile.type !== 'file' || !currentActiveFile.content) {
      return [];
    }
    return parseSymbols(currentActiveFile.content, currentActiveFile.language);
  }, [currentActiveFile]);

  const currentAST = useMemo(() => {
    if (!currentActiveFile || currentActiveFile.type !== 'file' || !currentActiveFile.content) {
      return { id: 'root', type: 'Program', name: 'root', line: 1, col: 1, children: [] };
    }
    return buildAST(currentActiveFile.content, currentActiveFile.name);
  }, [currentActiveFile]);

  // 6. Debugger State
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([
    { id: 'bp-1', fileId: 'app-tsx', filePath: '/src/App.tsx', line: 12, enabled: true },
  ]);
  const [isPausedAtBreakpoint, setIsPausedAtBreakpoint] = useState(false);
  const [debugVariables, setDebugVariables] = useState<Record<string, any>>({
    tasks: 4,
    count: 0,
    runtime: 'browser-sandbox',
  });

  // 7. Git & Version Control State
  const [currentBranch, setCurrentBranch] = useState('main');
  const [commits, setCommits] = useState<GitCommit[]>([
    {
      id: 'c-1',
      hash: 'a3f912c',
      message: 'feat: initialize B Code project structure',
      author: 'You (Dev)',
      timestamp: Date.now() - 3600000,
      filesChanged: 4,
    },
  ]);

  // 8. Collaboration & Peers State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    collabEngine.currentPeer,
    {
      id: 'peer-sarah',
      name: 'Sarah Chen (Lead)',
      avatarColor: '#38bdf8',
      activeFileId: 'app-tsx',
      cursorLine: 8,
      cursorCol: 14,
      status: 'online',
    },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'Sarah Chen (Lead)',
      senderColor: '#38bdf8',
      text: 'Welcome to B Code IDE! Feel free to run the project or test terminal commands.',
      timestamp: Date.now() - 120000,
    },
  ]);
  const [isSimulatingPeer, setIsSimulatingPeer] = useState<boolean>(true);

  // Dynamic channel binding for multi-user isolation
  useEffect(() => {
    const channelId = roomId ? `room_${roomId}` : `ws_${workspaceId}`;
    collabEngine.setChannel(channelId);
  }, [workspaceId, roomId]);

  // Autosave and persist VFS to isolated workspace storage
  useEffect(() => {
    saveVFS(vfs, workspaceId);
  }, [vfs, workspaceId]);

  // Simulated peer actions (cursor movements and edits)
  useEffect(() => {
    if (!isSimulatingPeer) return;
    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((c) => {
          if (c.id === 'peer-sarah') {
            const nextLine = Math.floor(Math.random() * 25) + 5;
            return { ...c, cursorLine: nextLine, cursorCol: Math.floor(Math.random() * 20) + 1 };
          }
          return c;
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulatingPeer]);

  // Cross-tab broadcast synchronization
  useEffect(() => {
    const unsubscribe = collabEngine.subscribe((event) => {
      if (event.type === 'CURSOR_MOVE') {
        setCollaborators((prev) => {
          const existing = prev.find((p) => p.id === event.peerId);
          if (existing) {
            return prev.map((p) =>
              p.id === event.peerId
                ? { ...p, activeFileId: event.fileId, cursorLine: event.line, cursorCol: event.col }
                : p
            );
          }
          return [
            ...prev,
            {
              id: event.peerId,
              name: 'Peer ' + event.peerId.slice(-4),
              avatarColor: '#f472b6',
              activeFileId: event.fileId,
              cursorLine: event.line,
              cursorCol: event.col,
              status: 'online',
            },
          ];
        });
      } else if (event.type === 'CHAT_MESSAGE') {
        setMessages((prev) => [...prev, event.message]);
      }
    });
    return unsubscribe;
  }, []);

  // Keyboard Shortcuts (Ctrl+P, Ctrl+S, Alt+Shift+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        addLog('info', `Saved all files at ${new Date().toLocaleTimeString()}`);
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFormatActiveDocument();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        handleRun();
      }
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeFileId, vfs, currentActiveFile, settings.tabSize]);

  // Add output log helper
  const addLog = useCallback((type: 'log' | 'warn' | 'error' | 'info', text: string) => {
    setOutputLogs((prev) => [
      ...prev,
      {
        type,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  }, []);

  // Code Formatter (Prettier Engine)
  const handleFormatActiveDocument = useCallback(() => {
    if (!activeFileId || !currentActiveFile || currentActiveFile.type !== 'file' || !currentActiveFile.content) {
      addToast('info', 'No active text file to format');
      return;
    }
    const formatted = formatCode(currentActiveFile.content, currentActiveFile.language, settings.tabSize);
    if (formatted !== currentActiveFile.content) {
      setVfs((prev) => {
        const file = prev[activeFileId];
        if (!file) return prev;
        return {
          ...prev,
          [activeFileId]: {
            ...file,
            content: formatted,
            isDirty: true,
            gitStatus: 'modified',
          },
        };
      });
      addToast('success', `Formatted ${currentActiveFile.name}`, 'Code Formatted');
    } else {
      addToast('info', `${currentActiveFile.name} is already clean`);
    }
  }, [activeFileId, currentActiveFile, settings.tabSize, addToast]);

  // Automated Unit Test Runner (BDD Engine)
  const handleRunAllTests = useCallback(async () => {
    setIsTesting(true);
    try {
      const testFiles = Object.values(vfs).filter(
        (f) =>
          f.type === 'file' &&
          Boolean(f.content) &&
          (f.name.endsWith('.test.ts') ||
            f.name.endsWith('.test.js') ||
            f.name.endsWith('.spec.ts') ||
            f.name.endsWith('.spec.js') ||
            (f.content && f.content.includes('describe(')) ||
            (f.content && f.content.includes('it(')))
      );

      const results: TestSuiteResult[] = [];
      if (testFiles.length === 0) {
        const res = await runTestScript(BUILT_IN_MAANG_TESTS, 'built-in.test.ts');
        results.push(res);
      } else {
        for (const file of testFiles) {
          const res = await runTestScript(file.content || '', file.name);
          results.push(res);
        }
      }

      setTestSuites(results);
      const passed = results.reduce((acc, s) => acc + s.passedCount, 0);
      const failed = results.reduce((acc, s) => acc + s.failedCount, 0);

      if (failed > 0) {
        addToast('warn', `${passed} passed, ${failed} failed`, 'Test Suite Finished');
      } else {
        addToast('success', `All ${passed} assertions passed!`, 'Test Suite Passed');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Testing error', 'Test Runner');
    } finally {
      setIsTesting(false);
    }
  }, [vfs, addToast]);

  const handleRunActiveFileTests = useCallback(async () => {
    if (!currentActiveFile || currentActiveFile.type !== 'file' || !currentActiveFile.content) {
      addToast('info', 'Please open a test file to execute');
      return;
    }

    setIsTesting(true);
    try {
      const res = await runTestScript(currentActiveFile.content, currentActiveFile.name);
      setTestSuites((prev) => {
        const filtered = prev.filter((s) => s.fileName !== currentActiveFile.name);
        return [res, ...filtered];
      });

      if (res.failedCount > 0) {
        addToast('warn', `${res.passedCount} passed, ${res.failedCount} failed`, res.suiteTitle);
      } else {
        addToast('success', `${res.passedCount} tests passed!`, res.suiteTitle);
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Error running test', 'Test Runner');
    } finally {
      setIsTesting(false);
    }
  }, [currentActiveFile, addToast]);

  const handleLoadMaangTestSuite = useCallback(async () => {
    const newFiles = resetVFSToTemplate('maang', workspaceId);
    setVfs(newFiles);
    setActiveTemplate('maang');
    const firstFile = Object.values(newFiles).find((n) => n.type === 'file');
    if (firstFile) {
      setOpenFileIds([firstFile.id]);
      setActiveFileId(firstFile.id);
    }
    addToast('success', 'Loaded MAANG Interview & CS Systems Suite with Automated Tests');
    const res = await runTestScript(BUILT_IN_MAANG_TESTS, 'algorithms.test.ts');
    setTestSuites([res]);
  }, [workspaceId, addToast]);

  // Run Project / Script Action
  const handleRun = async () => {
    setIsRunning(true);
    setActiveBottomTab('output');
    addLog('info', '▶ Launching project execution sandbox...');

    if (!currentActiveFile || currentActiveFile.type !== 'file') {
      addLog('warn', 'No active file selected for direct execution. Reloading preview...');
      setShowPreview(true);
      setIsRunning(false);
      return;
    }

    const code = currentActiveFile.content || '';
    const isPython = currentActiveFile.name.endsWith('.py');

    if (isPython) {
      addLog('info', `Running Python: ${currentActiveFile.name}`);
      const res = await executePython(code, (type, msg) => addLog(type, msg));
      if (res.success) {
        addLog('info', `Execution complete in ${res.executionTimeMs}ms (Process exited with code 0)`);
      } else {
        addLog('error', `Execution failed: ${res.error}`);
      }
    } else {
      addLog('info', `Executing script: ${currentActiveFile.name}`);
      const res = await executeJavaScript(code, (type, msg) => addLog(type, msg));
      if (res.success) {
        if (res.returnedValue !== undefined) {
          addLog('log', `Return: ${res.returnedValue}`);
        }
        addLog('info', `Execution finished in ${res.executionTimeMs}ms (Exit 0)`);
      } else {
        addLog('error', `Execution failed: ${res.error}`);
      }
    }

    setIsRunning(false);
  };

  // Terminal Command Execution Engine
  const handleTerminalCommand = async (cmd: string): Promise<string | void> => {
    const parts = cmd.trim().split(/\s+/);
    const primary = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (primary) {
      case 'help':
        return [
          'Available B Code Terminal Commands:',
          '  run / node [file]   - Execute script or current file in JS sandbox',
          '  python [file]       - Run Python script in WebAssembly environment',
          '  test / npm test     - Run project test suite',
          '  npm start           - Start live preview server (port 3000)',
          '  npm run build       - Build production bundle',
          '  ls / dir            - List files and directories in workspace',
          '  cat <file>          - Display file content',
          '  mkdir <name>        - Create new folder',
          '  touch <name>        - Create new file',
          '  rm <name>           - Remove file or folder',
          '  pwd                 - Print current directory path',
          '  eval <expression>   - Real-time JavaScript expression evaluation',
          '  git status          - Check working tree status',
          '  git commit -m "..." - Record changes to repository',
          '  git log             - Show commit history',
          '  vercel / deploy     - Launch Vercel deployment assistant',
          '  workspaces          - Open workspace & project isolation manager',
          '  clear               - Clear terminal screen',
          '  date / whoami       - System information',
        ].join('\n');

      case 'vercel':
      case 'deploy':
        setIsVercelDeployOpen(true);
        return '▲ Launching Vercel Deployment Assistant...';

      case 'workspaces':
      case 'projects':
        setIsWorkspacesOpen(true);
        return '📁 Opening Workspace Manager...';

      case 'run':
      case 'node': {
        const targetName = args[0];
        const targetNode = targetName
          ? Object.values(vfs).find((n) => n.name === targetName && n.type === 'file')
          : currentActiveFile;

        if (!targetNode || !targetNode.content) {
          return `node: file not found '${targetName || ''}'`;
        }
        const res = await executeJavaScript(targetNode.content, (t, m) => addLog(t, m));
        return res.output.join('\n') || `[Done] Process exited in ${res.executionTimeMs}ms with code 0`;
      }

      case 'python':
      case 'python3': {
        const targetName = args[0];
        const targetNode = targetName
          ? Object.values(vfs).find((n) => n.name === targetName && n.type === 'file')
          : currentActiveFile;

        if (!targetNode || !targetNode.content) {
          return `python: file not found '${targetName || ''}'`;
        }
        const res = await executePython(targetNode.content, (t, m) => addLog(t, m));
        return res.output.join('\n') || `[Done] Python exited with code 0 in ${res.executionTimeMs}ms`;
      }

      case 'npm': {
        const sub = args[0];
        if (sub === 'test') {
          setActiveBottomTab('tests');
          await handleRunAllTests();
          return '⚡ Test suite executed. Switched to Test Suite tab.';
        }
        if (sub === 'start') {
          setShowPreview(true);
          return 'Starting dev server on http://localhost:3000... Ready in 210ms.';
        }
        if (sub === 'build') {
          return 'vite v8.3.0 building for production...\n✓ 14 modules transformed.\ndist/index.html 0.45 kB\ndist/assets/index.js 28.40 kB\n✓ Built in 314ms.';
        }
        return `npm: unknown command '${sub}'. Try 'npm test', 'npm start', or 'npm run build'.`;
      }

      case 'test':
      case 'jest':
      case 'vitest':
        setActiveBottomTab('tests');
        await handleRunAllTests();
        return '⚡ Running automated Jest/Vitest unit test suite...';

      case 'bench':
      case 'benchmark':
      case 'profile':
        setActiveBottomTab('profiler');
        return '⚡ Performance Profiler opened in bottom panel.';

      case 'format':
      case 'prettier':
        handleFormatActiveDocument();
        return '✓ Active document formatted cleanly.';

      case 'ls':
      case 'dir': {
        const filesList = Object.values(vfs).filter((n) => n.parentId === 'root');
        return filesList
          .map((n) => (n.type === 'folder' ? `\x1b[34m${n.name}/\x1b[0m` : n.name))
          .join('   ');
      }

      case 'cat': {
        const filename = args[0];
        if (!filename) return 'cat: missing filename argument';
        const file = Object.values(vfs).find((n) => n.name === filename && n.type === 'file');
        if (!file) return `cat: ${filename}: No such file`;
        return file.content || '';
      }

      case 'pwd':
        return '/workspace/project';

      case 'whoami':
        return 'b-code-developer (UID 1000)';

      case 'date':
        return new Date().toUTCString();

      case 'touch': {
        const filename = args[0];
        if (!filename) return 'touch: missing file operand';
        handleCreateFile('root', filename);
        return `Created file '${filename}'`;
      }

      case 'mkdir': {
        const dirname = args[0];
        if (!dirname) return 'mkdir: missing directory operand';
        handleCreateFolder('root', dirname);
        return `Created folder '${dirname}'`;
      }

      case 'rm': {
        const name = args[0];
        if (!name) return 'rm: missing operand';
        const node = Object.values(vfs).find((n) => n.name === name);
        if (!node) return `rm: cannot remove '${name}': No such file or directory`;
        handleDeleteNode(node.id);
        return `Removed '${name}'`;
      }

      case 'git': {
        const gitCmd = args[0];
        if (gitCmd === 'status') {
          const modified = Object.values(vfs).filter((f) => f.type === 'file' && f.gitStatus === 'modified');
          const untracked = Object.values(vfs).filter((f) => f.type === 'file' && f.gitStatus === 'untracked');
          return [
            `On branch ${currentBranch}`,
            `Changes not staged for commit:`,
            ...modified.map((f) => `  modified:   ${f.path}`),
            `Untracked files:`,
            ...untracked.map((f) => `  ${f.path}`),
          ].join('\n');
        }
        if (gitCmd === 'log') {
          return commits.map((c) => `commit ${c.hash}\nAuthor: ${c.author}\nDate: ${new Date(c.timestamp).toLocaleString()}\n\n    ${c.message}\n`).join('\n');
        }
        if (gitCmd === 'commit') {
          const msg = args.slice(1).join(' ').replace(/^-m\s*["']?|["']?$/g, '');
          if (!msg) return 'git commit: missing message';
          handleCommit(msg);
          return `[${currentBranch} ${commits[0]?.hash || 'a1b2c3d'}] ${msg}`;
        }
        return `git: '${gitCmd}' is not a valid git command`;
      }

      case 'eval': {
        const expression = args.join(' ');
        try {
          const res = eval(expression);
          return String(res);
        } catch (e: any) {
          return `EvalError: ${e.message}`;
        }
      }

      default:
        return `bash: ${primary}: command not found. Type "help" for instructions.`;
    }
  };

  // VFS Operations
  const handleSelectFile = (id: string) => {
    if (!openFileIds.includes(id)) {
      setOpenFileIds((prev) => [...prev, id]);
    }
    setActiveFileId(id);
    setDiffFile(null);
  };

  const handleCloseFile = (id: string) => {
    const nextOpen = openFileIds.filter((fId) => fId !== id);
    setOpenFileIds(nextOpen);
    if (activeFileId === id) {
      setActiveFileId(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null);
    }
  };

  const handleChangeContent = (fileId: string, newContent: string) => {
    setVfs((prev) => {
      const file = prev[fileId];
      if (!file) return prev;
      const isModified = file.originalContent !== undefined ? file.originalContent !== newContent : true;
      return {
        ...prev,
        [fileId]: {
          ...file,
          content: newContent,
          isDirty: true,
          gitStatus: isModified ? 'modified' : 'unmodified',
        },
      };
    });
  };

  const handleCreateFile = (parentId: string, name: string) => {
    const id = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const parent = vfs[parentId];
    const parentPath = parent?.path === '/' ? '' : parent?.path || '';
    const ext = name.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      html: 'html',
      css: 'css',
      json: 'json',
      py: 'python',
      md: 'markdown',
    };

    const newNode: VFSNode = {
      id,
      name,
      path: `${parentPath}/${name}`,
      type: 'file',
      language: langMap[ext || ''] || 'plaintext',
      parentId,
      content: '',
      gitStatus: 'untracked',
    };

    setVfs((prev) => ({
      ...prev,
      [id]: newNode,
      [parentId]: {
        ...prev[parentId],
        children: [...(prev[parentId].children || []), id],
        isOpen: true,
      },
    }));

    handleSelectFile(id);
  };

  const handleCreateFolder = (parentId: string, name: string) => {
    const id = 'folder-' + Date.now();
    const parent = vfs[parentId];
    const parentPath = parent?.path === '/' ? '' : parent?.path || '';

    const newNode: VFSNode = {
      id,
      name,
      path: `${parentPath}/${name}`,
      type: 'folder',
      parentId,
      children: [],
      isOpen: true,
    };

    setVfs((prev) => ({
      ...prev,
      [id]: newNode,
      [parentId]: {
        ...prev[parentId],
        children: [...(prev[parentId].children || []), id],
        isOpen: true,
      },
    }));
  };

  const handleRenameNode = (id: string, newName: string) => {
    setVfs((prev) => {
      const node = prev[id];
      if (!node) return prev;
      const parts = node.path.split('/');
      parts[parts.length - 1] = newName;
      return {
        ...prev,
        [id]: {
          ...node,
          name: newName,
          path: parts.join('/'),
          gitStatus: 'modified',
        },
      };
    });
  };

  const handleDeleteNode = (id: string) => {
    setVfs((prev) => {
      const node = prev[id];
      if (!node) return prev;
      const newVfs = { ...prev };
      delete newVfs[id];

      // Remove from parent's children
      if (node.parentId && newVfs[node.parentId]) {
        newVfs[node.parentId] = {
          ...newVfs[node.parentId],
          children: (newVfs[node.parentId].children || []).filter((cId) => cId !== id),
        };
      }
      return newVfs;
    });

    handleCloseFile(id);
  };

  const handleToggleFolder = (id: string) => {
    setVfs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: !prev[id].isOpen,
      },
    }));
  };

  // Switch Starter Sandbox Template
  const handleSwitchTemplate = (key: string) => {
    const newFiles = resetVFSToTemplate(key, workspaceId);
    setVfs(newFiles);
    setActiveTemplate(key);

    const firstFile = Object.values(newFiles).find((n) => n.type === 'file');
    if (firstFile) {
      setOpenFileIds([firstFile.id]);
      setActiveFileId(firstFile.id);
    }
    addLog('info', `Switched template to "${TEMPLATES[key]?.name || key}"`);
    addToast('success', `Loaded ${TEMPLATES[key]?.name || key} template`);
  };

  // Workspace Switch & Creation Handlers
  const handleSelectWorkspace = (targetId: string) => {
    saveVFS(vfs, workspaceId);
    const targetVfs = loadVFS(targetId);
    const targetMeta = getWorkspaceMeta(targetId);
    setWorkspaceId(targetId);
    setRoomId(targetMeta?.roomId);
    setVfs(targetVfs);
    setActiveTemplate(targetMeta?.template || 'react');

    const firstFile = Object.values(targetVfs).find((n) => n.type === 'file');
    if (firstFile) {
      setOpenFileIds([firstFile.id]);
      setActiveFileId(firstFile.id);
    } else {
      setOpenFileIds([]);
      setActiveFileId(null);
    }
    setIsWorkspacesOpen(false);
    addToast('info', `Active project: "${targetMeta?.name || 'Workspace'}"`, 'Workspace Switched');
  };

  const handleCreateWorkspace = (name: string, templateKey: string, isPrivate: boolean, rId?: string) => {
    saveVFS(vfs, workspaceId);
    const newMeta = createWorkspace(name, templateKey, isPrivate, rId);
    setWorkspacesList(listWorkspaces());
    setWorkspaceId(newMeta.id);
    setRoomId(newMeta.roomId);
    const newFiles = loadVFS(newMeta.id);
    setVfs(newFiles);
    setActiveTemplate(templateKey);

    const firstFile = Object.values(newFiles).find((n) => n.type === 'file');
    if (firstFile) {
      setOpenFileIds([firstFile.id]);
      setActiveFileId(firstFile.id);
    }
    setIsWorkspacesOpen(false);
    addToast('success', `Created workspace "${newMeta.name}"`, 'Project Ready');
  };

  const handleDeleteWorkspace = (id: string) => {
    const fallbackId = deleteWorkspace(id);
    setWorkspacesList(listWorkspaces());
    if (fallbackId && fallbackId !== workspaceId) {
      handleSelectWorkspace(fallbackId);
    }
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    renameWorkspace(id, newName);
    setWorkspacesList(listWorkspaces());
  };

  const handleDuplicateWorkspace = (id: string) => {
    const dup = duplicateWorkspace(id);
    setWorkspacesList(listWorkspaces());
    addToast('success', `Duplicated as "${dup.name}"`);
  };

  const handleImportFile = (parentId: string, name: string, content: string) => {
    const id = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const parent = vfs[parentId] || vfs['root'];
    const parentPath = parent?.path === '/' ? '' : parent?.path || '';
    const ext = name.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      html: 'html',
      css: 'css',
      json: 'json',
      py: 'python',
      md: 'markdown',
      txt: 'plaintext',
    };

    const newNode: VFSNode = {
      id,
      name,
      path: `${parentPath}/${name}`,
      type: 'file',
      language: langMap[ext || ''] || 'plaintext',
      parentId: parent ? parent.id : 'root',
      content,
      gitStatus: 'untracked',
    };

    setVfs((prev) => {
      const pId = parent ? parent.id : 'root';
      return {
        ...prev,
        [id]: newNode,
        [pId]: {
          ...prev[pId],
          children: [...(prev[pId]?.children || []), id],
          isOpen: true,
        },
      };
    });

    handleSelectFile(id);
    addToast('success', `Imported "${name}"`);
  };

  const handleDownloadSingleFile = (node: VFSNode) => {
    if (!node.content) return;
    const blob = new Blob([node.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = node.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('info', `Downloaded "${node.name}"`);
  };

  // Export Project as ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    Object.values(vfs).forEach((node) => {
      if (node.type === 'file') {
        const cleanPath = node.path.replace(/^\//, '');
        zip.file(cleanPath, node.content || '');
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `b-code-${activeTemplate}-project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('info', 'Project downloaded as ZIP archive.');
  };

  // Breakpoints
  const handleToggleBreakpoint = (fileId: string, line: number) => {
    const existing = breakpoints.find((b) => b.fileId === fileId && b.line === line);
    if (existing) {
      setBreakpoints(breakpoints.filter((b) => b.id !== existing.id));
    } else {
      const file = vfs[fileId];
      setBreakpoints([
        ...breakpoints,
        {
          id: 'bp-' + Date.now(),
          fileId,
          filePath: file?.path || '',
          line,
          enabled: true,
        },
      ]);
    }
  };

  // Git staging & commits
  const handleStageFile = (fileId: string) => {
    setVfs((prev) => ({
      ...prev,
      [fileId]: { ...prev[fileId], gitStatus: 'staged' },
    }));
  };

  const handleUnstageFile = (fileId: string) => {
    setVfs((prev) => ({
      ...prev,
      [fileId]: { ...prev[fileId], gitStatus: 'modified' },
    }));
  };

  const handleStageAll = () => {
    setVfs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].type === 'file' && (next[k].gitStatus === 'modified' || next[k].gitStatus === 'untracked')) {
          next[k] = { ...next[k], gitStatus: 'staged' };
        }
      });
      return next;
    });
  };

  const handleRevertFile = (fileId: string) => {
    setVfs((prev) => {
      const file = prev[fileId];
      if (!file) return prev;
      return {
        ...prev,
        [fileId]: {
          ...file,
          content: file.originalContent ?? file.content,
          gitStatus: 'unmodified',
          isDirty: false,
        },
      };
    });
  };

  const handleCommit = (message: string) => {
    const stagedCount = Object.values(vfs).filter((f) => f.gitStatus === 'staged').length;
    const randomHash = Math.random().toString(16).substring(2, 9);
    const newCommit: GitCommit = {
      id: 'c-' + Date.now(),
      hash: randomHash,
      message,
      author: 'You (Dev)',
      timestamp: Date.now(),
      filesChanged: Math.max(1, stagedCount),
    };

    setCommits([newCommit, ...commits]);

    // Mark staged as unmodified and update originalContent
    setVfs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].type === 'file' && next[k].gitStatus === 'staged') {
          next[k] = {
            ...next[k],
            gitStatus: 'unmodified',
            originalContent: next[k].content,
            isDirty: false,
          };
        }
      });
      return next;
    });

    addLog('info', `Committed [${randomHash}] ${message}`);
  };

  // Search replace in files
  const handleReplaceInFiles = (matches: { fileId: string; line: number; oldText: string; newText: string }[]) => {
    setVfs((prev) => {
      const next = { ...prev };
      matches.forEach((m) => {
        const file = next[m.fileId];
        if (file && file.content) {
          const lines = file.content.split('\n');
          if (lines[m.line - 1]) {
            lines[m.line - 1] = lines[m.line - 1].replace(m.oldText, m.newText);
            next[m.fileId] = {
              ...file,
              content: lines.join('\n'),
              gitStatus: 'modified',
              isDirty: true,
            };
          }
        }
      });
      return next;
    });
    addLog('info', `Replaced ${matches.length} occurrences across files.`);
  };

  const uncommittedChangesCount = Object.values(vfs).filter(
    (f) => f.type === 'file' && (f.gitStatus === 'modified' || f.gitStatus === 'untracked' || f.gitStatus === 'staged')
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-200 font-sans">
      {/* 1. Top Bar Contract (Brand - Nav Menus - Actions) */}
      <TopBar
        onRun={handleRun}
        onTogglePreview={() => setShowPreview(!showPreview)}
        showPreview={showPreview}
        onExportZip={handleExportZip}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onNewFile={() => handleCreateFile('root', 'new-file.ts')}
        onNewFolder={() => handleCreateFolder('root', 'new-folder')}
        onSwitchTemplate={handleSwitchTemplate}
        activeTemplate={activeTemplate}
        isRunning={isRunning}
        peerCount={collaborators.length}
        workspaceName={currentWorkspace.name}
        isPrivateWorkspace={currentWorkspace.isPrivate}
        roomId={roomId}
        onOpenWorkspaces={() => setIsWorkspacesOpen(true)}
        onOpenVercelDeploy={() => setIsVercelDeployOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onFormatDocument={handleFormatActiveDocument}
        onOpenRegexTester={() => setIsRegexTesterOpen(true)}
        onOpenAstModal={() => setIsAstModalOpen(true)}
        onOpenTestRunner={() => setActiveSidePanel('tests')}
        onOpenProfiler={() => setActiveSidePanel('benchmarks')}
      />

      {/* 2. Main IDE Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Activity Bar */}
        <Sidebar
          activePanel={activeSidePanel}
          onSelectPanel={(panel) => {
            if (panel === 'settings') {
              setIsSettingsOpen(true);
            } else {
              setActiveSidePanel(activeSidePanel === panel ? null : panel);
            }
          }}
          uncommittedChangesCount={uncommittedChangesCount}
          problemsCount={diagnostics.length}
          collaboratorsCount={collaborators.length}
          failedTestsCount={testSuites.reduce((acc, s) => acc + s.failedCount, 0)}
        />

        {/* Collapsible Left Side Panel */}
        {activeSidePanel && (
          <div className="w-64 md:w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden z-10">
            {activeSidePanel === 'explorer' && (
              <FileTree
                nodes={vfs}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRenameNode={handleRenameNode}
                onDeleteNode={handleDeleteNode}
                onDuplicateNode={(id) => {
                  const n = vfs[id];
                  if (n) handleCreateFile(n.parentId || 'root', `copy-${n.name}`);
                }}
                onToggleFolder={handleToggleFolder}
                onImportFile={handleImportFile}
                onDownloadFile={handleDownloadSingleFile}
              />
            )}

            {activeSidePanel === 'outline' && (
              <SymbolOutline
                symbols={currentSymbols}
                activeFileName={currentActiveFile?.name}
                onSelectSymbol={(line) => {
                  // Focus line in editor
                  addToast('info', `Navigated to line ${line}`, currentActiveFile?.name);
                }}
                onOpenAstModal={() => setIsAstModalOpen(true)}
              />
            )}

            {activeSidePanel === 'tests' && (
              <TestRunnerPanel
                suites={testSuites}
                isRunning={isTesting}
                onRunAllTests={handleRunAllTests}
                onRunActiveFileTests={handleRunActiveFileTests}
                onLoadMaangTestSuite={handleLoadMaangTestSuite}
              />
            )}

            {activeSidePanel === 'benchmarks' && (
              <BenchmarkPanel onNotify={addToast} />
            )}

            {activeSidePanel === 'search' && (
              <GlobalSearch
                files={vfs}
                onSelectFileAndLine={(fId) => {
                  handleSelectFile(fId);
                }}
                onReplaceInFiles={handleReplaceInFiles}
              />
            )}

            {activeSidePanel === 'git' && (
              <GitPanel
                files={vfs}
                onStageFile={handleStageFile}
                onUnstageFile={handleUnstageFile}
                onStageAll={handleStageAll}
                onCommit={handleCommit}
                onRevertFile={handleRevertFile}
                onSelectDiff={(file) => setDiffFile(file)}
                commits={commits}
                currentBranch={currentBranch}
                onChangeBranch={setCurrentBranch}
              />
            )}

            {activeSidePanel === 'debug' && (
              <Debugger
                breakpoints={breakpoints}
                onToggleBreakpointEnabled={(id) => {
                  setBreakpoints(breakpoints.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
                }}
                onRemoveBreakpoint={(id) => {
                  setBreakpoints(breakpoints.filter((b) => b.id !== id));
                }}
                onSelectBreakpointFile={(fId) => {
                  handleSelectFile(fId);
                }}
                isPaused={isPausedAtBreakpoint}
                onContinue={() => {
                  setIsPausedAtBreakpoint(false);
                  addLog('info', 'Debugger resumed execution');
                }}
                onStepOver={() => addLog('info', 'Debugger step over line')}
                onStepInto={() => addLog('info', 'Debugger step into function')}
                onRestart={() => {
                  setIsPausedAtBreakpoint(true);
                  addLog('info', 'Debugger restarted session');
                }}
                onStop={() => {
                  setIsPausedAtBreakpoint(false);
                  addLog('info', 'Debugger stopped');
                }}
                variables={debugVariables}
              />
            )}

            {activeSidePanel === 'collab' && (
              <CollaborationPanel
                collaborators={collaborators}
                messages={messages}
                onSendMessage={(text) => {
                  const msg = collabEngine.sendChatMessage(text);
                  setMessages((prev) => [...prev, msg]);
                }}
                onToggleSimulatedPeer={() => setIsSimulatingPeer(!isSimulatingPeer)}
                isSimulating={isSimulatingPeer}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* Center / Right Working Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor + Live Preview Split View */}
          <div className="flex-1 flex overflow-hidden">
            {diffFile ? (
              <DiffViewer file={diffFile} onClose={() => setDiffFile(null)} />
            ) : (
              <Editor
                files={vfs}
                openFileIds={openFileIds}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCloseFile={handleCloseFile}
                onChangeContent={handleChangeContent}
                diagnostics={diagnostics}
                breakpoints={breakpoints}
                onToggleBreakpoint={handleToggleBreakpoint}
                collaborators={collaborators}
                settings={settings}
                onCursorMove={(fId, line, col) => {
                  collabEngine.sendCursor(fId, line, col);
                }}
              />
            )}

            {/* Live Web Preview Panel */}
            {showPreview && (
              <div className="w-1/2 min-w-[340px] flex flex-col h-full border-l border-neutral-800">
                <LivePreview
                  files={vfs}
                  onClose={() => setShowPreview(false)}
                  onReceiveLog={(type, msg) => addLog(type, msg)}
                />
              </div>
            )}
          </div>

          {/* Bottom Integrated Terminal, Output, Problems, Tests, Profiler Tabs */}
          <Terminal
            activeTab={activeBottomTab}
            onChangeTab={setActiveBottomTab}
            diagnostics={diagnostics}
            onSelectDiagnosticLine={(line) => {
              addToast('info', `Problem on line ${line}`);
            }}
            outputLogs={outputLogs}
            onClearLogs={() => setOutputLogs([])}
            onExecuteCommand={handleTerminalCommand}
            isExpanded={isTerminalExpanded}
            onToggleExpand={() => setIsTerminalExpanded(!isTerminalExpanded)}
            testComponent={
              <TestRunnerPanel
                suites={testSuites}
                isRunning={isTesting}
                onRunAllTests={handleRunAllTests}
                onRunActiveFileTests={handleRunActiveFileTests}
                onLoadMaangTestSuite={handleLoadMaangTestSuite}
              />
            }
            profilerComponent={<BenchmarkPanel onNotify={addToast} />}
            failedTestsCount={testSuites.reduce((acc, s) => acc + s.failedCount, 0)}
          />
        </div>
      </div>

      {/* 3. Global Modals and Overlays */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={vfs}
        onSelectFile={handleSelectFile}
        onRun={handleRun}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onExportZip={handleExportZip}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onClearTerminal={() => setOutputLogs([])}
        onOpenVercelDeploy={() => setIsVercelDeployOpen(true)}
        onOpenWorkspaces={() => setIsWorkspacesOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
        onResetWorkspace={() => handleSwitchTemplate(activeTemplate)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeCollaboratorsCount={collaborators.length}
      />

      <VercelDeployModal
        isOpen={isVercelDeployOpen}
        onClose={() => setIsVercelDeployOpen(false)}
        vfs={vfs}
        projectName={currentWorkspace.name}
        onNotify={addToast}
      />

      <WorkspacesModal
        isOpen={isWorkspacesOpen}
        onClose={() => setIsWorkspacesOpen(false)}
        workspaces={workspacesList}
        activeWorkspaceId={workspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onRenameWorkspace={handleRenameWorkspace}
        onDuplicateWorkspace={handleDuplicateWorkspace}
        onNotify={addToast}
      />

      <QuickGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenDeploy={() => setIsVercelDeployOpen(true)}
        onOpenWorkspaces={() => setIsWorkspacesOpen(true)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AstModal
        isOpen={isAstModalOpen}
        onClose={() => setIsAstModalOpen(false)}
        ast={currentAST}
        fileName={currentActiveFile?.name}
        onSelectLine={(line) => {
          addToast('info', `Navigated to line ${line}`, currentActiveFile?.name);
        }}
      />

      <RegexTesterModal
        isOpen={isRegexTesterOpen}
        onClose={() => setIsRegexTesterOpen(false)}
        onNotify={addToast}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
