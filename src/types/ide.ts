export type FileType = 'file' | 'folder';

export interface VFSNode {
  id: string;
  name: string;
  path: string;
  type: FileType;
  content?: string;
  language?: string;
  parentId: string | null;
  children?: string[]; // IDs of child nodes
  isOpen?: boolean;
  isDirty?: boolean;
  gitStatus?: 'unmodified' | 'modified' | 'untracked' | 'staged';
  originalContent?: string; // For git diff
}

export type ThemeType = 'dark-plus' | 'dracula' | 'one-dark' | 'github-light' | 'monokai' | 'tokyo-night';

export interface Diagnostic {
  id: string;
  line: number;
  column: number;
  length?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: string;
}

export interface Breakpoint {
  id: string;
  fileId: string;
  filePath: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

export interface VariableWatch {
  id: string;
  expression: string;
  value?: string;
  type?: string;
}

export interface StackFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column: number;
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  filesChanged: number;
}

export interface Collaborator {
  id: string;
  name: string;
  avatarColor: string;
  activeFileId?: string;
  cursorLine?: number;
  cursorCol?: number;
  status: 'online' | 'typing' | 'idle';
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderColor: string;
  text: string;
  timestamp: number;
  codeSnippet?: {
    file: string;
    line: number;
    code: string;
  };
}

export interface AutoCompleteItem {
  label: string;
  kind: 'keyword' | 'function' | 'snippet' | 'variable' | 'property' | 'tag';
  detail?: string;
  insertText: string;
  documentation?: string;
}

export interface EditorSettings {
  theme: ThemeType;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  autoSave: 'off' | '1s' | '5s' | '10s';
  formatOnSave: boolean;
  showMinimap: boolean;
  lineNumbers: boolean;
}

export interface WorkspaceMeta {
  id: string;
  name: string;
  template: string;
  createdAt: number;
  lastModified: number;
  isPrivate: boolean;
  roomId?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warn' | 'error';
  title?: string;
  message: string;
}

export type ActiveSidePanel = 'explorer' | 'search' | 'git' | 'debug' | 'collab' | 'outline' | 'tests' | 'benchmarks' | 'settings';
export type ActiveBottomTab = 'terminal' | 'output' | 'problems' | 'tests' | 'profiler' | 'debug-console';

export type SymbolKind = 'function' | 'class' | 'method' | 'variable' | 'interface' | 'import' | 'export';

export interface SymbolItem {
  id: string;
  name: string;
  kind: SymbolKind;
  line: number;
  col: number;
  endLine?: number;
  signature?: string;
  detail?: string;
  children?: SymbolItem[];
}

export interface ASTNode {
  type: string;
  name?: string;
  line: number;
  col: number;
  params?: string[];
  kind?: string;
  raw?: string;
  children?: ASTNode[];
}

export interface TestCaseResult {
  id: string;
  title: string;
  suiteTitle: string;
  status: 'passed' | 'failed' | 'pending';
  durationMs: number;
  error?: string;
  expected?: string;
  actual?: string;
}

export interface TestSuiteResult {
  id: string;
  fileId?: string;
  fileName?: string;
  suiteTitle: string;
  tests: TestCaseResult[];
  durationMs: number;
  passedCount: number;
  failedCount: number;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  description?: string;
  iterations: number;
  totalTimeMs: number;
  meanTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  opsPerSec: number;
  variance?: number;
}
