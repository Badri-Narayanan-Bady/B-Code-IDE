import { Diagnostic } from '../types/ide';

export function runDiagnostics(code: string, language: string = 'javascript', fileName: string = ''): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = code.split('\n');

  // JSON Validation
  if (language === 'json' || fileName.endsWith('.json')) {
    try {
      JSON.parse(code);
    } catch (e: any) {
      const match = e.message.match(/position (\d+)/);
      let line = 1;
      let col = 1;
      if (match) {
        const pos = parseInt(match[1], 10);
        let count = 0;
        for (let i = 0; i < lines.length; i++) {
          if (count + lines[i].length + 1 >= pos) {
            line = i + 1;
            col = Math.max(1, pos - count);
            break;
          }
          count += lines[i].length + 1;
        }
      }
      diagnostics.push({
        id: `json-err-${line}-${col}`,
        line,
        column: col,
        message: `JSON Syntax Error: ${e.message}`,
        severity: 'error',
        source: 'JSON Parser',
      });
    }
    return diagnostics;
  }

  // Bracket & Paren Matching Stack
  const bracketStack: { char: string; line: number; col: number }[] = [];
  const matchingPairs: Record<string, string> = { '}': '{', ')': '(', ']': '[' };

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    // Check for console.log statements as an 'info' or warning diagnostic
    const consoleMatch = line.indexOf('console.log');
    if (consoleMatch !== -1 && !line.trim().startsWith('//')) {
      diagnostics.push({
        id: `diag-console-${lineNum}`,
        line: lineNum,
        column: consoleMatch + 1,
        length: 11,
        message: 'Unexpected console statement in production code',
        severity: 'info',
        source: 'Linter',
      });
    }

    // Check unclosed quotes or strings on single line (non-template literal)
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '/' && line[c + 1] === '/' && !inSingleQuote && !inDoubleQuote) {
        break; // Ignore rest of comment
      }
      if (ch === "'" && !inDoubleQuote && !escaped) {
        inSingleQuote = !inSingleQuote;
      } else if (ch === '"' && !inSingleQuote && !escaped) {
        inDoubleQuote = !inDoubleQuote;
      }
      escaped = ch === '\\' && !escaped;

      // Track brackets if not in string
      if (!inSingleQuote && !inDoubleQuote) {
        if (ch === '{' || ch === '(' || ch === '[') {
          bracketStack.push({ char: ch, line: lineNum, col: c + 1 });
        } else if (ch === '}' || ch === ')' || ch === ']') {
          const expected = matchingPairs[ch];
          if (bracketStack.length === 0) {
            diagnostics.push({
              id: `diag-unmatched-close-${lineNum}-${c}`,
              line: lineNum,
              column: c + 1,
              message: `Unmatched closing bracket '${ch}'`,
              severity: 'error',
              source: 'Syntax Check',
            });
          } else {
            const top = bracketStack.pop()!;
            if (top.char !== expected) {
              diagnostics.push({
                id: `diag-mismatch-${lineNum}-${c}`,
                line: lineNum,
                column: c + 1,
                message: `Mismatched bracket: expected closing for '${top.char}' from line ${top.line}, but found '${ch}'`,
                severity: 'error',
                source: 'Syntax Check',
              });
            }
          }
        }
      }
    }

    if (inSingleQuote) {
      diagnostics.push({
        id: `diag-unclosed-single-${lineNum}`,
        line: lineNum,
        column: line.length,
        message: "Unclosed single quote string literal",
        severity: 'error',
        source: 'Syntax Check',
      });
    }
    if (inDoubleQuote) {
      diagnostics.push({
        id: `diag-unclosed-double-${lineNum}`,
        line: lineNum,
        column: line.length,
        message: 'Unclosed double quote string literal',
        severity: 'error',
        source: 'Syntax Check',
      });
    }

    // Check for 'var' keyword usage
    const varMatch = line.search(/\bvar\s+/);
    if (varMatch !== -1 && !line.trim().startsWith('//')) {
      diagnostics.push({
        id: `diag-var-${lineNum}`,
        line: lineNum,
        column: varMatch + 1,
        length: 3,
        message: "Unexpected 'var', use 'let' or 'const' instead",
        severity: 'warning',
        source: 'ESLint',
      });
    }

    // Check for 'debugger' statement
    const dbgMatch = line.search(/\bdebugger\b/);
    if (dbgMatch !== -1 && !line.trim().startsWith('//')) {
      diagnostics.push({
        id: `diag-dbg-${lineNum}`,
        line: lineNum,
        column: dbgMatch + 1,
        length: 8,
        message: "Unexpected 'debugger' statement in code",
        severity: 'warning',
        source: 'ESLint',
      });
    }
  }

  // Any remaining open brackets
  while (bracketStack.length > 0) {
    const unclosed = bracketStack.pop()!;
    diagnostics.push({
      id: `diag-unclosed-open-${unclosed.line}-${unclosed.col}`,
      line: unclosed.line,
      column: unclosed.col,
      message: `Unclosed bracket '${unclosed.char}' opened here`,
      severity: 'error',
      source: 'Syntax Check',
    });
  }

  return diagnostics;
}
