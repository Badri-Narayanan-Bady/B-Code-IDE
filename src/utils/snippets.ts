import { AutoCompleteItem } from '../types/ide';

export const GENERAL_SNIPPETS: AutoCompleteItem[] = [
  {
    label: 'clg',
    kind: 'snippet',
    detail: 'console.log(...)',
    insertText: 'console.log($1);',
    documentation: 'Logs output to the integrated B Code terminal/console',
  },
  {
    label: 'fn',
    kind: 'snippet',
    detail: 'function name(...) { ... }',
    insertText: 'function name(args) {\n  \n}',
    documentation: 'Standard function declaration',
  },
  {
    label: 'afn',
    kind: 'snippet',
    detail: 'const name = async (...) => { ... }',
    insertText: 'const name = async () => {\n  \n};',
    documentation: 'Async arrow function',
  },
  {
    label: 'useState',
    kind: 'snippet',
    detail: 'const [state, setState] = useState(initial)',
    insertText: 'const [state, setState] = useState($1);',
    documentation: 'React useState Hook',
  },
  {
    label: 'useEffect',
    kind: 'snippet',
    detail: 'useEffect(() => { ... }, [])',
    insertText: 'useEffect(() => {\n  $1\n}, []);',
    documentation: 'React useEffect Hook for lifecycle and side effects',
  },
  {
    label: 'trycatch',
    kind: 'snippet',
    detail: 'try { ... } catch (err) { ... }',
    insertText: 'try {\n  $1\n} catch (error) {\n  console.error(error);\n}',
    documentation: 'Try-catch block',
  },
  {
    label: 'forloop',
    kind: 'snippet',
    detail: 'for (let i = 0; i < len; i++) { ... }',
    insertText: 'for (let i = 0; i < array.length; i++) {\n  $1\n}',
    documentation: 'Standard for loop',
  },
  {
    label: 'fetchAsync',
    kind: 'snippet',
    detail: 'const res = await fetch(...)',
    insertText: 'const response = await fetch(url);\nconst data = await response.json();',
    documentation: 'Fetch JSON from an API endpoint',
  },
  {
    label: 'importReact',
    kind: 'snippet',
    detail: 'import React from "react"',
    insertText: 'import React, { useState, useEffect } from "react";',
    documentation: 'Import React and standard hooks',
  },
  {
    label: 'def',
    kind: 'snippet',
    detail: 'def function_name(...):',
    insertText: 'def function_name(arg):\n    return arg',
    documentation: 'Python function definition',
  },
];

export const JS_KEYWORDS_AUTO: AutoCompleteItem[] = [
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
  'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
  'with', 'yield', 'interface', 'type', 'enum', 'implements', 'true', 'false', 'null'
].map(k => ({
  label: k,
  kind: 'keyword',
  detail: `keyword ${k}`,
  insertText: k,
}));

export const COMMON_APIS: AutoCompleteItem[] = [
  { label: 'document.getElementById', kind: 'function', detail: 'DOM selector', insertText: "document.getElementById('')" },
  { label: 'document.querySelector', kind: 'function', detail: 'DOM query', insertText: "document.querySelector('')" },
  { label: 'addEventListener', kind: 'function', detail: 'Event listener', insertText: "addEventListener('click', (e) => {})" },
  { label: 'JSON.stringify', kind: 'function', detail: 'Convert to JSON', insertText: 'JSON.stringify(obj, null, 2)' },
  { label: 'JSON.parse', kind: 'function', detail: 'Parse JSON string', insertText: 'JSON.parse(str)' },
  { label: 'Math.floor', kind: 'function', detail: 'Floor number', insertText: 'Math.floor()' },
  { label: 'Math.random', kind: 'function', detail: 'Random float [0, 1)', insertText: 'Math.random()' },
  { label: 'Object.keys', kind: 'function', detail: 'Get object keys', insertText: 'Object.keys(obj)' },
  { label: 'Promise.all', kind: 'function', detail: 'Await multiple promises', insertText: 'Promise.all([])' },
  { label: 'setTimeout', kind: 'function', detail: 'Timer callback', insertText: 'setTimeout(() => {}, 1000);' },
  { label: 'setInterval', kind: 'function', detail: 'Interval callback', insertText: 'setInterval(() => {}, 1000);' },
];

export function getCompletions(currentWord: string, language: string = 'javascript'): AutoCompleteItem[] {
  if (!currentWord) return [];
  const lower = currentWord.toLowerCase();

  const all = [...GENERAL_SNIPPETS, ...JS_KEYWORDS_AUTO, ...COMMON_APIS];
  return all.filter(item => item.label.toLowerCase().startsWith(lower)).slice(0, 8);
}
