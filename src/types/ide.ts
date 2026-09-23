export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'c' | 'sql';

export interface LanguageMeta {
  id: SupportedLanguage;
  name: string;
  extension: string;
  defaultFileName: string;
  color: string;
  badge: string;
  sampleCode: string;
  compileType: 'interpreted' | 'compiled' | 'relational';
}

export interface CodeFile {
  name: string;
  content: string;
  language: SupportedLanguage;
  size: number;
  lastModified: number;
  isDirty?: boolean;
}

export interface SQLQueryResult {
  statement: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  affectedRows?: number;
  executionTimeMs: number;
  error?: string;
  isSelect: boolean;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string[];
  stderr: string[];
  executionTimeMs: number;
  exitCode: number;
  sqlResults?: SQLQueryResult[];
  compilerOutput?: string;
  statusText?: string;
}

export interface Diagnostic {
  id: string;
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: string;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  theme: 'dark' | 'midnight' | 'dracula' | 'light';
  lineNumbers: boolean;
  autoFormatOnRun: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warn' | 'error';
  message: string;
  title?: string;
}
