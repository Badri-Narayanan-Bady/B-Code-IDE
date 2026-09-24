export type TokenType =
  | 'keyword-control'
  | 'keyword-decl'
  | 'fn-decl'
  | 'fn-call'
  | 'builtin-fn'
  | 'type'
  | 'decorator'
  | 'string'
  | 'number'
  | 'comment'
  | 'boolean'
  | 'variable'
  | 'property'
  | 'operator'
  | 'punct'
  | 'sql-clause'
  | 'sql-fn'
  | 'plain';

export interface Token {
  type: TokenType;
  text: string;
}

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'method' | 'table';
  line: number; // 1-indexed
  signature: string;
}

// Control flow keywords: VS Code Purple (#C586C0)
const JS_CONTROL_KEYWORDS = new Set([
  'break', 'case', 'catch', 'continue', 'debugger', 'default', 'do', 'else',
  'finally', 'for', 'if', 'return', 'switch', 'throw', 'try', 'while', 'with',
  'yield', 'await'
]);

// Declaration / storage / structural keywords: VS Code Blue (#569CD6)
const JS_DECL_KEYWORDS = new Set([
  'class', 'const', 'delete', 'export', 'extends', 'function', 'import', 'in',
  'instanceof', 'new', 'super', 'this', 'typeof', 'var', 'void', 'async',
  'from', 'as', 'let', 'static', 'interface', 'type', 'enum', 'implements',
  'public', 'private', 'protected', 'readonly', 'of'
]);

const JS_BUILTIN_FNS = new Set([
  'console', 'log', 'warn', 'error', 'info', 'table', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite', 'encodeURI', 'decodeURI', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'fetch', 'Math', 'JSON', 'Object', 'Array',
  'String', 'Number', 'Boolean', 'Map', 'Set', 'Promise', 'Date', 'RegExp',
  'Symbol', 'Error', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice',
  'map', 'filter', 'reduce', 'forEach', 'find', 'includes', 'indexOf', 'join'
]);

const PYTHON_CONTROL_KEYWORDS = new Set([
  'break', 'continue', 'elif', 'else', 'except', 'finally', 'for', 'if',
  'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'match', 'case'
]);

const PYTHON_DECL_KEYWORDS = new Set([
  'and', 'as', 'assert', 'class', 'def', 'del', 'from', 'global', 'import',
  'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'async', 'await'
]);

const PYTHON_BUILTIN_FNS = new Set([
  'print', 'len', 'range', 'input', 'int', 'str', 'float', 'list', 'dict',
  'set', 'tuple', 'bool', 'type', 'sum', 'min', 'max', 'abs', 'round',
  'enumerate', 'zip', 'sorted', 'reversed', 'map', 'filter', 'all', 'any',
  'isinstance', 'issubclass', 'id', 'open', 'help', 'dir', 'vars', 'format',
  'append', 'extend', 'insert', 'remove', 'pop', 'clear', 'index', 'count',
  'keys', 'values', 'items', 'get', 'update', 'split', 'strip', 'replace'
]);

const JAVA_CONTROL_KEYWORDS = new Set([
  'break', 'case', 'catch', 'continue', 'default', 'do', 'else', 'finally',
  'for', 'goto', 'if', 'return', 'switch', 'synchronized', 'throw', 'throws',
  'try', 'while', 'yield'
]);

const JAVA_DECL_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'byte', 'char', 'class', 'const', 'double',
  'enum', 'extends', 'final', 'float', 'implements', 'import', 'instanceof',
  'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected',
  'public', 'short', 'static', 'strictfp', 'super', 'this', 'transient', 'void',
  'volatile', 'record', 'var', 'sealed', 'permits', 'non-sealed'
]);

const JAVA_BUILTIN_FNS = new Set([
  'System', 'out', 'in', 'err', 'println', 'print', 'printf', 'Scanner',
  'String', 'Integer', 'Double', 'Boolean', 'Math', 'Arrays', 'Collections',
  'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet', 'StringBuilder',
  'nextInt', 'nextLine', 'nextDouble', 'hasNext', 'length', 'charAt', 'substring',
  'equals', 'hashCode', 'toString', 'add', 'get', 'set', 'remove', 'size'
]);

const CPP_CONTROL_KEYWORDS = new Set([
  'break', 'case', 'catch', 'continue', 'default', 'do', 'else', 'for',
  'goto', 'if', 'return', 'switch', 'throw', 'try', 'while', 'co_await',
  'co_return', 'co_yield'
]);

const CPP_DECL_KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit',
  'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'char', 'char8_t',
  'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const', 'consteval',
  'constexpr', 'constinit', 'const_cast', 'decltype', 'delete', 'double',
  'dynamic_cast', 'enum', 'explicit', 'export', 'extern', 'float', 'friend',
  'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not',
  'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected',
  'public', 'reflexpr', 'register', 'reinterpret_cast', 'requires', 'short',
  'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct',
  'template', 'this', 'thread_local', 'typedef', 'typeid', 'typename',
  'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t',
  'xor', 'xor_eq'
]);

const CPP_BUILTIN_FNS = new Set([
  'std', 'cout', 'cin', 'endl', 'cerr', 'vector', 'string', 'map', 'set',
  'pair', 'queue', 'stack', 'priority_queue', 'sort', 'min', 'max', 'swap',
  'push_back', 'emplace_back', 'size', 'empty', 'begin', 'end', 'printf',
  'scanf', 'malloc', 'free', 'strlen', 'strcpy', 'memcpy', 'memset', 'abs',
  'sqrt', 'pow'
]);

const SQL_CLAUSES = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS',
  'ON', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'DROP', 'ALTER', 'SHOW', 'TABLES', 'DESCRIBE', 'DESC', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'INDEX', 'UNION', 'ALL', 'AS', 'DISTINCT', 'AND',
  'OR', 'NOT', 'NULL', 'LIKE', 'IN', 'BETWEEN', 'EXISTS', 'IS', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'DEFAULT', 'AUTO_INCREMENT'
]);

const SQL_TYPES = new Set([
  'INT', 'INTEGER', 'VARCHAR', 'CHAR', 'TEXT', 'DECIMAL', 'NUMERIC', 'FLOAT',
  'DOUBLE', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'BOOLEAN', 'BLOB'
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NOW', 'CURDATE', 'CURTIME',
  'DATEDIFF', 'CONCAT', 'ROUND', 'FLOOR', 'CEIL', 'ABS', 'UPPER', 'LOWER',
  'LENGTH', 'SUBSTRING', 'TRIM', 'GROUP_CONCAT', 'IFNULL', 'DATE_FORMAT'
]);

export function tokenizeLine(line: string, language: string = 'javascript'): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;
  const lang = language.toLowerCase();

  // Helper to look ahead past whitespace
  const getNextNonWhitespace = (startIdx: number): string => {
    let p = startIdx;
    while (p < len && (line[p] === ' ' || line[p] === '\t')) p++;
    return p < len ? line[p] : '';
  };

  // Helper to get previous non-whitespace token
  const getLastTokenType = (): TokenType | null => {
    for (let k = tokens.length - 1; k >= 0; k--) {
      if (tokens[k].text.trim() !== '') return tokens[k].type;
    }
    return null;
  };

  while (i < len) {
    const char = line[i];

    // Single-line Comments
    if ((lang === 'javascript' || lang === 'java' || lang === 'cpp' || lang === 'c') && char === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    if (lang === 'python' && char === '#') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }
    if (lang === 'sql' && char === '-' && line[i + 1] === '-') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }

    // Decorators / Annotations (@name in Python, Java, JS)
    if (char === '@' && /[a-zA-Z_]/.test(line[i + 1] || '')) {
      let dec = '@';
      i++;
      while (i < len && /[a-zA-Z0-9_.]/.test(line[i])) {
        dec += line[i];
        i++;
      }
      tokens.push({ type: 'decorator', text: dec });
      continue;
    }

    // C/C++ Preprocessor Directives (#include, #define)
    if ((lang === 'cpp' || lang === 'c') && char === '#' && line.substring(i).trimStart().startsWith('#')) {
      let prep = '';
      while (i < len) {
        prep += line[i];
        i++;
      }
      tokens.push({ type: 'keyword-decl', text: prep });
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

    // Identifiers, Keywords, Functions, Types
    if (/[a-zA-Z_$]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i];
        i++;
      }

      const nextChar = getNextNonWhitespace(i);
      const isCall = nextChar === '(';
      const lastToken = getLastTokenType();
      const prevWasDecl = lastToken === 'keyword-decl' || lastToken === 'type';

      // 1. Python
      if (lang === 'python') {
        if (PYTHON_CONTROL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-control', text: word });
        } else if (PYTHON_DECL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-decl', text: word });
        } else if (word === 'True' || word === 'False' || word === 'None') {
          tokens.push({ type: 'boolean', text: word });
        } else if (PYTHON_BUILTIN_FNS.has(word)) {
          tokens.push({ type: isCall ? 'builtin-fn' : 'variable', text: word });
        } else if (prevWasDecl && (tokens.some(t => t.text === 'def') || isCall)) {
          tokens.push({ type: 'fn-decl', text: word });
        } else if (isCall) {
          tokens.push({ type: 'fn-call', text: word });
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
          tokens.push({ type: 'type', text: word });
        } else if (tokens.length > 0 && tokens[tokens.length - 1].text === '.') {
          tokens.push({ type: 'property', text: word });
        } else {
          tokens.push({ type: 'variable', text: word });
        }
        continue;
      }

      // 2. JavaScript
      if (lang === 'javascript') {
        if (JS_CONTROL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-control', text: word });
        } else if (JS_DECL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-decl', text: word });
        } else if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined' || word === 'NaN') {
          tokens.push({ type: 'boolean', text: word });
        } else if (JS_BUILTIN_FNS.has(word)) {
          tokens.push({ type: isCall ? 'builtin-fn' : 'type', text: word });
        } else if (prevWasDecl && (tokens.some(t => t.text === 'function') || isCall)) {
          tokens.push({ type: 'fn-decl', text: word });
        } else if (isCall) {
          tokens.push({ type: 'fn-call', text: word });
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
          tokens.push({ type: 'type', text: word });
        } else if (tokens.length > 0 && tokens[tokens.length - 1].text === '.') {
          tokens.push({ type: 'property', text: word });
        } else {
          tokens.push({ type: 'variable', text: word });
        }
        continue;
      }

      // 3. Java
      if (lang === 'java') {
        if (JAVA_CONTROL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-control', text: word });
        } else if (JAVA_DECL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-decl', text: word });
        } else if (word === 'true' || word === 'false' || word === 'null') {
          tokens.push({ type: 'boolean', text: word });
        } else if (JAVA_BUILTIN_FNS.has(word)) {
          tokens.push({ type: isCall ? 'builtin-fn' : 'type', text: word });
        } else if (isCall) {
          tokens.push({ type: 'fn-call', text: word });
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
          tokens.push({ type: 'type', text: word });
        } else if (tokens.length > 0 && tokens[tokens.length - 1].text === '.') {
          tokens.push({ type: 'property', text: word });
        } else {
          tokens.push({ type: 'variable', text: word });
        }
        continue;
      }

      // 4. C & C++
      if (lang === 'cpp' || lang === 'c') {
        if (CPP_CONTROL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-control', text: word });
        } else if (CPP_DECL_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword-decl', text: word });
        } else if (word === 'true' || word === 'false' || word === 'NULL' || word === 'nullptr') {
          tokens.push({ type: 'boolean', text: word });
        } else if (CPP_BUILTIN_FNS.has(word)) {
          tokens.push({ type: isCall ? 'builtin-fn' : 'variable', text: word });
        } else if (isCall) {
          tokens.push({ type: 'fn-call', text: word });
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
          tokens.push({ type: 'type', text: word });
        } else {
          tokens.push({ type: 'variable', text: word });
        }
        continue;
      }

      // 5. SQL (MySQL)
      if (lang === 'sql') {
        const upper = word.toUpperCase();
        if (SQL_FUNCTIONS.has(upper)) {
          tokens.push({ type: 'sql-fn', text: word });
        } else if (SQL_CLAUSES.has(upper)) {
          tokens.push({ type: 'sql-clause', text: word });
        } else if (SQL_TYPES.has(upper)) {
          tokens.push({ type: 'type', text: word });
        } else if (upper === 'TRUE' || upper === 'FALSE' || upper === 'NULL') {
          tokens.push({ type: 'boolean', text: word });
        } else if (isCall) {
          tokens.push({ type: 'sql-fn', text: word });
        } else {
          tokens.push({ type: 'variable', text: word });
        }
        continue;
      }

      tokens.push({ type: 'plain', text: word });
      continue;
    }

    // Punctuations and operators
    if (/[=+\-*/%&|^!<>?:;.,{}()[\]]/.test(char)) {
      // Check multi-character operators: ==, ===, !=, !==, <=, >=, &&, ||, ->, =>, ::
      const two = line.substring(i, i + 2);
      const three = line.substring(i, i + 3);
      if (three === '===' || three === '!==') {
        tokens.push({ type: 'operator', text: three });
        i += 3;
        continue;
      }
      if (['==', '!=', '<=', '>=', '&&', '||', '->', '=>', '::', '++', '--', '+=', '-=', '*=', '/='].includes(two)) {
        tokens.push({ type: 'operator', text: two });
        i += 2;
        continue;
      }

      if (/[=+\-*/%&|^!<>?]/.test(char)) {
        tokens.push({ type: 'operator', text: char });
      } else {
        tokens.push({ type: 'punct', text: char });
      }
      i++;
      continue;
    }

    // Whitespace
    tokens.push({ type: 'plain', text: char });
    i++;
  }

  return tokens;
}

// Maps token types to exact VS Code Dark+ color palette classes and hex colors
export const TOKEN_COLOR_MAP: Record<TokenType, { color: string; label: string; twClass: string }> = {
  'keyword-control': {
    color: '#C586C0', // VS Code Purple
    label: 'Control Keyword',
    twClass: 'text-[#C586C0] font-medium',
  },
  'keyword-decl': {
    color: '#569CD6', // VS Code Blue
    label: 'Declaration Keyword',
    twClass: 'text-[#569CD6] font-medium',
  },
  'fn-decl': {
    color: '#DCDCAA', // VS Code Signature Gold
    label: 'Function Definition',
    twClass: 'text-[#DCDCAA] font-semibold',
  },
  'fn-call': {
    color: '#DCDCAA', // VS Code Signature Gold
    label: 'Function Call',
    twClass: 'text-[#DCDCAA]',
  },
  'builtin-fn': {
    color: '#4EC9B0', // Teal / Gold
    label: 'Built-in Function',
    twClass: 'text-[#4EC9B0] font-medium',
  },
  'type': {
    color: '#4EC9B0', // VS Code Teal
    label: 'Class / Type',
    twClass: 'text-[#4EC9B0]',
  },
  'decorator': {
    color: '#DCDCAA', // Gold
    label: 'Decorator / Annotation',
    twClass: 'text-[#DCDCAA] italic',
  },
  'string': {
    color: '#CE9178', // VS Code Terracotta
    label: 'String Literal',
    twClass: 'text-[#CE9178]',
  },
  'number': {
    color: '#B5CEA8', // VS Code Mint Green
    label: 'Numeric Literal',
    twClass: 'text-[#B5CEA8]',
  },
  'comment': {
    color: '#6A9955', // VS Code Olive Green
    label: 'Comment',
    twClass: 'text-[#6A9955] italic',
  },
  'boolean': {
    color: '#569CD6', // VS Code Blue
    label: 'Boolean / Null',
    twClass: 'text-[#569CD6]',
  },
  'variable': {
    color: '#9CDCFE', // VS Code Sky Blue
    label: 'Identifier / Variable',
    twClass: 'text-[#9CDCFE]',
  },
  'property': {
    color: '#9CDCFE', // VS Code Light Blue
    label: 'Object Property',
    twClass: 'text-[#9CDCFE]',
  },
  'operator': {
    color: '#D4D4D4', // Crisp Gray
    label: 'Operator',
    twClass: 'text-[#D4D4D4]',
  },
  'punct': {
    color: '#808080', // Delimiter Gray
    label: 'Punctuation',
    twClass: 'text-neutral-400',
  },
  'sql-clause': {
    color: '#569CD6', // SQL Keyword Blue
    label: 'SQL Clause',
    twClass: 'text-[#569CD6] font-bold tracking-wide',
  },
  'sql-fn': {
    color: '#DCDCAA', // SQL Function Gold
    label: 'SQL Aggregate Function',
    twClass: 'text-[#DCDCAA] font-semibold',
  },
  'plain': {
    color: '#D4D4D4',
    label: 'Text',
    twClass: 'text-[#D4D4D4]',
  },
};

/**
 * Extracts top-level and class-level functions/methods and classes from code
 * for the VS Code Breadcrumbs and Quick Symbol Picker.
 */
export function extractCodeSymbols(code: string, language: string): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  const lines = code.split('\n');
  const lang = language.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
      continue;
    }

    const lineNum = i + 1;

    // Python
    if (lang === 'python') {
      const fnMatch = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/);
      if (fnMatch) {
        symbols.push({
          name: fnMatch[1],
          kind: rawLine.startsWith(' ') || rawLine.startsWith('\t') ? 'method' : 'function',
          line: lineNum,
          signature: `def ${fnMatch[1]}(${fnMatch[2]})`,
        });
        continue;
      }
      const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)(?:\((.*?)\))?:/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          line: lineNum,
          signature: `class ${classMatch[1]}`,
        });
        continue;
      }
    }

    // JavaScript
    if (lang === 'javascript') {
      const fnMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/);
      if (fnMatch) {
        symbols.push({
          name: fnMatch[1],
          kind: 'function',
          line: lineNum,
          signature: `function ${fnMatch[1]}(${fnMatch[2]})`,
        });
        continue;
      }
      const arrowMatch = trimmed.match(/^(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>/);
      if (arrowMatch) {
        symbols.push({
          name: arrowMatch[1],
          kind: 'function',
          line: lineNum,
          signature: `const ${arrowMatch[1]} = (${arrowMatch[2]}) =>`,
        });
        continue;
      }
      const classMatch = trimmed.match(/^(?:export\s+)?class\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          line: lineNum,
          signature: `class ${classMatch[1]}`,
        });
        continue;
      }
    }

    // Java, C, C++
    if (lang === 'java' || lang === 'cpp' || lang === 'c') {
      const classMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:final\s+)?class\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          line: lineNum,
          signature: `class ${classMatch[1]}`,
        });
        continue;
      }

      // Method / Function
      const methodMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+|static\s+|virtual\s+|inline\s+)*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*(?:const)?\s*\{?/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[2])) {
        symbols.push({
          name: methodMatch[2],
          kind: 'function',
          line: lineNum,
          signature: `${methodMatch[1]} ${methodMatch[2]}(${methodMatch[3]})`,
        });
        continue;
      }
    }

    // SQL
    if (lang === 'sql') {
      const tableMatch = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (tableMatch) {
        symbols.push({
          name: tableMatch[1],
          kind: 'table',
          line: lineNum,
          signature: `TABLE ${tableMatch[1]}`,
        });
        continue;
      }
    }
  }

  return symbols;
}

/**
 * Finds the nearest enclosing function or class symbol for the current cursor line
 */
export function getActiveSymbolForLine(symbols: CodeSymbol[], currentLine: number): CodeSymbol | null {
  if (symbols.length === 0) return null;
  let active: CodeSymbol | null = null;
  for (const sym of symbols) {
    if (sym.line <= currentLine) {
      active = sym;
    } else {
      break;
    }
  }
  return active;
}

