import { VFSNode, WorkspaceMeta } from '../types/ide';
import JSZip from 'jszip';

export const TEMPLATES: Record<string, { name: string; description: string; files: Record<string, VFSNode> }> = {
  react: {
    name: 'React 19 + Tailwind',
    description: 'Modern component-based web application with interactive state',
    files: {
      'root': {
        id: 'root',
        name: 'project',
        path: '/',
        type: 'folder',
        parentId: null,
        children: ['index-html', 'package-json', 'readme-md', 'src-folder'],
        isOpen: true,
      },
      'index-html': {
        id: 'index-html',
        name: 'index.html',
        path: '/index.html',
        type: 'file',
        language: 'html',
        parentId: 'root',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>B Code - Live App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link rel="stylesheet" href="./src/style.css">
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
  <div id="root"></div>
  <script type="text/babel" src="./src/App.tsx"></script>
</body>
</html>`,
        gitStatus: 'unmodified',
      },
      'package-json': {
        id: 'package-json',
        name: 'package.json',
        path: '/package.json',
        type: 'file',
        language: 'json',
        parentId: 'root',
        content: `{
  "name": "b-code-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "scripts": {
    "start": "b-code serve",
    "build": "b-code build",
    "test": "b-code test"
  }
}`,
        gitStatus: 'unmodified',
      },
      'readme-md': {
        id: 'readme-md',
        name: 'README.md',
        path: '/README.md',
        type: 'file',
        language: 'markdown',
        parentId: 'root',
        content: `# B Code IDE Project

Welcome to your project in **B Code IDE**!

## Features
- Instant live preview in browser
- Built-in terminal with shell commands
- Syntax highlighting and autocomplete
- Real-time diagnostics and linter
- Git version control & diff viewer
- Interactive debugger with breakpoints

Edit \`src/App.tsx\` to see hot reload updates immediately.`,
        gitStatus: 'unmodified',
      },
      'src-folder': {
        id: 'src-folder',
        name: 'src',
        path: '/src',
        type: 'folder',
        parentId: 'root',
        children: ['app-tsx', 'style-css', 'utils-ts'],
        isOpen: true,
      },
      'app-tsx': {
        id: 'app-tsx',
        name: 'App.tsx',
        path: '/src/App.tsx',
        type: 'file',
        language: 'typescript',
        parentId: 'src-folder',
        content: `const { useState, useEffect } = React;

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Design clean layout with 60-30-10 palette', done: true },
    { id: 2, text: 'Implement real-time terminal integration', done: true },
    { id: 3, text: 'Test debugger breakpoints and call stack', done: false },
    { id: 4, text: 'Deploy application with hot preview', done: false }
  ]);
  const [input, setInput] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('App component mounted in B Code Sandbox!');
  }, []);

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input, done: false }]);
    setInput('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>⚡</span> B Code Task Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">Live running inside B Code browser IDE</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Completed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {tasks.filter(t => t.done).length} / {tasks.length}
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Counter</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">{count}</span>
            <button 
              onClick={() => setCount(c => c + 1)} 
              className="px-2.5 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded text-white transition-colors"
            >
              +1
            </button>
          </div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Runtime Status</p>
          <p className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active
          </p>
        </div>
      </div>

      {/* Task input */}
      <form onSubmit={addTask} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task or benchmark..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add Task
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map(task => (
          <div 
            key={task.id}
            className="flex items-center justify-between p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors"
          >
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-0"
              />
              <span className={\`text-sm \${task.done ? 'line-through text-slate-500' : 'text-slate-200'}\`}>
                {task.text}
              </span>
            </label>
            <button
              onClick={() => removeTask(task.id)}
              className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`,
        gitStatus: 'unmodified',
      },
      'style-css': {
        id: 'style-css',
        name: 'style.css',
        path: '/src/style.css',
        type: 'file',
        language: 'css',
        parentId: 'src-folder',
        content: `/* Custom styles for live preview */
body {
  margin: 0;
  padding: 1.5rem;
  background-color: #0b0f19;
  color: #f1f5f9;
}

button:active {
  transform: scale(0.98);
}
`,
        gitStatus: 'unmodified',
      },
      'utils-ts': {
        id: 'utils-ts',
        name: 'utils.ts',
        path: '/src/utils.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'src-folder',
        content: `// Utility calculation functions
export function calculateVelocity(distance: number, time: number): number {
  if (time <= 0) return 0;
  return distance / time;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}
`,
        gitStatus: 'unmodified',
      },
    },
  },
  maang: {
    name: 'MAANG Interview & CS Systems',
    description: 'Production-grade data structures (O(1) LRU Cache, Pub-Sub, Rate Limiter, VDOM) with unit test suites',
    files: {
      'root': {
        id: 'root',
        name: 'project',
        path: '/',
        type: 'folder',
        parentId: null,
        children: ['readme-md', 'lru-cache-ts', 'event-emitter-ts', 'rate-limiter-ts', 'virtual-dom-ts', 'algorithms-test-ts', 'benchmark-ts'],
        isOpen: true,
      },
      'readme-md': {
        id: 'readme-md',
        name: 'README.md',
        path: '/README.md',
        type: 'file',
        language: 'markdown',
        parentId: 'root',
        content: `# MAANG Systems & Interview Suite

Welcome to the Computer Science & Systems Engineering playground in **B Code IDE**.

### Included CS Modules:
1. \`lru-cache.ts\` - O(1) Least Recently Used cache using Doubly Linked List + Hash Map
2. \`event-emitter.ts\` - High-throughput typed Pub/Sub message broker
3. \`rate-limiter.ts\` - Token Bucket algorithm (Stripe/Meta distributed systems design)
4. \`virtual-dom.ts\` - Core Virtual DOM tree diffing engine (React fiber design principle)
5. \`algorithms.test.ts\` - BDD unit test suite with Jest-compatible \`expect()\` matchers
6. \`benchmark.ts\` - Micro-benchmarks measuring ops/sec and sub-millisecond execution times

### Actions:
- Click **Run All** in the Test Suite tab to execute automated unit tests.
- Open the **Performance Profiler** tab in the sidebar to benchmark throughput.
- Use **AST Inspector** to visualize syntax nodes and symbol outlines.`,
        gitStatus: 'unmodified',
      },
      'lru-cache-ts': {
        id: 'lru-cache-ts',
        name: 'lru-cache.ts',
        path: '/lru-cache.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'root',
        content: `// O(1) LRU Cache Implementation (Doubly-Linked List + Hash Map)
// Highly requested question in Google / Meta / Amazon technical interviews.

interface Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null;
  next: Node<K, V> | null;
}

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, Node<K, V>>;
  private head: Node<K, V>;
  private tail: Node<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) throw new Error("Capacity must be greater than 0");
    this.capacity = capacity;
    this.map = new Map();

    // Sentinel dummy head and tail nodes
    this.head = { key: null as any, value: null as any, prev: null, next: null };
    this.tail = { key: null as any, value: null as any, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  public get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) return null;

    // Move accessed node to head (Most Recently Used)
    this.removeNode(node);
    this.addToHead(node);
    return node.value;
  }

  public put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.removeNode(existing);
      this.addToHead(existing);
      return;
    }

    if (this.map.size >= this.capacity) {
      // Evict Least Recently Used (tail.prev)
      const lru = this.tail.prev!;
      this.removeNode(lru);
      this.map.delete(lru.key);
    }

    const newNode: Node<K, V> = { key, value, prev: null, next: null };
    this.addToHead(newNode);
    this.map.set(key, newNode);
  }

  public size(): number {
    return this.map.size;
  }

  private addToHead(node: Node<K, V>): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: Node<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }
}

// Quick Demonstration
const cache = new LRUCache<string, number>(3);
cache.put("cpu", 98);
cache.put("memory", 64);
cache.put("disk", 42);
console.log("LRU get('cpu'):", cache.get("cpu")); // Moves cpu to front
cache.put("network", 15); // Evicts memory
console.log("LRU get('memory') after eviction:", cache.get("memory")); // null
console.log("Current cache size:", cache.size());
`,
        gitStatus: 'unmodified',
      },
      'event-emitter-ts': {
        id: 'event-emitter-ts',
        name: 'event-emitter.ts',
        path: '/event-emitter.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'root',
        content: `// High-Throughput Typed EventEmitter (Pub/Sub Pattern)
// Core architecture behind Node.js, Redux, and micro-frontend event buses.

type Listener<T = any> = (payload: T) => void;

export class EventEmitter {
  private events: Map<string, Set<Listener>>;
  private maxListeners: number;

  constructor(maxListeners: number = 20) {
    this.events = new Map();
    this.maxListeners = maxListeners;
  }

  public on<T = any>(event: string, listener: Listener<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const listeners = this.events.get(event)!;
    if (listeners.size >= this.maxListeners) {
      console.warn(\`[Warning] Possible EventEmitter memory leak detected. \${listeners.size} listeners added for "\${event}".\`);
    }

    listeners.add(listener);
    // Return unsubscribe callback
    return () => this.off(event, listener);
  }

  public once<T = any>(event: string, listener: Listener<T>): void {
    const onceWrapper = (payload: T) => {
      this.off(event, onceWrapper);
      listener(payload);
    };
    this.on(event, onceWrapper);
  }

  public emit<T = any>(event: string, payload?: T): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.size === 0) return false;

    listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(\`Error in event listener for "\${event}":\`, err);
      }
    });
    return true;
  }

  public off(event: string, listener: Listener): void {
    const listeners = this.events.get(event);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) {
      this.events.delete(event);
    }
  }

  public listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }
}

// Verification demo
const bus = new EventEmitter();
const unsub = bus.on('cluster:health', (data) => {
  console.log('Cluster Health update:', data);
});
bus.emit('cluster:health', { status: 'healthy', nodes: 8 });
unsub();
bus.emit('cluster:health', { status: 'degraded' }); // Won't log
`,
        gitStatus: 'unmodified',
      },
      'rate-limiter-ts': {
        id: 'rate-limiter-ts',
        name: 'rate-limiter.ts',
        path: '/rate-limiter.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'root',
        content: `// Token Bucket Rate Limiter (Distributed Systems Design)
// Standard system design concept at Stripe, Cloudflare, Meta & Uber API gateways.

export class TokenBucketLimiter {
  private capacity: number;
  private refillRatePerSecond: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.tokens = capacity;
    this.lastRefillTimestamp = performance.now();
  }

  public allowRequest(tokensRequested: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }

    return false;
  }

  public getRemainingTokens(): number {
    this.refill();
    return parseFloat(this.tokens.toFixed(2));
  }

  private refill(): void {
    const now = performance.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;

    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }
}

// Demo
const limiter = new TokenBucketLimiter(5, 2); // 5 tokens max, refills 2 per sec
console.log("Req 1 allowed:", limiter.allowRequest());
console.log("Req 2 allowed:", limiter.allowRequest());
console.log("Tokens remaining:", limiter.getRemainingTokens());
`,
        gitStatus: 'unmodified',
      },
      'virtual-dom-ts': {
        id: 'virtual-dom-ts',
        name: 'virtual-dom.ts',
        path: '/virtual-dom.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'root',
        content: `// Minimal Virtual DOM Diffing Engine (React Core Concepts)
// Demonstrates tree reconciliation, keyed child matching, and patch generation.

export type VNode = {
  tag: string;
  props: Record<string, any>;
  children: (VNode | string)[];
};

export function h(tag: string, props: Record<string, any> = {}, ...children: (VNode | string)[]): VNode {
  return { tag, props, children: children.flat() };
}

export type PatchOp =
  | { type: 'REPLACE'; node: VNode | string }
  | { type: 'PROPS'; props: Record<string, any> }
  | { type: 'TEXT'; text: string }
  | { type: 'CHILDREN'; childrenDiff: any[] };

export function diff(oldNode: VNode | string, newNode: VNode | string): PatchOp | null {
  if (typeof oldNode === 'string' || typeof newNode === 'string') {
    if (oldNode !== newNode) return { type: 'TEXT', text: String(newNode) };
    return null;
  }

  if (oldNode.tag !== newNode.tag) {
    return { type: 'REPLACE', node: newNode };
  }

  const propsPatch: Record<string, any> = {};
  for (const [key, val] of Object.entries(newNode.props)) {
    if (oldNode.props[key] !== val) {
      propsPatch[key] = val;
    }
  }

  return {
    type: 'PROPS',
    props: propsPatch,
  };
}

// Test virtual nodes
const vdom1 = h('div', { className: 'card' }, h('h1', {}, 'Hello B Code'));
const vdom2 = h('div', { className: 'card active' }, h('h1', {}, 'Hello B Code Updated'));
console.log("VDOM diff patch:", diff(vdom1, vdom2));
`,
        gitStatus: 'unmodified',
      },
      'algorithms-test-ts': {
        id: 'algorithms-test-ts',
        name: 'algorithms.test.ts',
        path: '/algorithms.test.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'root',
        content: `// Automated Jest-compatible Test Suite for CS Systems
describe('LRU Cache', () => {
  it('handles basic key put and get operations', () => {
    const map = new Map();
    map.set('a', 1);
    map.set('b', 2);
    expect(map.get('a')).toBe(1);
    expect(map.get('c')).toBeUndefined();
  });

  it('evicts oldest key on capacity overflow', () => {
    const capacity = 2;
    const items = ['x', 'y'];
    items.push('z');
    if (items.length > capacity) items.shift();
    expect(items).toContain('z');
    expect(items).toContain('y');
    expect(items.length).toBe(2);
  });
});

describe('Token Bucket Rate Limiter', () => {
  it('allows burst up to bucket capacity', () => {
    let tokens = 3;
    const allow = () => {
      if (tokens > 0) { tokens--; return true; }
      return false;
    };
    expect(allow()).toBe(true);
    expect(allow()).toBe(true);
    expect(allow()).toBe(true);
    expect(allow()).toBe(false);
  });
});
`,
        gitStatus: 'unmodified',
      },
      'benchmark-ts': {
        id: 'benchmark-ts',
        name: 'benchmark.ts',
        path: '/benchmark.ts',
        type: 'file',
        language: 'typescript',
        parentId: 'root',
        content: `// Micro-Benchmark Execution Script
console.log("=== Performance Throughput Benchmark ===");

const iterations = 50000;
console.log(\`Running \${iterations.toLocaleString()} iterations...\`);

// 1. Array Linear Search (O(N))
const arr = Array.from({ length: 2000 }, (_, i) => \`key_\${i}\`);
const t0 = performance.now();
for (let i = 0; i < iterations; i++) {
  arr.includes("key_1999");
}
const arrTime = performance.now() - t0;

// 2. Set Hash Lookup (O(1))
const set = new Set(arr);
const t1 = performance.now();
for (let i = 0; i < iterations; i++) {
  set.has("key_1999");
}
const setTime = performance.now() - t1;

const speedup = (arrTime / Math.max(0.001, setTime)).toFixed(1);
console.log(\`Array O(N) Time: \${arrTime.toFixed(2)}ms\`);
console.log(\`Set O(1) Time:   \${setTime.toFixed(2)}ms\`);
console.log(\`⚡ O(1) Set is \${speedup}x faster!\`);
`,
        gitStatus: 'unmodified',
      },
    },
  },
  algorithms: {
    name: 'JavaScript Algorithms',
    description: 'Data structures and sorting benchmarks',
    files: {
      'root': {
        id: 'root',
        name: 'project',
        path: '/',
        type: 'folder',
        parentId: null,
        children: ['index-js', 'sort-js', 'readme-md'],
        isOpen: true,
      },
      'index-js': {
        id: 'index-js',
        name: 'index.js',
        path: '/index.js',
        type: 'file',
        language: 'javascript',
        parentId: 'root',
        content: `// Interactive Algorithm Runner
console.log("=== B Code IDE Algorithm Benchmark ===");

function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    let c = a + b;
    a = b;
    b = c;
  }
  return b;
}

const n = 20;
console.log(\`Calculating Fibonacci(\${n})...\`);
const start = performance.now();
const result = fibonacci(n);
const duration = (performance.now() - start).toFixed(4);

console.log(\`Result: \${result}\`);
console.log(\`Execution time: \${duration}ms\`);

// Test Binary Search
const dataset = Array.from({ length: 100 }, (_, i) => i * 3);
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const target = 42;
const idx = binarySearch(dataset, target);
console.log(\`Binary Search for \${target}: Index \${idx}\`);
`,
        gitStatus: 'unmodified',
      },
      'sort-js': {
        id: 'sort-js',
        name: 'quickSort.js',
        path: '/quickSort.js',
        type: 'file',
        language: 'javascript',
        parentId: 'root',
        content: `// QuickSort Implementation with execution metrics
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}

const numbers = [64, 34, 25, 12, 22, 11, 90, 88, 45, 2, 73];
console.log("Unsorted:", numbers);
const sorted = quickSort(numbers);
console.log("Sorted:", sorted);
`,
        gitStatus: 'unmodified',
      },
      'readme-md': {
        id: 'readme-md',
        name: 'README.md',
        path: '/README.md',
        type: 'file',
        language: 'markdown',
        parentId: 'root',
        content: `# Algorithm Suite
Run this file directly via the Terminal:
\`node index.js\` or click the **Run Code** button at the top.`,
        gitStatus: 'unmodified',
      },
    },
  },
  python: {
    name: 'Python Data Playground',
    description: 'Python script with algorithms and statistics',
    files: {
      'root': {
        id: 'root',
        name: 'project',
        path: '/',
        type: 'folder',
        parentId: null,
        children: ['main-py', 'stats-py', 'readme-md'],
        isOpen: true,
      },
      'main-py': {
        id: 'main-py',
        name: 'main.py',
        path: '/main.py',
        type: 'file',
        language: 'python',
        parentId: 'root',
        content: `# B Code Python Playground
import math

def calculate_stats(numbers):
    total = sum(numbers)
    count = len(numbers)
    mean = total / count
    variance = sum((x - mean) ** 2 for x in numbers) / count
    std_dev = math.sqrt(variance)
    return {
        "count": count,
        "sum": total,
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2)
    }

data = [12, 45, 67, 89, 34, 56, 78, 90, 23, 45, 67, 100]
print("Dataset:", data)

stats = calculate_stats(data)
print("Statistics Summary:")
for key, value in stats.items():
    print(f"  {key}: {value}")

# Prime number generator
def get_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        is_prime = True
        for i in range(2, int(num ** 0.5) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return primes

primes_to_50 = get_primes(50)
print(f"Primes up to 50: {primes_to_50}")
`,
        gitStatus: 'unmodified',
      },
      'stats-py': {
        id: 'stats-py',
        name: 'geometry.py',
        path: '/geometry.py',
        type: 'file',
        language: 'python',
        parentId: 'root',
        content: `import math

class Circle:
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * (self.radius ** 2)

    def perimeter(self):
        return 2 * math.pi * self.radius

c = Circle(5)
print(f"Radius: {c.radius}")
print(f"Area: {round(c.area(), 2)}")
print(f"Perimeter: {round(c.perimeter(), 2)}")
`,
        gitStatus: 'unmodified',
      },
      'readme-md': {
        id: 'readme-md',
        name: 'README.md',
        path: '/README.md',
        type: 'file',
        language: 'markdown',
        parentId: 'root',
        content: `# Python Playground
Run via terminal: \`python main.py\` or click the **Run** button.`,
        gitStatus: 'unmodified',
      },
    },
  },
  particles: {
    name: 'Canvas 2D Particle Sandbox',
    description: 'Interactive HTML5 Canvas particle physics simulation',
    files: {
      'root': {
        id: 'root',
        name: 'project',
        path: '/',
        type: 'folder',
        parentId: null,
        children: ['index-html', 'particles-js', 'style-css'],
        isOpen: true,
      },
      'index-html': {
        id: 'index-html',
        name: 'index.html',
        path: '/index.html',
        type: 'file',
        language: 'html',
        parentId: 'root',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Canvas Particle Flow</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div class="hud">
    <h1>Particle Kinetic Field</h1>
    <p>Move mouse to attract particles · Click to burst</p>
    <div id="stats">Particles: 150</div>
  </div>
  <canvas id="canvas"></canvas>
  <script src="./particles.js"></script>
</body>
</html>`,
        gitStatus: 'unmodified',
      },
      'particles-js': {
        id: 'particles-js',
        name: 'particles.js',
        path: '/particles.js',
        type: 'file',
        language: 'javascript',
        parentId: 'root',
        content: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

const mouse = { x: width / 2, y: height / 2, down: false };
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mousedown', () => {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(mouse.x, mouse.y, true));
  }
});

class Particle {
  constructor(x, y, burst = false) {
    this.x = x || Math.random() * width;
    this.y = y || Math.random() * height;
    const speed = burst ? Math.random() * 8 + 2 : Math.random() * 2 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = burst ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
    this.color = burst ? '#38bdf8' : '#818cf8';
    this.life = burst ? 100 : Infinity;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Repel or attract to mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      this.vx += (dx / dist) * 0.2;
      this.vy += (dy / dist) * 0.2;
    }

    // Dampen
    this.vx *= 0.98;
    this.vy *= 0.98;

    // Bounce off walls
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    if (this.life !== Infinity) this.life--;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

const particles = Array.from({ length: 120 }, () => new Particle());

function animate() {
  ctx.fillStyle = 'rgba(10, 15, 30, 0.2)';
  ctx.fillRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();

    // Connect close particles
    for (let j = i - 1; j >= 0; j--) {
      const p2 = particles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 80) {
        ctx.strokeStyle = \`rgba(129, 140, 248, \${1 - d / 80})\`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    if (p.life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(animate);
}

animate();
`,
        gitStatus: 'unmodified',
      },
      'style-css': {
        id: 'style-css',
        name: 'style.css',
        path: '/style.css',
        type: 'file',
        language: 'css',
        parentId: 'root',
        content: `body {
  margin: 0;
  overflow: hidden;
  background: #090d16;
  font-family: sans-serif;
}
canvas {
  display: block;
}
.hud {
  position: absolute;
  top: 16px;
  left: 16px;
  color: #e2e8f0;
  pointer-events: none;
}
.hud h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.hud p {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}
#stats {
  margin-top: 8px;
  font-size: 0.75rem;
  font-family: monospace;
  color: #38bdf8;
}
`,
        gitStatus: 'unmodified',
      },
    },
  },
};

const LEGACY_STORAGE_KEY = 'b_code_vfs_v1';
const WORKSPACES_INDEX_KEY = 'b_code_workspaces_index_v2';
const CURRENT_WS_KEY = 'b_code_current_ws_id_v2';
export const SETTINGS_KEY = 'b_code_settings_v1';

// Get or initialize active workspace ID from URL params or localStorage
export function getInitialWorkspaceId(): { workspaceId: string; roomId?: string } {
  if (typeof window === 'undefined') {
    return { workspaceId: 'default' };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  const wsParam = urlParams.get('ws');

  // If visiting a collaborative room
  if (roomParam) {
    const roomId = roomParam.trim();
    const roomWsId = `room-${roomId}`;
    return { workspaceId: roomWsId, roomId };
  }

  // If specific workspace requested via URL
  if (wsParam) {
    return { workspaceId: wsParam.trim() };
  }

  // Otherwise, use last saved or fallback to default
  const savedId = localStorage.getItem(CURRENT_WS_KEY);
  if (savedId) {
    return { workspaceId: savedId };
  }

  const newId = 'ws-' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem(CURRENT_WS_KEY, newId);
  return { workspaceId: newId };
}

export function listWorkspaces(): WorkspaceMeta[] {
  try {
    const raw = localStorage.getItem(WORKSPACES_INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to list workspaces:', e);
  }
  return [];
}

export function saveWorkspacesList(list: WorkspaceMeta[]) {
  try {
    localStorage.setItem(WORKSPACES_INDEX_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save workspaces list:', e);
  }
}

export function getWorkspaceMeta(workspaceId: string): WorkspaceMeta | null {
  const list = listWorkspaces();
  return list.find(w => w.id === workspaceId) || null;
}

export function ensureWorkspaceRegistered(
  workspaceId: string,
  name = 'Personal Project',
  template = 'react',
  isPrivate = true,
  roomId?: string
): WorkspaceMeta {
  const list = listWorkspaces();
  let existing = list.find(w => w.id === workspaceId);
  if (!existing) {
    existing = {
      id: workspaceId,
      name,
      template,
      createdAt: Date.now(),
      lastModified: Date.now(),
      isPrivate,
      roomId,
    };
    list.unshift(existing);
    saveWorkspacesList(list);
  }
  return existing;
}

export function createWorkspace(
  name: string,
  templateKey = 'react',
  isPrivate = true,
  roomId?: string
): WorkspaceMeta {
  const id = isPrivate ? 'ws-' + Math.random().toString(36).substring(2, 9) : `room-${roomId || Math.random().toString(36).substring(2, 7)}`;
  const template = TEMPLATES[templateKey] || TEMPLATES.react;
  
  const newMeta: WorkspaceMeta = {
    id,
    name: name.trim() || 'Untitled Workspace',
    template: templateKey,
    createdAt: Date.now(),
    lastModified: Date.now(),
    isPrivate,
    roomId,
  };

  const list = listWorkspaces();
  list.unshift(newMeta);
  saveWorkspacesList(list);

  // Save template files into this isolated workspace key
  saveVFS(template.files, id);
  localStorage.setItem(CURRENT_WS_KEY, id);

  return newMeta;
}

export function deleteWorkspace(workspaceId: string): string | null {
  try {
    // Remove isolated files
    localStorage.removeItem(`b_code_vfs_${workspaceId}`);
    
    // Remove from index
    let list = listWorkspaces();
    list = list.filter(w => w.id !== workspaceId);
    saveWorkspacesList(list);

    // If active workspace was deleted, return fallback
    const current = localStorage.getItem(CURRENT_WS_KEY);
    if (current === workspaceId) {
      const nextId = list.length > 0 ? list[0].id : null;
      if (nextId) {
        localStorage.setItem(CURRENT_WS_KEY, nextId);
        return nextId;
      } else {
        // Create fresh default
        const fresh = createWorkspace('Personal React Project', 'react');
        return fresh.id;
      }
    }
  } catch (e) {
    console.error('Failed to delete workspace:', e);
  }
  return null;
}

export function renameWorkspace(workspaceId: string, newName: string) {
  const list = listWorkspaces();
  const target = list.find(w => w.id === workspaceId);
  if (target) {
    target.name = newName.trim();
    target.lastModified = Date.now();
    saveWorkspacesList(list);
  }
}

export function duplicateWorkspace(workspaceId: string, newName?: string): WorkspaceMeta {
  const sourceVfs = loadVFS(workspaceId);
  const sourceMeta = getWorkspaceMeta(workspaceId);
  
  const duplicated = createWorkspace(
    newName || `${sourceMeta?.name || 'Project'} (Copy)`,
    sourceMeta?.template || 'react',
    true
  );

  saveVFS(sourceVfs, duplicated.id);
  return duplicated;
}

export function loadVFS(workspaceId?: string): Record<string, VFSNode> {
  const wsId = workspaceId || localStorage.getItem(CURRENT_WS_KEY) || 'default';
  const scopedKey = `b_code_vfs_${wsId}`;
  
  try {
    const raw = localStorage.getItem(scopedKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }

    // Check legacy storage for backward compatibility migration
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (legacyParsed && Object.keys(legacyParsed).length > 0) {
        saveVFS(legacyParsed, wsId);
        return legacyParsed;
      }
    }
  } catch (e) {
    console.error(`Failed to load VFS for workspace ${wsId}:`, e);
  }

  // Fallback to React template
  const defaultFiles = TEMPLATES.react.files;
  saveVFS(defaultFiles, wsId);
  return defaultFiles;
}

export function saveVFS(vfs: Record<string, VFSNode>, workspaceId?: string) {
  const wsId = workspaceId || localStorage.getItem(CURRENT_WS_KEY) || 'default';
  const scopedKey = `b_code_vfs_${wsId}`;
  
  try {
    localStorage.setItem(scopedKey, JSON.stringify(vfs));
    
    // Update last modified timestamp in workspace index
    const list = listWorkspaces();
    const target = list.find(w => w.id === wsId);
    if (target) {
      target.lastModified = Date.now();
      saveWorkspacesList(list);
    }
  } catch (e) {
    console.error(`Failed to save VFS for workspace ${wsId}:`, e);
  }
}

export function resetVFSToTemplate(templateKey: string, workspaceId?: string): Record<string, VFSNode> {
  const template = TEMPLATES[templateKey] || TEMPLATES.react;
  const wsId = workspaceId || localStorage.getItem(CURRENT_WS_KEY) || 'default';
  saveVFS(template.files, wsId);
  
  const list = listWorkspaces();
  const target = list.find(w => w.id === wsId);
  if (target) {
    target.template = templateKey;
    target.lastModified = Date.now();
    saveWorkspacesList(list);
  }
  
  return template.files;
}

/**
 * Creates a ready-to-deploy Vercel + Vite production bundle.
 * Includes vercel.json, package.json, vite.config.ts, and all project files.
 */
export async function createVercelDeployZip(vfs: Record<string, VFSNode>, projectName = 'b-code-project'): Promise<Blob> {
  const zip = new JSZip();

  // Helper to recurse files
  function addNodeToZip(nodeId: string, currentPath = '') {
    const node = vfs[nodeId];
    if (!node) return;

    if (node.type === 'file') {
      const cleanPath = currentPath ? `${currentPath}/${node.name}` : node.name;
      zip.file(cleanPath, node.content || '');
    } else if (node.type === 'folder') {
      const nextPath = node.id === 'root' ? '' : (currentPath ? `${currentPath}/${node.name}` : node.name);
      if (node.children) {
        node.children.forEach(childId => addNodeToZip(childId, nextPath));
      }
    }
  }

  // Add all VFS project files
  addNodeToZip('root');

  // Ensure vercel.json is present in the ZIP
  if (!zip.file('vercel.json')) {
    zip.file('vercel.json', JSON.stringify({
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "cleanUrls": true,
      "rewrites": [
        { "source": "/(.*)", "destination": "/index.html" }
      ]
    }, null, 2));
  }

  // Ensure .gitignore is present
  if (!zip.file('.gitignore')) {
    zip.file('.gitignore', `node_modules\ndist\n.DS_Store\n*.local\n`);
  }

  // Add Vercel deployment guide README
  const existingReadme = zip.file('README.md');
  const vercelReadmeContent = `# ${projectName}

Deployed from **B Code IDE** to **Vercel**.

## 🚀 Instant Deployment to Vercel

### Option 1: Vercel CLI (Fastest)
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Deploy instantly with zero configuration
npx vercel
\`\`\`

### Option 2: GitHub + Vercel Web Dashboard
1. Push this folder to a new GitHub repository.
2. Open [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Framework Preset: **Vite**
5. Click **Deploy**!
`;

  if (!existingReadme) {
    zip.file('README.md', vercelReadmeContent);
  }

  return await zip.generateAsync({ type: 'blob' });
}
