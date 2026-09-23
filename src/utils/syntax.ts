export interface Token {
  type: 'keyword' | 'fn' | 'string' | 'number' | 'comment' | 'tag' | 'type' | 'punct' | 'operator' | 'variable' | 'boolean' | 'plain';
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
  'while', 'with', 'yield', 'True', 'False', 'None'
]);

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'var'
]);

const CPP_KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit',
  'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch',
  'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const',
  'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
  'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double',
  'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float',
  'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
  'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq',
  'private', 'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast',
  'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
  'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw',
  'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using',
  'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq', 'cout', 'cin', 'endl'
]);

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'TABLE', 'DROP', 'ALTER', 'SHOW', 'TABLES', 'DESCRIBE', 'DESC',
  'PRIMARY', 'KEY', 'INT', 'INTEGER', 'VARCHAR', 'DECIMAL', 'TEXT', 'DATETIME',
  'DATE', 'TIME', 'TIMESTAMP', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
  'ON', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'HAVING',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AND', 'OR', 'NOT', 'NULL', 'LIKE', 'IN',
  'BETWEEN', 'EXISTS', 'AS', 'DISTINCT', 'UNION', 'ALL', 'CASE', 'WHEN', 'THEN',
  'ELSE', 'END', 'DEFAULT', 'AUTO_INCREMENT', 'FOREIGN', 'REFERENCES', 'INDEX'
]);

export function tokenizeLine(line: string, language: string = 'javascript'): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  const lang = language.toLowerCase();

  while (i < len) {
    const char = line[i];

    // Comments
    // JS, Java, C, C++: //
    if ((lang === 'javascript' || lang === 'java' || lang === 'cpp' || lang === 'c') && char === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    // Python: #
    if (lang === 'python' && char === '#') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    // SQL: --
    if (lang === 'sql' && char === '-' && line[i + 1] === '-') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    // C/C++ Preprocessor #include
    if ((lang === 'cpp' || lang === 'c') && char === '#' && line.substring(i).startsWith('#include')) {
      tokens.push({ type: 'keyword', text: line.substring(i) });
      break;
    }

    // Strings
    if (char === '"' || char === "'" || (lang === 'javascript' && char === '`')) {
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

    // Identifiers & Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i];
        i++;
      }

      let isKeyword = false;
      if (lang === 'javascript' && JS_KEYWORDS.has(word)) isKeyword = true;
      else if (lang === 'python' && PYTHON_KEYWORDS.has(word)) isKeyword = true;
      else if (lang === 'java' && JAVA_KEYWORDS.has(word)) isKeyword = true;
      else if ((lang === 'cpp' || lang === 'c') && (CPP_KEYWORDS.has(word) || JAVA_KEYWORDS.has(word))) isKeyword = true;
      else if (lang === 'sql' && SQL_KEYWORDS.has(word.toUpperCase())) isKeyword = true;

      if (isKeyword) {
        tokens.push({ type: 'keyword', text: word });
      } else if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined') {
        tokens.push({ type: 'boolean', text: word });
      } else if (i < len && line[i] === '(') {
        tokens.push({ type: 'fn', text: word });
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    // Punctuations and operators
    if (/[=+\-*/%&|^!<>?:;.,{}()[\]]/.test(char)) {
      tokens.push({ type: 'punct', text: char });
      i++;
      continue;
    }

    // Whitespace
    tokens.push({ type: 'plain', text: char });
    i++;
  }

  return tokens;
}
