import { SymbolItem, ASTNode, SymbolKind } from '../types/ide';

/**
 * Robust in-browser lexical and syntactic analyzer.
 * Extracts symbols and constructs an Abstract Syntax Tree (AST) representation
 * from TypeScript, JavaScript, and Python source code.
 */
export function parseSymbols(code: string, language: string = 'typescript'): SymbolItem[] {
  const lines = code.split('\n');
  const symbols: SymbolItem[] = [];

  let currentClass: SymbolItem | null = null;
  let classIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    // Skip empty lines or comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
      continue;
    }

    const indent = rawLine.search(/\S/);

    // If we were tracking a class and indentation reset or closed brace
    if (currentClass && classIndent >= 0) {
      if ((language === 'python' && indent <= classIndent && trimmed) || (language !== 'python' && trimmed.startsWith('}') && indent <= classIndent)) {
        currentClass.endLine = lineNum;
        currentClass = null;
        classIndent = -1;
      }
    }

    // 1. Interfaces and Types (TypeScript)
    const interfaceMatch = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
    if (interfaceMatch) {
      symbols.push({
        id: `sym-interface-${lineNum}-${interfaceMatch[1]}`,
        name: interfaceMatch[1],
        kind: 'interface',
        line: lineNum,
        col: rawLine.indexOf(interfaceMatch[1]) + 1,
        signature: `interface ${interfaceMatch[1]}`,
        detail: 'TypeScript Interface',
      });
      continue;
    }

    const typeMatch = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*=/);
    if (typeMatch) {
      symbols.push({
        id: `sym-type-${lineNum}-${typeMatch[1]}`,
        name: typeMatch[1],
        kind: 'interface',
        line: lineNum,
        col: rawLine.indexOf(typeMatch[1]) + 1,
        signature: `type ${typeMatch[1]}`,
        detail: 'Type Alias',
      });
      continue;
    }

    // 2. Class Declaration
    const classMatch = trimmed.match(/^(?:export\s+(?:default\s+)?)?class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+([A-Za-z0-9_$.]+))?/);
    if (classMatch) {
      const clsSymbol: SymbolItem = {
        id: `sym-class-${lineNum}-${classMatch[1]}`,
        name: classMatch[1],
        kind: 'class',
        line: lineNum,
        col: rawLine.indexOf(classMatch[1]) + 1,
        signature: `class ${classMatch[1]}${classMatch[2] ? ` extends ${classMatch[2]}` : ''}`,
        detail: classMatch[2] ? `Inherits from ${classMatch[2]}` : 'Class',
        children: [],
      };
      symbols.push(clsSymbol);
      currentClass = clsSymbol;
      classIndent = indent;
      continue;
    }

    // 2b. Python Class
    const pyClassMatch = trimmed.match(/^class\s+([A-Za-z0-9_$]+)(?:\((.*?)\))?:/);
    if (pyClassMatch) {
      const clsSymbol: SymbolItem = {
        id: `sym-pyclass-${lineNum}-${pyClassMatch[1]}`,
        name: pyClassMatch[1],
        kind: 'class',
        line: lineNum,
        col: rawLine.indexOf(pyClassMatch[1]) + 1,
        signature: `class ${pyClassMatch[1]}`,
        detail: pyClassMatch[2] ? `Inherits from ${pyClassMatch[2]}` : 'Python Class',
        children: [],
      };
      symbols.push(clsSymbol);
      currentClass = clsSymbol;
      classIndent = indent;
      continue;
    }

    // 3. Methods inside Class
    if (currentClass) {
      // JS/TS Method: e.g. async get(key: string): Promise<any> {
      const methodMatch = trimmed.match(/^(?:(?:public|private|protected|static|async)\s+)*([A-Za-z0-9_$]+)\s*\((.*?)\)(?:\s*:\s*([^;{]+))?\s*\{/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
        const methodSymbol: SymbolItem = {
          id: `sym-method-${lineNum}-${methodMatch[1]}`,
          name: methodMatch[1],
          kind: 'method',
          line: lineNum,
          col: rawLine.indexOf(methodMatch[1]) + 1,
          signature: `${methodMatch[1]}(${methodMatch[2] || ''})${methodMatch[3] ? `: ${methodMatch[3].trim()}` : ''}`,
          detail: `Method of ${currentClass.name}`,
        };
        currentClass.children?.push(methodSymbol);
        continue;
      }

      // Python def inside class
      const pyMethodMatch = trimmed.match(/^def\s+([A-Za-z0-9_$]+)\s*\((.*?)\):/);
      if (pyMethodMatch) {
        const methodSymbol: SymbolItem = {
          id: `sym-pymethod-${lineNum}-${pyMethodMatch[1]}`,
          name: pyMethodMatch[1],
          kind: 'method',
          line: lineNum,
          col: rawLine.indexOf(pyMethodMatch[1]) + 1,
          signature: `def ${pyMethodMatch[1]}(${pyMethodMatch[2]})`,
          detail: `Method of ${currentClass.name}`,
        };
        currentClass.children?.push(methodSymbol);
        continue;
      }
    }

    // 4. Function Declaration (Standalone)
    // e.g. export async function calculateVelocity(distance: number, time: number): number
    const funcMatch = trimmed.match(/^(?:export\s+(?:default\s+)?)?(?:async\s+)?function(?:\s*\*|\s+)\s*([A-Za-z0-9_$]+)\s*\((.*?)\)(?:\s*:\s*([^;{]+))?/);
    if (funcMatch) {
      symbols.push({
        id: `sym-func-${lineNum}-${funcMatch[1]}`,
        name: funcMatch[1],
        kind: 'function',
        line: lineNum,
        col: rawLine.indexOf(funcMatch[1]) + 1,
        signature: `function ${funcMatch[1]}(${funcMatch[2] || ''})${funcMatch[3] ? `: ${funcMatch[3].trim()}` : ''}`,
        detail: 'Function Declaration',
      });
      continue;
    }

    // 4b. Python Function (Standalone)
    const pyFuncMatch = trimmed.match(/^def\s+([A-Za-z0-9_$]+)\s*\((.*?)\):/);
    if (pyFuncMatch) {
      symbols.push({
        id: `sym-pyfunc-${lineNum}-${pyFuncMatch[1]}`,
        name: pyFuncMatch[1],
        kind: 'function',
        line: lineNum,
        col: rawLine.indexOf(pyFuncMatch[1]) + 1,
        signature: `def ${pyFuncMatch[1]}(${pyFuncMatch[2]})`,
        detail: 'Python Function',
      });
      continue;
    }

    // 5. Arrow Function or Function Expression assigned to const/let/var
    // e.g. const handleRun = async (e: Event) => {
    const arrowMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s+)?(?:\((.*?)\)|([A-Za-z0-9_$]+))\s*(?::\s*([^=>;{]+))?\s*=>/);
    if (arrowMatch) {
      const params = arrowMatch[2] ?? arrowMatch[3] ?? '';
      symbols.push({
        id: `sym-arrow-${lineNum}-${arrowMatch[1]}`,
        name: arrowMatch[1],
        kind: 'function',
        line: lineNum,
        col: rawLine.indexOf(arrowMatch[1]) + 1,
        signature: `const ${arrowMatch[1]} = (${params}) => ...`,
        detail: 'Arrow Function',
      });
      continue;
    }

    // 6. Top-level Constants & Variables
    const varMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)(?:\s*:\s*([^=;]+))?\s*=/);
    if (varMatch && !trimmed.includes('=>') && !trimmed.includes('function')) {
      symbols.push({
        id: `sym-var-${lineNum}-${varMatch[1]}`,
        name: varMatch[1],
        kind: 'variable',
        line: lineNum,
        col: rawLine.indexOf(varMatch[1]) + 1,
        signature: `${varMatch[1]}${varMatch[2] ? `: ${varMatch[2].trim()}` : ''}`,
        detail: 'Variable Declaration',
      });
      continue;
    }

    // 7. Imports
    const importMatch = trimmed.match(/^import\s+(?:\{([^}]+)\}|([A-Za-z0-9_$,\s*]+))\s+from\s+['"](.*?)['"]/);
    if (importMatch) {
      const specifiers = (importMatch[1] || importMatch[2] || '').trim();
      const source = importMatch[3];
      symbols.push({
        id: `sym-import-${lineNum}`,
        name: source,
        kind: 'import',
        line: lineNum,
        col: 1,
        signature: `import { ${specifiers} } from "${source}"`,
        detail: `Imported from ${source}`,
      });
      continue;
    }
  }

  return symbols;
}

/**
 * Builds a structured Abstract Syntax Tree (AST) representing the program's
 * structure for visualization and compilation analysis.
 */
export function buildAST(code: string, language: string = 'typescript'): ASTNode {
  const symbols = parseSymbols(code, language);
  const lines = code.split('\n');

  const rootNode: ASTNode = {
    type: 'Program',
    name: 'root',
    line: 1,
    col: 1,
    kind: language,
    raw: `Source file (${lines.length} lines, ${code.length} bytes)`,
    children: [],
  };

  for (const sym of symbols) {
    let nodeType = 'VariableDeclaration';
    if (sym.kind === 'function') nodeType = 'FunctionDeclaration';
    else if (sym.kind === 'class') nodeType = 'ClassDeclaration';
    else if (sym.kind === 'method') nodeType = 'MethodDefinition';
    else if (sym.kind === 'interface') nodeType = 'TSInterfaceDeclaration';
    else if (sym.kind === 'import') nodeType = 'ImportDeclaration';

    const childNode: ASTNode = {
      type: nodeType,
      name: sym.name,
      line: sym.line,
      col: sym.col,
      kind: sym.kind,
      raw: sym.signature || sym.name,
      children: [],
    };

    if (sym.children && sym.children.length > 0) {
      childNode.children = sym.children.map((sub) => ({
        type: sub.kind === 'method' ? 'MethodDefinition' : 'PropertyDefinition',
        name: sub.name,
        line: sub.line,
        col: sub.col,
        kind: sub.kind,
        raw: sub.signature || sub.name,
      }));
    }

    rootNode.children?.push(childNode);
  }

  return rootNode;
}
