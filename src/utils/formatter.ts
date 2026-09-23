/**
 * In-browser Code Formatter Engine.
 * Intelligently formats JavaScript, TypeScript, JSON, CSS, and HTML
 * with customizable indentation, bracket alignment, and clean formatting.
 */

export function formatCode(
  code: string,
  language: string = 'typescript',
  tabSize: number = 2
): string {
  if (!code.trim()) return code;

  if (language === 'json') {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, tabSize) + '\n';
    } catch {
      return code; // return original if syntax error
    }
  }

  const indentStr = ' '.repeat(tabSize);
  const lines = code.split('\n');
  const formattedLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Preserve blank lines
    if (!line) {
      formattedLines.push('');
      continue;
    }

    // Check if line starts with closing brace/bracket/paren
    const startsWithClose = /^(\}|\]|\))/;
    if (startsWithClose.test(line)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Normalizing spaces around operators where safe
    if (language === 'typescript' || language === 'javascript') {
      // Clean spacing after if/for/while/switch
      line = line.replace(/\b(if|for|while|switch|catch)\s*\(/g, '$1 (');
      // Clean spacing around arrows =>
      line = line.replace(/([^\s=])=>/g, '$1 =>').replace(/=>([^\s>])/g, '=> $1');
      // Clean spacing around colons in object/types (except :: or URLs)
      line = line.replace(/([A-Za-z0-9_$]+)\s*:\s*([A-Za-z0-9_$])/g, '$1: $2');
    }

    formattedLines.push(indentStr.repeat(indentLevel) + line);

    // Count opening and closing brackets on this line (excluding within strings/comments)
    let openCount = 0;
    let closeCount = 0;
    let inString: string | null = null;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const prev = line[c - 1];

      if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
        if (!inString) inString = char;
        else if (inString === char) inString = null;
        continue;
      }

      if (inString) continue;

      // Skip line comment
      if (char === '/' && line[c + 1] === '/') break;

      if (char === '{' || char === '[' || char === '(') openCount++;
      if (char === '}' || char === ']' || char === ')') closeCount++;
    }

    // We already decremented indentLevel if line started with close bracket
    const netChange = startsWithClose.test(line)
      ? openCount - (closeCount - 1)
      : openCount - closeCount;

    indentLevel = Math.max(0, indentLevel + netChange);
  }

  return formattedLines.join('\n') + '\n';
}
