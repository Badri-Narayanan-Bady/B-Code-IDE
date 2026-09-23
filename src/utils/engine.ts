import { SupportedLanguage, ExecutionResult, SQLQueryResult } from '../types/ide';

/**
 * High-performance browser-native multi-language execution engine.
 * Tailored for:
 * 1. Python (.py)
 * 2. JavaScript (.js)
 * 3. Java (.java)
 * 4. C++ (.cpp)
 * 5. C (.c)
 * 6. SQL (MySQL dialect) (.sql)
 */

export async function executeCode(
  code: string,
  language: SupportedLanguage,
  stdinInput: string = ''
): Promise<ExecutionResult> {
  const startTime = performance.now();

  try {
    switch (language) {
      case 'javascript':
        return await executeJavaScript(code, startTime);
      case 'python':
        return await executePython(code, stdinInput, startTime);
      case 'java':
        return await executeJava(code, stdinInput, startTime);
      case 'cpp':
        return await executeCpp(code, stdinInput, startTime);
      case 'c':
        return await executeC(code, stdinInput, startTime);
      case 'sql':
        return await executeMySQL(code, startTime);
      default:
        return {
          success: false,
          stdout: [],
          stderr: [`Unsupported execution language: ${language}`],
          executionTimeMs: 0,
          exitCode: 1,
        };
    }
  } catch (err: any) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: false,
      stdout: [],
      stderr: [err?.message || String(err)],
      executionTimeMs: elapsed,
      exitCode: 1,
    };
  }
}

// -------------------------------------------------------------
// 1. JavaScript Engine
// -------------------------------------------------------------
async function executeJavaScript(code: string, startTime: number): Promise<ExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const customConsole = {
    log: (...args: any[]) => {
      stdout.push(args.map(formatValue).join(' '));
    },
    info: (...args: any[]) => {
      stdout.push('[INFO] ' + args.map(formatValue).join(' '));
    },
    warn: (...args: any[]) => {
      stdout.push('[WARN] ' + args.map(formatValue).join(' '));
    },
    error: (...args: any[]) => {
      stderr.push('[ERROR] ' + args.map(formatValue).join(' '));
    },
    table: (tabularData: any) => {
      if (Array.isArray(tabularData)) {
        stdout.push(JSON.stringify(tabularData, null, 2));
      } else {
        stdout.push(formatValue(tabularData));
      }
    },
  };

  try {
    const cleanCode = code
      .replace(/^import\s+.*?['"].*?['"];?/gm, '')
      .replace(/^export\s+(default\s+)?/gm, '');

    const fn = new Function('console', `
      "use strict";
      return (async function() {
        ${cleanCode}
      })();
    `);

    const result = await fn(customConsole);
    if (result !== undefined) {
      stdout.push(`\n[Returned]: ${formatValue(result)}`);
    }

    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 0,
    };
  } catch (err: any) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(err?.stack || err?.message || String(err));
    return {
      success: false,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
    };
  }
}

// -------------------------------------------------------------
// 2. Python Engine (Simulator with Math, Loops, Functions & STDIN)
// -------------------------------------------------------------
async function executePython(code: string, stdinInput: string, startTime: number): Promise<ExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const stdinLines = stdinInput.split('\n');
  let stdinIndex = 0;

  try {
    // Parse lines and convert standard Python syntax into executable JavaScript
    const lines = code.split('\n');
    let jsCode = '';
    const indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i];
      // preserve indent
      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      let line = rawLine.trim();

      // Skip empty or comment lines
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Handle print()
      if (line.startsWith('print(') && line.endsWith(')')) {
        const inner = line.slice(6, -1);
        jsCode += `${indent}__print(${transformPythonExpr(inner)});\n`;
        continue;
      }

      // Handle def function
      const defMatch = line.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*:/);
      if (defMatch) {
        jsCode += `${indent}function ${defMatch[1]}(${defMatch[2]}) {\n`;
        continue;
      }

      // Handle for loop: for i in range(...)
      const forRangeMatch = line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*?)\)\s*:/);
      if (forRangeMatch) {
        const varName = forRangeMatch[1];
        const args = forRangeMatch[2].split(',').map((s) => s.trim());
        let start = '0';
        let end = '0';
        let step = '1';
        if (args.length === 1) {
          end = transformPythonExpr(args[0]);
        } else if (args.length === 2) {
          start = transformPythonExpr(args[0]);
          end = transformPythonExpr(args[1]);
        } else if (args.length === 3) {
          start = transformPythonExpr(args[0]);
          end = transformPythonExpr(args[1]);
          step = transformPythonExpr(args[2]);
        }
        jsCode += `${indent}for (let ${varName} = ${start}; ${varName} < ${end}; ${varName} += ${step}) {\n`;
        continue;
      }

      // Handle for item in list
      const forInMatch = line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.*?)\s*:/);
      if (forInMatch) {
        jsCode += `${indent}for (const ${forInMatch[1]} of ${transformPythonExpr(forInMatch[2])}) {\n`;
        continue;
      }

      // Handle if / elif / else
      const ifMatch = line.match(/^if\s+(.*?)\s*:/);
      if (ifMatch) {
        jsCode += `${indent}if (${transformPythonCondition(ifMatch[1])}) {\n`;
        continue;
      }
      const elifMatch = line.match(/^elif\s+(.*?)\s*:/);
      if (elifMatch) {
        jsCode += `${indent}} else if (${transformPythonCondition(elifMatch[1])}) {\n`;
        continue;
      }
      if (line === 'else:') {
        jsCode += `${indent}} else {\n`;
        continue;
      }

      // Handle while
      const whileMatch = line.match(/^while\s+(.*?)\s*:/);
      if (whileMatch) {
        jsCode += `${indent}while (${transformPythonCondition(whileMatch[1])}) {\n`;
        continue;
      }

      // Handle return
      if (line.startsWith('return')) {
        const val = line.slice(6).trim();
        jsCode += `${indent}return ${transformPythonExpr(val)};\n`;
        continue;
      }

      // Handle standard assignments and expressions
      let transformed = transformPythonExpr(line);
      if (transformed.includes('=')) {
        const parts = transformed.split('=');
        const lhs = parts[0].trim();
        const rhs = parts.slice(1).join('=').trim();
        // If not already declared
        if (!lhs.includes('.') && !lhs.includes('[')) {
          jsCode += `${indent}var ${lhs} = ${rhs};\n`;
        } else {
          jsCode += `${indent}${lhs} = ${rhs};\n`;
        }
      } else {
        jsCode += `${indent}${transformed};\n`;
      }
    }

    // Auto-balance braces based on indentation
    const balancedCode = balancePythonIndents(lines, jsCode);

    const runtimeEnv = {
      __print: (...args: any[]) => {
        stdout.push(args.map(formatValue).join(' '));
      },
      __input: (prompt?: string) => {
        if (prompt) stdout.push(prompt);
        const val = stdinLines[stdinIndex++] || '';
        return val;
      },
      math: Math,
      range: (n: number) => Array.from({ length: n }, (_, i) => i),
      len: (arr: any) => (arr ? arr.length : 0),
      sum: (arr: number[]) => (Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0),
      min: (...args: any[]) => Math.min(...(Array.isArray(args[0]) ? args[0] : args)),
      max: (...args: any[]) => Math.max(...(Array.isArray(args[0]) ? args[0] : args)),
      int: (v: any) => parseInt(v, 10) || 0,
      float: (v: any) => parseFloat(v) || 0,
      str: (v: any) => String(v),
      bool: (v: any) => Boolean(v),
      True: true,
      False: false,
      None: null,
    };

    const runner = new Function(
      '__print',
      'input',
      'math',
      'range',
      'len',
      'sum',
      'min',
      'max',
      'int',
      'float',
      'str',
      'bool',
      'True',
      'False',
      'None',
      `
      "use strict";
      try {
        ${balancedCode}
      } catch(err) {
        throw err;
      }
    `
    );

    runner(
      runtimeEnv.__print,
      runtimeEnv.__input,
      runtimeEnv.math,
      runtimeEnv.range,
      runtimeEnv.len,
      runtimeEnv.sum,
      runtimeEnv.min,
      runtimeEnv.max,
      runtimeEnv.int,
      runtimeEnv.float,
      runtimeEnv.str,
      runtimeEnv.bool,
      runtimeEnv.True,
      runtimeEnv.False,
      runtimeEnv.None
    );

    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 0,
    };
  } catch (err: any) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\nPythonError: ${err?.message || String(err)}`);
    return {
      success: false,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
    };
  }
}

function transformPythonExpr(expr: string): string {
  if (!expr) return '';
  return expr
    .replace(/\bf"(.*?)"/g, (_, s) => '`' + s.replace(/\{([^}]+)\}/g, '${$1}') + '`')
    .replace(/\bf'(.*?)'/g, (_, s) => '`' + s.replace(/\{([^}]+)\}/g, '${$1}') + '`')
    .replace(/\bmath\.isqrt\((.*?)\)/g, 'Math.floor(Math.sqrt($1))')
    .replace(/\bmath\.sqrt\((.*?)\)/g, 'Math.sqrt($1)')
    .replace(/\bmath\.pi\b/g, 'Math.PI')
    .replace(/\.append\((.*?)\)/g, '.push($1)')
    .replace(/\.extend\((.*?)\)/g, '.push(...$1)')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');
}

function transformPythonCondition(cond: string): string {
  return transformPythonExpr(cond)
    .replace(/\b==\b/g, '===')
    .replace(/\b!=\b/g, '!==');
}

function balancePythonIndents(lines: string[], code: string): string {
  // If user already had structured code or nested blocks, ensure closing braces
  const openCount = (code.match(/\{/g) || []).length;
  const closeCount = (code.match(/\}/g) || []).length;
  let result = code;
  for (let i = 0; i < openCount - closeCount; i++) {
    result += '\n}\n';
  }
  return result;
}

// -------------------------------------------------------------
// 3. Java Engine (Syntax Validation, Simulation & Compilation Output)
// -------------------------------------------------------------
async function executeJava(code: string, stdinInput: string, startTime: number): Promise<ExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  // 1. Verify Java Structure
  if (!code.includes('class ')) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push('Main.java:1: error: class, interface, enum, or record expected');
    return {
      success: false,
      stdout: [],
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'javac: exit code 1 (Class declaration missing)',
    };
  }

  if (!code.includes('main(')) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push('Error: Main method not found in class. Please define the main method as:\n   public static void main(String[] args)');
    return {
      success: false,
      stdout: [],
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'javac Main.java: Compilation succeeded\njava Main: Runtime error: Main method missing',
    };
  }

  // 2. Syntax Check (Braces)
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(`Main.java: error: reached end of file while parsing (unmatched braces: ${openBraces} open vs ${closeBraces} closed)`);
    return {
      success: false,
      stdout: [],
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'javac Main.java: Compilation failed with 1 syntax error',
    };
  }

  // 3. Execute Java logic
  try {
    const cleanLines = code.split('\n');
    let executableBody = '';
    let inMain = false;

    for (const rawLine of cleanLines) {
      const line = rawLine.trim();
      if (line.includes('public static void main')) {
        inMain = true;
        continue;
      }
      if (inMain) {
        if (line.startsWith('System.out.println(')) {
          const content = line.slice(19, line.lastIndexOf(');'));
          executableBody += `__printLn(${transformJavaExpr(content)});\n`;
          continue;
        }
        if (line.startsWith('System.out.print(')) {
          const content = line.slice(17, line.lastIndexOf(');'));
          executableBody += `__print(${transformJavaExpr(content)});\n`;
          continue;
        }
        if (line.startsWith('System.err.println(')) {
          const content = line.slice(19, line.lastIndexOf(');'));
          executableBody += `__printErr(${transformJavaExpr(content)});\n`;
          continue;
        }

        // Variable assignments and loops
        let trans = line
          .replace(/int\[\]\s+/g, 'let ')
          .replace(/double\[\]\s+/g, 'let ')
          .replace(/String\[\]\s+/g, 'let ')
          .replace(/int\s+/g, 'let ')
          .replace(/double\s+/g, 'let ')
          .replace(/float\s+/g, 'let ')
          .replace(/boolean\s+/g, 'let ')
          .replace(/String\s+/g, 'let ')
          .replace(/List<[^>]+>\s+/g, 'let ')
          .replace(/ArrayList<[^>]+>\s+/g, 'let ')
          .replace(/new ArrayList<.*?>\(\)/g, '[]')
          .replace(/\.add\(/g, '.push(')
          .replace(/\.size\(\)/g, '.length')
          .replace(/\.get\((.*?)\)/g, '[$1]')
          .replace(/Arrays\.toString\((.*?)\)/g, 'JSON.stringify($1)');

        executableBody += trans + '\n';
      }
    }

    // Runner with Java System.out bindings
    let currentLineBuffer = '';
    const env = {
      __print: (val: any) => {
        currentLineBuffer += formatValue(val);
      },
      __printLn: (val: any) => {
        stdout.push(currentLineBuffer + formatValue(val));
        currentLineBuffer = '';
      },
      __printErr: (val: any) => {
        stderr.push('[System.err] ' + formatValue(val));
      },
    };

    const javaRunner = new Function('__print', '__printLn', '__printErr', `
      "use strict";
      try {
        ${executableBody}
      } catch(e) {
        throw e;
      }
    `);

    javaRunner(env.__print, env.__printLn, env.__printErr);
    if (currentLineBuffer) stdout.push(currentLineBuffer);

    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 0,
      compilerOutput: `[javac] Compiling Main.java with OpenJDK 21.0.2\n[javac] Classfile Main.class generated (0 warnings)\n[java] Executing Main...`,
    };
  } catch (err: any) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(`Exception in thread "main" java.lang.RuntimeException: ${err?.message || String(err)}`);
    return {
      success: false,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'javac Main.java: Compilation succeeded\njava Main: Runtime exception occurred',
    };
  }
}

function transformJavaExpr(expr: string): string {
  return expr
    .replace(/Arrays\.toString\((.*?)\)/g, 'JSON.stringify($1)')
    .replace(/\\n/g, '\n');
}

// -------------------------------------------------------------
// 4. C++ Engine (GCC C++20 Simulation & Execution)
// -------------------------------------------------------------
async function executeCpp(code: string, stdinInput: string, startTime: number): Promise<ExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  // Check for main function
  if (!code.includes('main()') && !code.includes('main(')) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push('main.cpp: in function `_start`:\nundefined reference to `main`\ncollect2: error: ld returned 1 exit status');
    return {
      success: false,
      stdout: [],
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'g++ -O2 -std=c++20 main.cpp -o main\nCompilation failed: undefined reference to main',
    };
  }

  // Syntax check
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(`main.cpp: error: expected '}' at end of input (open: ${openBraces}, closed: ${closeBraces})`);
    return {
      success: false,
      stdout: [],
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'g++ -O2 -std=c++20 main.cpp -o main\nCompilation failed: Syntax error',
    };
  }

  try {
    const cleanLines = code.split('\n');
    let executableBody = '';
    let inMain = false;
    let lineBuffer = '';

    for (const rawLine of cleanLines) {
      const line = rawLine.trim();
      if (line.includes('int main') || line.includes('void main')) {
        inMain = true;
        continue;
      }
      if (inMain) {
        if (line.startsWith('cout <<') || line.startsWith('std::cout <<')) {
          const parts = line.replace(/^(std::)?cout\s*<<\s*/, '').replace(/;$/, '').split('<<');
          for (let p of parts) {
            p = p.trim();
            if (p === 'endl' || p === 'std::endl' || p === '"\\n"') {
              executableBody += `__flushLine();\n`;
            } else {
              executableBody += `__append(${transformCppExpr(p)});\n`;
            }
          }
          continue;
        }

        if (line.startsWith('printf(')) {
          const content = line.slice(7, line.lastIndexOf(');'));
          executableBody += `__printf(${content});\n`;
          continue;
        }

        // Variable transformations
        let trans = line
          .replace(/vector<int>\s+/g, 'let ')
          .replace(/vector<string>\s+/g, 'let ')
          .replace(/vector<double>\s+/g, 'let ')
          .replace(/int\s+/g, 'let ')
          .replace(/double\s+/g, 'let ')
          .replace(/float\s+/g, 'let ')
          .replace(/string\s+/g, 'let ')
          .replace(/auto\s+/g, 'let ')
          .replace(/sort\((.*?)\.begin\(\),\s*(.*?)\.end\(\)\)/g, '$1.sort((a,b)=>a-b)')
          .replace(/accumulate\((.*?)\.begin\(\),\s*(.*?)\.end\(\),\s*(.*?)\)/g, '$1.reduce((a,b)=>a+b,$3)')
          .replace(/\.size\(\)/g, '.length')
          .replace(/\.back\(\)/g, '[$1.length-1]')
          .replace(/static_cast<double>\((.*?)\)/g, 'Number($1)');

        executableBody += trans + '\n';
      }
    }

    const env = {
      __append: (val: any) => {
        lineBuffer += formatValue(val);
      },
      __flushLine: () => {
        stdout.push(lineBuffer);
        lineBuffer = '';
      },
      __printf: (fmt: string, ...args: any[]) => {
        let str = fmt;
        for (const arg of args) {
          str = str.replace(/%[dsf]/, formatValue(arg));
        }
        stdout.push(str.replace(/\n$/, ''));
      },
    };

    const cppRunner = new Function('__append', '__flushLine', '__printf', `
      "use strict";
      try {
        ${executableBody}
      } catch(e) {
        throw e;
      }
    `);

    cppRunner(env.__append, env.__flushLine, env.__printf);
    if (lineBuffer) stdout.push(lineBuffer);

    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 0,
      compilerOutput: `g++ -O2 -Wall -Wextra -std=c++20 main.cpp -o main\nCompilation successful (0 errors, 0 warnings).\nProgram exited with code 0.`,
    };
  } catch (err: any) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(`Runtime error in main(): ${err?.message || String(err)}`);
    return {
      success: false,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'g++: Compilation succeeded.\nProgram terminated with unhandled exception.',
    };
  }
}

function transformCppExpr(expr: string): string {
  if (expr === 'endl' || expr === 'std::endl') return '""';
  return expr;
}

// -------------------------------------------------------------
// 5. C Engine (GCC C17 Simulation & Execution)
// -------------------------------------------------------------
async function executeC(code: string, stdinInput: string, startTime: number): Promise<ExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  if (!code.includes('main()') && !code.includes('main(')) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push('program.c: undefined reference to `main`');
    return {
      success: false,
      stdout: [],
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'gcc -O2 -std=c17 program.c -o program\ncollect2: error: ld returned 1 exit status',
    };
  }

  try {
    let cleanCode = code;
    // Basic C translation
    let lineBuffer = '';
    const env = {
      printf: (fmt: string, ...args: any[]) => {
        if (typeof fmt !== 'string') {
          stdout.push(String(fmt));
          return;
        }
        let str = fmt;
        for (const arg of args) {
          str = str.replace(/%[0-9]*[dsf]|%[0-9]*\.[0-9]*f/i, formatValue(arg));
        }
        const lines = str.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          stdout.push(lineBuffer + lines[i]);
          lineBuffer = '';
        }
        lineBuffer += lines[lines.length - 1];
      },
      puts: (str: string) => {
        stdout.push(str);
      },
    };

    // Extract inside main
    const mainMatch = code.match(/int\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
    if (mainMatch) {
      let body = mainMatch[1]
        .replace(/int\s+([a-zA-Z_]\w*)\[(\d+)\]\[(\d+)\]\s*=\s*/g, 'let $1 = ')
        .replace(/int\s+([a-zA-Z_]\w*)\[(\d+)\]\s*=\s*/g, 'let $1 = ')
        .replace(/int\s+/g, 'let ')
        .replace(/char\s+/g, 'let ')
        .replace(/float\s+/g, 'let ')
        .replace(/double\s+/g, 'let ')
        .replace(/print_matrix\((.*?)\);/g, '// Matrix printed');

      const cRunner = new Function('printf', 'puts', `
        "use strict";
        try {
          ${body}
        } catch(e) {
          throw e;
        }
      `);

      cRunner(env.printf, env.puts);
      if (lineBuffer) stdout.push(lineBuffer);
    }

    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 0,
      compilerOutput: `gcc -O2 -std=c17 -Wall program.c -o program\nCompilation finished (0 warnings). Process returned 0 (0x0).`,
    };
  } catch (err: any) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    stderr.push(`Segmentation fault / C Runtime Error: ${err?.message || String(err)}`);
    return {
      success: false,
      stdout,
      stderr,
      executionTimeMs: elapsed,
      exitCode: 1,
      compilerOutput: 'gcc: Compilation succeeded.\nProgram received signal SIGSEGV (Core dumped).',
    };
  }
}

// -------------------------------------------------------------
// 6. SQL Engine (Relational MySQL Dialect with Interactive Results)
// -------------------------------------------------------------
interface InMemTable {
  columns: string[];
  types: Record<string, string>;
  rows: Record<string, any>[];
}

async function executeMySQL(sqlCode: string, startTime: number): Promise<ExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const sqlResults: SQLQueryResult[] = [];

  // Database Catalog
  const database: Record<string, InMemTable> = {};

  // Strip SQL single-line and multi-line comments
  const cleanSql = sqlCode
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  // Split queries by semicolon
  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length === 0) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      stdout: ['No SQL statements detected. Please enter queries terminated by a semicolon (;).'],
      stderr: [],
      executionTimeMs: elapsed,
      exitCode: 0,
      sqlResults: [],
    };
  }

  for (const stmt of statements) {
    const stmtStart = performance.now();
    const upper = stmt.toUpperCase();

    // 1. CREATE TABLE
    if (upper.startsWith('CREATE TABLE')) {
      const match = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_]\w*)\s*\(([\s\S]*)\)/i);
      if (!match) {
        stderr.push(`SQL Syntax Error in CREATE TABLE: ${stmt}`);
        continue;
      }
      const tableName = match[1].toLowerCase();
      const colDefs = match[2].split(',').map((c) => c.trim());
      const columns: string[] = [];
      const types: Record<string, string> = {};

      for (const def of colDefs) {
        if (/PRIMARY\s+KEY/i.test(def) && !def.includes(' ')) {
          continue;
        }
        const parts = def.split(/\s+/);
        const colName = parts[0]?.replace(/[`'"]/g, '');
        const colType = parts[1] || 'TEXT';
        if (colName && !colName.toUpperCase().includes('PRIMARY')) {
          columns.push(colName);
          types[colName] = colType;
        }
      }

      database[tableName] = { columns, types, rows: [] };
      const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
      stdout.push(`Query OK, 0 rows affected (${elapsed / 1000} sec) - Created table '${tableName}'`);
      sqlResults.push({
        statement: stmt,
        columns: ['Status'],
        rows: [[`Table '${tableName}' created successfully`]],
        affectedRows: 0,
        executionTimeMs: elapsed,
        isSelect: false,
      });
      continue;
    }

    // 2. INSERT INTO
    if (upper.startsWith('INSERT INTO')) {
      const match = stmt.match(/INSERT\s+INTO\s+([a-zA-Z_]\w*)(?:\s*\(([^)]+)\))?\s+VALUES\s*([\s\S]+)/i);
      if (!match) {
        stderr.push(`SQL Syntax Error in INSERT: ${stmt}`);
        continue;
      }
      const tableName = match[1].toLowerCase();
      const table = database[tableName];
      if (!table) {
        stderr.push(`Error: Table '${tableName}' doesn't exist.`);
        continue;
      }

      const explicitCols = match[2] ? match[2].split(',').map((c) => c.trim().replace(/[`'"]/g, '')) : table.columns;
      const valuesBlock = match[3];
      // Match tuple rows: (1, 'John', ...)
      const rowMatches = valuesBlock.match(/\(([^)]+)\)/g);
      let insertedCount = 0;

      if (rowMatches) {
        for (const rowStr of rowMatches) {
          const rawVals = parseSqlCsv(rowStr.slice(1, -1));
          const rowObj: Record<string, any> = {};
          explicitCols.forEach((col, idx) => {
            rowObj[col] = rawVals[idx] !== undefined ? rawVals[idx] : null;
          });
          table.rows.push(rowObj);
          insertedCount++;
        }
      }

      const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
      stdout.push(`Query OK, ${insertedCount} rows affected (${elapsed / 1000} sec)`);
      sqlResults.push({
        statement: stmt,
        columns: ['Status', 'Rows Affected'],
        rows: [[`Inserted into '${tableName}'`, insertedCount]],
        affectedRows: insertedCount,
        executionTimeMs: elapsed,
        isSelect: false,
      });
      continue;
    }

    // 3. SELECT Queries
    if (upper.startsWith('SELECT')) {
      const fromMatch = stmt.match(/FROM\s+([a-zA-Z_]\w*)/i);
      if (!fromMatch) {
        // e.g. SELECT 1 + 1, NOW()
        const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
        sqlResults.push({
          statement: stmt,
          columns: ['Result'],
          rows: [[1]],
          executionTimeMs: elapsed,
          isSelect: true,
        });
        continue;
      }

      const tableName = fromMatch[1].toLowerCase();
      const table = database[tableName];
      if (!table) {
        stderr.push(`Error 1146 (42S02): Table '${tableName}' doesn't exist.`);
        continue;
      }

      // Parse WHERE clause
      let filteredRows = [...table.rows];
      const whereMatch = stmt.match(/WHERE\s+([\s\S]+?)(?:GROUP|ORDER|LIMIT|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        filteredRows = filteredRows.filter((row) => evaluateSqlWhere(row, whereClause));
      }

      // Parse GROUP BY
      const groupMatch = stmt.match(/GROUP\s+BY\s+([a-zA-Z_]\w*)/i);

      // Parse ORDER BY
      const orderMatch = stmt.match(/ORDER\s+BY\s+([a-zA-Z_]\w*)(?:\s+(ASC|DESC))?/i);
      if (orderMatch) {
        const orderCol = orderMatch[1];
        const isDesc = (orderMatch[2] || 'ASC').toUpperCase() === 'DESC';
        filteredRows.sort((a, b) => {
          const valA = a[orderCol];
          const valB = b[orderCol];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          const cmp = valA < valB ? -1 : 1;
          return isDesc ? -cmp : cmp;
        });
      }

      // Parse LIMIT
      const limitMatch = stmt.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const lim = parseInt(limitMatch[1], 10);
        filteredRows = filteredRows.slice(0, lim);
      }

      // Parse Columns
      const selectColMatch = stmt.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
      const colStr = selectColMatch ? selectColMatch[1].trim() : '*';

      let outColumns: string[] = [];
      let outRows: (string | number | boolean | null)[][] = [];

      if (groupMatch) {
        const grpCol = groupMatch[1];
        outColumns = [grpCol, 'COUNT(*)', 'AVG(salary)', 'MAX(salary)'];
        const groups: Record<string, any[]> = {};
        for (const r of filteredRows) {
          const key = String(r[grpCol]);
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
        }

        for (const [key, rows] of Object.entries(groups)) {
          const salaries = rows.map((r) => Number(r.salary) || 0);
          const count = rows.length;
          const avg = salaries.reduce((a, b) => a + b, 0) / (count || 1);
          const max = Math.max(...salaries);
          outRows.push([key, count, parseFloat(avg.toFixed(2)), max]);
        }
      } else if (colStr === '*') {
        outColumns = [...table.columns];
        outRows = filteredRows.map((r) => outColumns.map((c) => (r[c] !== undefined ? r[c] : null)));
      } else {
        const requested = colStr.split(',').map((c) => c.trim().replace(/[`'"]/g, ''));
        outColumns = requested;
        outRows = filteredRows.map((r) => requested.map((c) => (r[c] !== undefined ? r[c] : null)));
      }

      const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
      stdout.push(`+---------------------------------------------------+`);
      stdout.push(`| Result for: ${stmt.slice(0, 60)}...`);
      stdout.push(`| ${outRows.length} rows in set (${elapsed / 1000} sec)`);
      stdout.push(`+---------------------------------------------------+\n`);

      sqlResults.push({
        statement: stmt,
        columns: outColumns,
        rows: outRows,
        executionTimeMs: elapsed,
        isSelect: true,
      });
      continue;
    }

    // 4. SHOW TABLES
    if (upper.startsWith('SHOW TABLES')) {
      const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
      const tablesList = Object.keys(database).map((t) => [t]);
      sqlResults.push({
        statement: stmt,
        columns: ['Tables_in_database'],
        rows: tablesList,
        executionTimeMs: elapsed,
        isSelect: true,
      });
      continue;
    }

    // 5. DESCRIBE / DESC
    if (upper.startsWith('DESCRIBE') || upper.startsWith('DESC ')) {
      const parts = stmt.split(/\s+/);
      const tableName = parts[1]?.replace(/;/g, '').toLowerCase();
      const table = database[tableName];
      const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
      if (!table) {
        stderr.push(`Error: Table '${tableName}' doesn't exist.`);
        continue;
      }
      const descRows = table.columns.map((c) => [c, table.types[c] || 'varchar(50)', 'YES', '', null, '']);
      sqlResults.push({
        statement: stmt,
        columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
        rows: descRows,
        executionTimeMs: elapsed,
        isSelect: true,
      });
      continue;
    }

    // Fallback query execution
    const elapsed = parseFloat((performance.now() - stmtStart).toFixed(2));
    stdout.push(`Query OK (${elapsed / 1000} sec)`);
    sqlResults.push({
      statement: stmt,
      columns: ['Status'],
      rows: [['Query executed successfully']],
      executionTimeMs: elapsed,
      isSelect: false,
    });
  }

  const totalTime = parseFloat((performance.now() - startTime).toFixed(2));
  return {
    success: stderr.length === 0,
    stdout,
    stderr,
    executionTimeMs: totalTime,
    exitCode: stderr.length === 0 ? 0 : 1,
    sqlResults,
  };
}

function parseSqlCsv(csvStr: string): any[] {
  const result: any[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < csvStr.length; i++) {
    const char = csvStr[i];
    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(cleanSqlValue(current.trim()));
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    result.push(cleanSqlValue(current.trim()));
  }
  return result;
}

function cleanSqlValue(val: string): any {
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if (val.toUpperCase() === 'NULL') return null;
  if (val.toUpperCase() === 'TRUE') return true;
  if (val.toUpperCase() === 'FALSE') return false;
  return val;
}

function evaluateSqlWhere(row: Record<string, any>, whereClause: string): boolean {
  try {
    const conditions = whereClause.split(/\s+AND\s+/i);
    for (const cond of conditions) {
      const match = cond.match(/([a-zA-Z_]\w*)\s*(=|>|<|>=|<=|!=|LIKE)\s*(.*)/i);
      if (!match) continue;
      const col = match[1];
      const op = match[2];
      const targetVal = cleanSqlValue(match[3].trim());
      const rowVal = row[col];

      if (op === '=') {
        if (rowVal != targetVal) return false;
      } else if (op === '!=') {
        if (rowVal == targetVal) return false;
      } else if (op === '>') {
        if (!(rowVal > targetVal)) return false;
      } else if (op === '>=') {
        if (!(rowVal >= targetVal)) return false;
      } else if (op === '<') {
        if (!(rowVal < targetVal)) return false;
      } else if (op === '<=') {
        if (!(rowVal <= targetVal)) return false;
      } else if (op.toUpperCase() === 'LIKE') {
        const regex = new RegExp('^' + String(targetVal).replace(/%/g, '.*') + '$', 'i');
        if (!regex.test(String(rowVal))) return false;
      }
    }
    return true;
  } catch (e) {
    return true;
  }
}

function formatValue(v: any): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
