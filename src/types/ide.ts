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

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  loc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  risk: RiskLevel;
  parameterCount: number;
  suggestion?: string;
}

export interface ComplexityBreakdown {
  branches: number;      // if, else if, elif, switch/case
  loops: number;         // for, while, do-while
  logicalOps: number;    // &&, ||, and, or
  ternaryOps: number;    // ? :
  exceptions: number;    // catch, except
  sqlClauses: number;    // WHERE, HAVING, JOIN, etc.
}

export interface LatencyBreakdown {
  cpuCyclesNs: number;
  memoryAccessNs: number;
  ioLatencyNs: number;
}

export interface ExecutionTimeEstimate {
  asymptoticNotation: string;      // e.g. O(1), O(N), O(N^2), O(N log N)
  asymptoticLabel: string;         // Linear, Quadratic, Constant, etc.
  estimatedDurationMs: number;     // Estimated runtime for standard N (e.g. N = 10,000)
  durationRange: string;           // "< 1 ms", "2-8 ms", etc.
  category: 'instant' | 'fast' | 'moderate' | 'slow';
  maxLoopDepth: number;
  recursiveCallsDetected: boolean;
  estimatedOpsSmall: string;       // e.g. "~100 ops (N=100)"
  estimatedOpsMedium: string;      // e.g. "~10,000 ops (N=10k)"
  estimatedOpsLarge: string;       // e.g. "~100M ops (N=100k)"
  latencyBreakdown: LatencyBreakdown;
  sqlProfile?: {
    tableScans: number;
    joins: number;
    sortOperations: number;
  };
}

export interface CodeAnalysisResult {
  totalCyclomaticComplexity: number;
  risk: RiskLevel;
  cognitiveComplexity: number;
  maintainabilityIndex: number;    // 0 - 100
  maintainabilityLabel: 'High' | 'Moderate' | 'Low';
  halsteadVolume: number;
  linesOfCode: number;
  commentLines: number;
  blankLines: number;
  breakdown: ComplexityBreakdown;
  functions: FunctionComplexity[];
  executionEstimate: ExecutionTimeEstimate;
  recommendations: string[];
}
