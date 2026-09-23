export interface Token {
  type: 'keyword' | 'fn' | 'string' | 'number' | 'comment' | 'tag' | 'attr' | 'type' | 'punct' | 'operator' | 'variable' | 'boolean' | 'plain';
  text: string;
}

const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'async', 'await', 'from', 'as', 'let', 'static', 'interface', 'type', 'enum',
  'implements', 'public', 'private', 'protected', 'readonly'
]);

const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif',
  'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in',
  'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield'
]);

export function tokenizeLine(line: string, language: string = 'javascript'): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  if (language === 'markdown') {
    if (line.startsWith('#')) {
      tokens.push({ type: 'type', text: line });
      return tokens;
    }
    if (line.startsWith('>')) {
      tokens.push({ type: 'string', text: line });
      return tokens;
    }
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line)) {
      tokens.push({ type: 'keyword', text: line.substring(0, 2) });
      tokens.push({ type: 'plain', text: line.substring(2) });
      return tokens;
    }
  }

  while (i < len) {
    const char = line[i];

    // Comments
    if (char === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    if (language === 'python' && char === '#') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    if (line.startsWith('<!--', i)) {
      const end = line.indexOf('-->', i);
      const text = end === -1 ? line.substring(i) : line.substring(i, end + 3);
      tokens.push({ type: 'comment', text });
      i += text.length;
      continue;
    }

    // Strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let str = quote;
      let j = i + 1;
      let escaped = false;
      while (j < len) {
        const c = line[j];
        str += c;
        if (c === quote && !escaped) {
          j++;
          break;
        }
        escaped = c === '\\' && !escaped;
        j++;
      }
      tokens.push({ type: 'string', text: str });
      i = j;
      continue;
    }

    // Numbers
    if (/\d/.test(char) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      let num = '';
      while (i < len && /[\d._xXa-fA-F]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ type: 'number', text: num });
      continue;
    }

    // HTML / JSX tags
    if ((language === 'html' || language === 'typescript' || language === 'javascript') && char === '<') {
      if (line[i + 1] === '/' || /[a-zA-Z]/.test(line[i + 1])) {
        let tag = '<';
        i++;
        if (line[i] === '/') {
          tag += '/';
          i++;
        }
        while (i < len && /[a-zA-Z0-9_-]/.test(line[i])) {
          tag += line[i];
          i++;
        }
        tokens.push({ type: 'tag', text: tag });
        continue;
      }
    }

    // Words / Identifiers
    if (/[a-zA-Z_$]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Check keyword / boolean / function call
      if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined' || word === 'None' || word === 'True' || word === 'False') {
        tokens.push({ type: 'boolean', text: word });
      } else if (language === 'python' ? PYTHON_KEYWORDS.has(word) : JS_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (i < len && line[i] === '(') {
        tokens.push({ type: 'fn', text: word });
      } else if (word[0] === word[0].toUpperCase() && /[a-z]/.test(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        tokens.push({ type: 'variable', text: word });
      }
      continue;
    }

    // Operators & Punctuation
    if (/[=+\-*/%&|^!~?:<>.]/.test(char)) {
      tokens.push({ type: 'operator', text: char });
      i++;
      continue;
    }

    if (/[{}()[\];,]/.test(char)) {
      tokens.push({ type: 'punct', text: char });
      i++;
      continue;
    }

    // Whitespace or plain character
    tokens.push({ type: 'plain', text: char });
    i++;
  }

  return tokens;
}
