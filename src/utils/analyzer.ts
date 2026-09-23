import {
  CodeAnalysisResult,
  ComplexityBreakdown,
  FunctionComplexity,
  ExecutionTimeEstimate,
  RiskLevel,
  SupportedLanguage,
} from '../types/ide';

interface TokenizedCode {
  cleanCode: string;
  lines: string[];
  tokens: string[];
}

/**
 * Pre-processes code by stripping string literals and comments
 * to prevent false positives when searching for control-flow tokens.
 */
function stripCommentsAndStrings(code: string, language: SupportedLanguage): TokenizedCode {
  let clean = '';
  let inString: string | null = null;
  let inMultiComment = false;
  let inSingleComment = false;
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const nextChar = i + 1 < code.length ? code[i + 1] : '';

    // Handle comments
    if (!inString) {
      if (!inMultiComment && !inSingleComment) {
        if (char === '/' && nextChar === '*' && language !== 'python' && language !== 'sql') {
          inMultiComment = true;
          clean += '  ';
          i += 2;
          continue;
        }
        if (char === '/' && nextChar === '/' && language !== 'python' && language !== 'sql') {
          inSingleComment = true;
          clean += '  ';
          i += 2;
          continue;
        }
        if (char === '#' && language === 'python') {
          inSingleComment = true;
          clean += ' ';
          i += 1;
          continue;
        }
        if (char === '-' && nextChar === '-' && language === 'sql') {
          inSingleComment = true;
          clean += '  ';
          i += 2;
          continue;
        }
      } else if (inSingleComment) {
        if (char === '\n') {
          inSingleComment = false;
          clean += '\n';
        } else {
          clean += ' ';
        }
        i++;
        continue;
      } else if (inMultiComment) {
        if (char === '*' && nextChar === '/') {
          inMultiComment = false;
          clean += '  ';
          i += 2;
          continue;
        }
        clean += char === '\n' ? '\n' : ' ';
        i++;
        continue;
      }
    }

    // Handle string literals
    if (!inMultiComment && !inSingleComment) {
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = char;
        clean += ' ';
        i++;
        continue;
      } else if (inString && char === inString && code[i - 1] !== '\\') {
        inString = null;
        clean += ' ';
        i++;
        continue;
      } else if (inString) {
        clean += char === '\n' ? '\n' : ' ';
        i++;
        continue;
      }
    }

    clean += char;
    i++;
  }

  const lines = clean.split('\n');
  const tokens = clean
    .split(/[\s,;{}()[\]+\-*/%=<>!&|^~?:.]+/)
    .filter((t) => t.trim().length > 0);

  return { cleanCode: clean, lines, tokens };
}

/**
 * Determine risk level based on cyclomatic complexity
 */
function getRiskLevel(score: number): RiskLevel {
  if (score <= 5) return 'low';
  if (score <= 10) return 'moderate';
  if (score <= 20) return 'high';
  return 'critical';
}

/**
 * Calculates Halstead Volume and Maintainability Index
 */
function calculateMaintainability(
  linesOfCode: number,
  cyclomaticComplexity: number,
  tokens: string[]
): { volume: number; maintainabilityIndex: number; label: 'High' | 'Moderate' | 'Low' } {
  if (linesOfCode <= 0 || tokens.length === 0) {
    return { volume: 0, maintainabilityIndex: 100, label: 'High' };
  }

  const uniqueTokens = new Set(tokens);
  const N = tokens.length; // Total operators/operands
  const n = Math.max(1, uniqueTokens.size); // Vocabulary
  const volume = Math.round(N * Math.log2(n));

  // SEI Maintainability Index formula (scaled 0-100)
  // MI = 171 - 5.2 * ln(V) - 0.23 * M - 16.2 * ln(LOC)
  const lnV = Math.log(Math.max(1, volume));
  const lnLOC = Math.log(Math.max(1, linesOfCode));
  const rawMI = 171 - 5.2 * lnV - 0.23 * cyclomaticComplexity - 16.2 * lnLOC;
  const scaledMI = Math.max(0, Math.min(100, Math.round((rawMI * 100) / 171)));

  let label: 'High' | 'Moderate' | 'Low' = 'High';
  if (scaledMI < 65) label = 'Low';
  else if (scaledMI < 85) label = 'Moderate';

  return { volume, maintainabilityIndex: scaledMI, label };
}

/**
 * Identifies functions and methods across supported programming languages
 */
function extractFunctions(
  code: string,
  language: SupportedLanguage
): { name: string; startLine: number; endLine: number; params: number; codeBody: string }[] {
  const lines = code.split('\n');
  const results: { name: string; startLine: number; endLine: number; params: number; codeBody: string }[] = [];

  if (language === 'python') {
    const pyDefRegex = /^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):/;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(pyDefRegex);
      if (match) {
        const indentLevel = match[1].length;
        const fnName = match[2];
        const params = match[3].split(',').filter((p) => p.trim().length > 0).length;
        const startLine = i + 1;
        let endLine = lines.length;

        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.trim().length > 0) {
            const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
            if (nextIndent <= indentLevel && !nextLine.trim().startsWith('#')) {
              endLine = j;
              break;
            }
          }
        }

        const codeBody = lines.slice(startLine - 1, endLine).join('\n');
        results.push({ name: fnName, startLine, endLine, params, codeBody });
      }
    }
  } else if (language === 'javascript') {
    // Matches: function name(...), const name = (...)=>{}, name(...) {}
    const jsFuncRegex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>)\s*\{?/g;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      while ((match = jsFuncRegex.exec(line)) !== null) {
        const fnName = match[1] || match[2] || 'anonymous';
        const startLine = i + 1;
        let endLine = Math.min(lines.length, startLine + 15);

        // Find closing brace matching
        let braceCount = 0;
        let foundOpen = false;
        for (let j = i; j < lines.length; j++) {
          const l = lines[j];
          for (const ch of l) {
            if (ch === '{') {
              braceCount++;
              foundOpen = true;
            } else if (ch === '}') {
              braceCount--;
              if (foundOpen && braceCount === 0) {
                endLine = j + 1;
                break;
              }
            }
          }
          if (foundOpen && braceCount === 0) break;
        }

        const codeBody = lines.slice(startLine - 1, endLine).join('\n');
        results.push({ name: fnName, startLine, endLine, params: 1, codeBody });
      }
    }
  } else if (language === 'java' || language === 'cpp' || language === 'c') {
    // Matches methods / functions like: int add(int a, int b) { or void main()
    const funcRegex = /^\s*(?:(?:public|private|protected|static|final|native|synchronized|virtual|inline)\s+)*([a-zA-Z0-9_<>[\]*&]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:const)?\s*\{?/;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(funcRegex);
      if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[2])) {
        const fnName = match[2];
        const params = match[3].split(',').filter((p) => p.trim().length > 0).length;
        const startLine = i + 1;
        let endLine = Math.min(lines.length, startLine + 20);

        let braceCount = 0;
        let foundOpen = false;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') {
              braceCount++;
              foundOpen = true;
            } else if (ch === '}') {
              braceCount--;
              if (foundOpen && braceCount === 0) {
                endLine = j + 1;
                break;
              }
            }
          }
          if (foundOpen && braceCount === 0) break;
        }

        const codeBody = lines.slice(startLine - 1, endLine).join('\n');
        results.push({ name: fnName, startLine, endLine, params, codeBody });
      }
    }
  } else if (language === 'sql') {
    // Treat distinct statements/queries as analysis blocks
    const queries = code.split(/;\s*$/m).filter((q) => q.trim().length > 0);
    let curLine = 1;
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      const qLines = q.split('\n');
      const firstWord = q.trim().split(/\s+/)[0].toUpperCase();
      results.push({
        name: `${firstWord} Query #${i + 1}`,
        startLine: curLine,
        endLine: curLine + qLines.length - 1,
        params: 0,
        codeBody: q,
      });
      curLine += qLines.length;
    }
  }

  return results;
}

/**
 * Compute Cyclomatic Complexity & Breakdown for a block of code
 */
function analyzeComplexityBreakdown(cleanCode: string, language: SupportedLanguage): {
  complexity: number;
  breakdown: ComplexityBreakdown;
  cognitive: number;
} {
  let branches = 0;
  let loops = 0;
  let logicalOps = 0;
  let ternaryOps = 0;
  let exceptions = 0;
  let sqlClauses = 0;
  let cognitive = 0;

  const lines = cleanCode.split('\n');
  let currentNesting = 0;

  if (language === 'sql') {
    const uppercase = cleanCode.toUpperCase();
    const whereCount = (uppercase.match(/\bWHERE\b/g) || []).length;
    const havingCount = (uppercase.match(/\bHAVING\b/g) || []).length;
    const joinCount = (uppercase.match(/\bJOIN\b/g) || []).length;
    const unionCount = (uppercase.match(/\bUNION\b/g) || []).length;
    const caseCount = (uppercase.match(/\bCASE\b/g) || []).length;
    const andCount = (uppercase.match(/\bAND\b/g) || []).length;
    const orCount = (uppercase.match(/\bOR\b/g) || []).length;

    sqlClauses = whereCount + havingCount + joinCount + unionCount + caseCount;
    logicalOps = andCount + orCount;
    branches = caseCount;

    const totalDecisionPoints = sqlClauses + logicalOps;
    return {
      complexity: Math.max(1, 1 + totalDecisionPoints),
      breakdown: { branches, loops, logicalOps, ternaryOps, exceptions, sqlClauses },
      cognitive: Math.round(totalDecisionPoints * 1.2),
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Track Nesting Level
    if (language === 'python') {
      const rawLine = cleanCode.split('\n')[i];
      const indent = rawLine.search(/\S/);
      if (indent !== -1) {
        currentNesting = Math.floor(indent / 4);
      }
    } else {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      if (closeBraces > openBraces) {
        currentNesting = Math.max(0, currentNesting - (closeBraces - openBraces));
      }
    }

    // 1. Branches: if, else if, elif, switch/case
    let lineBranches = 0;
    if (language === 'python') {
      if (/\bif\b/.test(line)) lineBranches++;
      if (/\belif\b/.test(line)) lineBranches++;
      if (/\bcase\s+[^:]+:/.test(line)) lineBranches++;
    } else {
      if (/\bif\s*\(/.test(line)) lineBranches++;
      if (/\belse\s+if\s*\(/.test(line)) lineBranches++;
      if (/\bcase\s+[^:]+:/.test(line)) lineBranches++;
    }
    branches += lineBranches;
    if (lineBranches > 0) {
      cognitive += 1 + currentNesting;
    }

    // 2. Loops: for, while, do
    let lineLoops = 0;
    if (/\bfor\b/.test(line)) lineLoops++;
    if (/\bwhile\b/.test(line)) lineLoops++;
    if (/\bdo\s*\{/.test(line)) lineLoops++;
    // Python list comprehension loops
    if (language === 'python' && /\[.*?\bfor\b.*?\]/.test(line)) lineLoops++;

    loops += lineLoops;
    if (lineLoops > 0) {
      cognitive += 1 + currentNesting;
    }

    // 3. Logical Operators: &&, ||, and, or
    let lineLogical = 0;
    if (language === 'python') {
      lineLogical += (line.match(/\band\b/g) || []).length;
      lineLogical += (line.match(/\bor\b/g) || []).length;
    } else {
      lineLogical += (line.match(/&&/g) || []).length;
      lineLogical += (line.match(/\|\|/g) || []).length;
    }
    logicalOps += lineLogical;
    cognitive += lineLogical;

    // 4. Ternary Operator: ? :
    let lineTernary = 0;
    if (language !== 'python') {
      // Look for ternary operator '?' not inside type annotations
      const qMatches = (line.match(/\?[^:?]+\:/g) || []).length;
      lineTernary += qMatches;
    } else {
      // Python inline if-else ternary: x if cond else y
      if (/\bif\b.*\belse\b/.test(line)) {
        lineTernary += 1;
      }
    }
    ternaryOps += lineTernary;
    if (lineTernary > 0) {
      cognitive += 1 + currentNesting;
    }

    // 5. Exception handling: catch, except
    let lineExceptions = 0;
    if (language === 'python') {
      if (/\bexcept\b/.test(line)) lineExceptions++;
    } else {
      if (/\bcatch\s*\(/.test(line)) lineExceptions++;
    }
    exceptions += lineExceptions;
    if (lineExceptions > 0) {
      cognitive += 1 + currentNesting;
    }

    // Adjust brace nesting forward for C/Java/JS
    if (language !== 'python') {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        currentNesting += openBraces - closeBraces;
      }
    }
  }

  const decisionPoints = branches + loops + logicalOps + ternaryOps + exceptions;
  const complexity = Math.max(1, 1 + decisionPoints);

  return {
    complexity,
    breakdown: { branches, loops, logicalOps, ternaryOps, exceptions, sqlClauses },
    cognitive: Math.max(0, cognitive),
  };
}

/**
 * Calculates Estimated Execution Time & Big-O Asymptotic Complexity
 */
function estimateExecutionTime(
  cleanCode: string,
  rawCode: string,
  language: SupportedLanguage,
  functions: { name: string; codeBody: string }[]
): ExecutionTimeEstimate {
  // 1. Detect Maximum Loop Nesting Depth
  let maxLoopDepth = 0;
  let currentLoopDepth = 0;
  const lines = cleanCode.split('\n');

  if (language === 'python') {
    const loopIndents: number[] = [];
    for (const line of lines) {
      const indent = line.search(/\S/);
      if (indent === -1) continue;

      // Pop indents that have finished
      while (loopIndents.length > 0 && indent <= loopIndents[loopIndents.length - 1]) {
        loopIndents.pop();
      }

      if (/^\s*(for|while)\b/.test(line)) {
        loopIndents.push(indent);
        if (loopIndents.length > maxLoopDepth) {
          maxLoopDepth = loopIndents.length;
        }
      }
    }
  } else if (language === 'sql') {
    maxLoopDepth = 0;
  } else {
    // Brace-based loop depth
    const loopStack: number[] = [];
    let currentBraceLevel = 0;

    for (const line of lines) {
      if (/\b(for|while|do)\b/.test(line)) {
        loopStack.push(currentBraceLevel);
        if (loopStack.length > maxLoopDepth) {
          maxLoopDepth = loopStack.length;
        }
      }

      for (const ch of line) {
        if (ch === '{') currentBraceLevel++;
        else if (ch === '}') {
          currentBraceLevel--;
          while (loopStack.length > 0 && loopStack[loopStack.length - 1] >= currentBraceLevel) {
            loopStack.pop();
          }
        }
      }
    }
  }

  // 2. Detect Recursive Calls
  let recursiveCallsDetected = false;
  let recursiveBranchCount = 0;

  for (const fn of functions) {
    if (fn.name === 'main' || fn.name === 'anonymous') continue;
    // Check if function name is invoked inside its own body
    const callRegex = new RegExp(`\\b${fn.name}\\s*\\(`, 'g');
    const matches = fn.codeBody.match(callRegex);
    if (matches && matches.length > 1) {
      recursiveCallsDetected = true;
      if (matches.length >= 3) {
        // e.g. fib(n-1) + fib(n-2) -> exponential branching!
        recursiveBranchCount = Math.max(recursiveBranchCount, matches.length - 1);
      }
    }
  }

  // 3. Detect Logarithmic patterns (divide-and-conquer, binary search, / 2, >> 1)
  const hasDividePattern =
    /\/\/\s*2|\/\s*2|>>\s*1|\bbisect\b|\bbinary_search\b|\bsort\s*\(/.test(cleanCode);

  // 4. SQL Profiling
  let sqlProfile: ExecutionTimeEstimate['sqlProfile'];
  if (language === 'sql') {
    const uppercase = cleanCode.toUpperCase();
    const tableScans = (uppercase.match(/\bFROM\b/g) || []).length;
    const joins = (uppercase.match(/\bJOIN\b/g) || []).length;
    const sortOperations = (uppercase.match(/\bORDER BY\b|\bGROUP BY\b/g) || []).length;
    sqlProfile = { tableScans, joins, sortOperations };
  }

  // 5. Determine Asymptotic Big-O
  let asymptoticNotation = 'O(1)';
  let asymptoticLabel = 'Constant Time';
  let estimatedDurationMs = 0.02;
  let durationRange = '< 0.05 ms';
  let category: ExecutionTimeEstimate['category'] = 'instant';
  let estimatedOpsSmall = '~10 - 50 ops (N=100)';
  let estimatedOpsMedium = '~10 - 50 ops (N=10k)';
  let estimatedOpsLarge = '~10 - 50 ops (N=100k)';

  if (recursiveCallsDetected && recursiveBranchCount >= 2) {
    asymptoticNotation = 'O(2^N)';
    asymptoticLabel = 'Exponential Growth (Tree Recursion)';
    estimatedDurationMs = 1200;
    durationRange = '> 1,000 ms (N ≥ 35)';
    category = 'slow';
    estimatedOpsSmall = '> 10^30 operations';
    estimatedOpsMedium = 'Stack Overflow / Hang';
    estimatedOpsLarge = 'Uncomputable';
  } else if (maxLoopDepth >= 3) {
    asymptoticNotation = 'O(N³)';
    asymptoticLabel = 'Cubic Polynomial Time';
    estimatedDurationMs = 850;
    durationRange = '500 - 2,500 ms';
    category = 'slow';
    estimatedOpsSmall = '~1,000,000 ops (N=100)';
    estimatedOpsMedium = '~10¹² ops (N=10k)';
    estimatedOpsLarge = '~10¹⁵ ops (N=100k)';
  } else if (maxLoopDepth === 2) {
    asymptoticNotation = 'O(N²)';
    asymptoticLabel = 'Quadratic Time (Nested Loops)';
    estimatedDurationMs = 45;
    durationRange = '25 - 90 ms';
    category = 'moderate';
    estimatedOpsSmall = '~10,000 ops (N=100)';
    estimatedOpsMedium = '~100M ops (N=10k)';
    estimatedOpsLarge = '~10B ops (N=100k)';
  } else if (maxLoopDepth === 1) {
    if (hasDividePattern) {
      asymptoticNotation = 'O(N log N)';
      asymptoticLabel = 'Linearithmic Time';
      estimatedDurationMs = 2.4;
      durationRange = '1 - 5 ms';
      category = 'fast';
      estimatedOpsSmall = '~660 ops (N=100)';
      estimatedOpsMedium = '~133,000 ops (N=10k)';
      estimatedOpsLarge = '~1,660,000 ops (N=100k)';
    } else {
      asymptoticNotation = 'O(N)';
      asymptoticLabel = 'Linear Time';
      estimatedDurationMs = 0.35;
      durationRange = '0.2 - 0.8 ms';
      category = 'fast';
      estimatedOpsSmall = '~100 ops (N=100)';
      estimatedOpsMedium = '~10,000 ops (N=10k)';
      estimatedOpsLarge = '~100,000 ops (N=100k)';
    }
  } else if (hasDividePattern) {
    asymptoticNotation = 'O(log N)';
    asymptoticLabel = 'Logarithmic Time (Divide & Conquer)';
    estimatedDurationMs = 0.05;
    durationRange = '< 0.1 ms';
    category = 'instant';
    estimatedOpsSmall = '~7 ops (N=100)';
    estimatedOpsMedium = '~14 ops (N=10k)';
    estimatedOpsLarge = '~17 ops (N=100k)';
  } else if (language === 'sql' && sqlProfile) {
    if (sqlProfile.joins > 1 || sqlProfile.sortOperations > 0) {
      asymptoticNotation = 'O(N log N)';
      asymptoticLabel = 'Indexed Scan & Relational Sort';
      estimatedDurationMs = 3.8;
      durationRange = '2 - 10 ms';
      category = 'fast';
      estimatedOpsSmall = '~500 records';
      estimatedOpsMedium = '~50k records';
      estimatedOpsLarge = '~500k records';
    } else {
      asymptoticNotation = 'O(N)';
      asymptoticLabel = 'Linear Table Scan';
      estimatedDurationMs = 0.8;
      durationRange = '0.5 - 2 ms';
      category = 'fast';
      estimatedOpsSmall = '~100 rows';
      estimatedOpsMedium = '~10k rows';
      estimatedOpsLarge = '~100k rows';
    }
  }

  // 6. Latency Breakdown (Hardware simulation on modern 3.2GHz processor)
  // Estimated proportions
  const totalNs = estimatedDurationMs * 1_000_000;
  const cpuCyclesNs = Math.round(totalNs * 0.65);
  const memoryAccessNs = Math.round(totalNs * 0.25);
  const ioLatencyNs = Math.round(totalNs * 0.1);

  return {
    asymptoticNotation,
    asymptoticLabel,
    estimatedDurationMs,
    durationRange,
    category,
    maxLoopDepth,
    recursiveCallsDetected,
    estimatedOpsSmall,
    estimatedOpsMedium,
    estimatedOpsLarge,
    latencyBreakdown: { cpuCyclesNs, memoryAccessNs, ioLatencyNs },
    sqlProfile,
  };
}

/**
 * Generate actionable refactoring and performance recommendations
 */
function generateRecommendations(
  totalComplexity: number,
  maintainabilityIndex: number,
  breakdown: ComplexityBreakdown,
  functions: FunctionComplexity[],
  estimate: ExecutionTimeEstimate,
  language: SupportedLanguage
): string[] {
  const recommendations: string[] = [];

  // Cyclomatic complexity guidance
  if (totalComplexity > 20) {
    recommendations.push(
      'High Cyclomatic Complexity (>20): Decompose large monolithic blocks into single-responsibility sub-functions to increase testability and reduce defect likelihood.'
    );
  } else if (totalComplexity > 10) {
    recommendations.push(
      'Moderate Cyclomatic Complexity (11-20): Consider using Guard Clauses (early returns) to flatten nested conditional paths.'
    );
  }

  // Big-O and Loop nesting
  if (estimate.maxLoopDepth >= 2) {
    recommendations.push(
      `Nested Loop Detected (${estimate.asymptoticNotation}): Quadratic or higher time complexity. Investigate if inner search can be replaced with a Hash Map (O(1) lookup) or binary search.`
    );
  }

  // Recursive hazard
  if (estimate.recursiveCallsDetected && estimate.asymptoticNotation === 'O(2^N)') {
    recommendations.push(
      'Exponential Recursion Detected: Multiple self-calls detected without memoization. Apply Dynamic Programming (memoization or tabulation) to achieve O(N) runtime.'
    );
  }

  // Maintainability Index
  if (maintainabilityIndex < 65) {
    recommendations.push(
      'Low Maintainability Index (<65): Code exhibits high token density and long conditional spans. Modularize into helper modules and add documentation.'
    );
  }

  // Functions with excessive complexity
  const highRiskFns = functions.filter((f) => f.cyclomaticComplexity > 10);
  if (highRiskFns.length > 0) {
    const names = highRiskFns.map((f) => `"${f.name}" (M=${f.cyclomaticComplexity})`).join(', ');
    recommendations.push(
      `Refactor functions with excessive branching: ${names}. Split decision branches or apply the Strategy Pattern.`
    );
  }

  // SQL specific
  if (language === 'sql') {
    if (breakdown.sqlClauses > 5) {
      recommendations.push(
        'Complex SQL Query: Multiple joins and subqueries detected. Ensure suitable composite indexes exist on join foreign keys and WHERE filter clauses.'
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Excellent Code Health: Low cyclomatic complexity, optimal Big-O bounds, and clean control-flow structure. Ready for production.'
    );
  }

  return recommendations;
}

/**
 * Main Static Analysis Orchestrator
 */
export function analyzeCode(code: string, language: SupportedLanguage): CodeAnalysisResult {
  const rawLines = code.split('\n');
  const linesOfCode = rawLines.filter((l) => l.trim().length > 0).length;
  const blankLines = rawLines.filter((l) => l.trim().length === 0).length;

  // Count comment lines
  let commentLines = 0;
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (language === 'python' && trimmed.startsWith('#')) commentLines++;
    else if (language === 'sql' && (trimmed.startsWith('--') || trimmed.startsWith('/*'))) commentLines++;
    else if ((language === 'javascript' || language === 'java' || language === 'cpp' || language === 'c') &&
             (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))) {
      commentLines++;
    }
  }

  // Tokenize & Clean
  const { cleanCode, tokens } = stripCommentsAndStrings(code, language);

  // Analyze Total Complexity
  const { complexity: totalComplexity, breakdown, cognitive } = analyzeComplexityBreakdown(
    cleanCode,
    language
  );

  const risk = getRiskLevel(totalComplexity);

  // Extract Functions and analyze each
  const rawFunctions = extractFunctions(code, language);
  const functions: FunctionComplexity[] = rawFunctions.map((fn) => {
    const fnClean = stripCommentsAndStrings(fn.codeBody, language).cleanCode;
    const { complexity: fnComplexity, cognitive: fnCognitive } = analyzeComplexityBreakdown(
      fnClean,
      language
    );
    const fnLines = fn.codeBody.split('\n').filter((l) => l.trim().length > 0).length;
    const fnRisk = getRiskLevel(fnComplexity);

    let suggestion: string | undefined;
    if (fnComplexity > 15) {
      suggestion = 'Split function into smaller helper methods';
    } else if (fnComplexity > 8) {
      suggestion = 'Use early return / guard clauses';
    }

    return {
      name: fn.name,
      startLine: fn.startLine,
      endLine: fn.endLine,
      loc: fnLines,
      cyclomaticComplexity: fnComplexity,
      cognitiveComplexity: fnCognitive,
      risk: fnRisk,
      parameterCount: fn.params,
      suggestion,
    };
  });

  // Calculate Maintainability Index
  const { volume, maintainabilityIndex, label: maintainabilityLabel } = calculateMaintainability(
    linesOfCode,
    totalComplexity,
    tokens
  );

  // Estimated Execution Time & Big-O
  const executionEstimate = estimateExecutionTime(cleanCode, code, language, rawFunctions);

  // Recommendations
  const recommendations = generateRecommendations(
    totalComplexity,
    maintainabilityIndex,
    breakdown,
    functions,
    executionEstimate,
    language
  );

  return {
    totalCyclomaticComplexity: totalComplexity,
    risk,
    cognitiveComplexity: cognitive,
    maintainabilityIndex,
    maintainabilityLabel,
    halsteadVolume: volume,
    linesOfCode,
    commentLines,
    blankLines,
    breakdown,
    functions,
    executionEstimate,
    recommendations,
  };
}
