import { TestSuiteResult, TestCaseResult } from '../types/ide';

/**
 * Browser-native BDD / TDD Test Execution Engine (Jest / Vitest compatible).
 * Enables unit testing of algorithms, data structures, and utilities directly in the sandbox.
 */

class Expectation<T = any> {
  private actual: T;
  private isNot: boolean = false;

  constructor(actual: T, isNot: boolean = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.isNot);
  }

  toBe(expected: any): void {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected: ${this.isNot ? 'NOT ' : ''}${JSON.stringify(expected)}, Received: ${JSON.stringify(this.actual)}`
      );
    }
  }

  toEqual(expected: any): void {
    const actualJson = JSON.stringify(this.actual);
    const expectedJson = JSON.stringify(expected);
    const pass = actualJson === expectedJson;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected: ${this.isNot ? 'NOT ' : ''}${expectedJson}, Received: ${actualJson}`
      );
    }
  }

  toBeTruthy(): void {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected: ${this.isNot ? 'NOT ' : ''}truthy, Received: ${JSON.stringify(this.actual)}`);
    }
  }

  toBeFalsy(): void {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected: ${this.isNot ? 'NOT ' : ''}falsy, Received: ${JSON.stringify(this.actual)}`);
    }
  }

  toBeNull(): void {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected: ${this.isNot ? 'NOT ' : ''}null, Received: ${JSON.stringify(this.actual)}`);
    }
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected: ${this.isNot ? 'NOT ' : ''}undefined, Received: ${JSON.stringify(this.actual)}`);
    }
  }

  toBeDefined(): void {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected: defined, Received: undefined`);
    }
  }

  toContain(item: any): void {
    let pass = false;
    if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    } else if (typeof this.actual === 'string') {
      pass = this.actual.includes(String(item));
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(item)}`
      );
    }
  }

  toHaveLength(length: number): void {
    const actualLen = (this.actual as any)?.length;
    const pass = actualLen === length;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected length: ${length}, Received length: ${actualLen}`);
    }
  }

  toBeGreaterThan(expected: number): void {
    const pass = (this.actual as any) > expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected > ${expected}, Received: ${this.actual}`);
    }
  }

  toBeLessThan(expected: number): void {
    const pass = (this.actual as any) < expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected < ${expected}, Received: ${this.actual}`);
    }
  }

  toBeCloseTo(expected: number, numDigits: number = 2): void {
    const precision = Math.pow(10, -numDigits) / 2;
    const pass = Math.abs((this.actual as any) - expected) < precision;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} to be close to ${expected} (precision ${numDigits})`);
    }
  }

  toThrow(expectedError?: string | RegExp): void {
    if (typeof this.actual !== 'function') {
      throw new Error('Actual value must be a function to test toThrow');
    }
    let threw = false;
    let caughtErr: any = null;
    try {
      this.actual();
    } catch (err) {
      threw = true;
      caughtErr = err;
    }

    if (!threw && !this.isNot) {
      throw new Error('Expected function to throw an error, but it did not throw.');
    }
    if (threw && this.isNot) {
      throw new Error(`Expected function NOT to throw, but it threw: ${caughtErr?.message || caughtErr}`);
    }
    if (threw && expectedError) {
      const msg = caughtErr?.message || String(caughtErr);
      if (typeof expectedError === 'string' && !msg.includes(expectedError)) {
        throw new Error(`Expected error message to include "${expectedError}", but received "${msg}"`);
      }
      if (expectedError instanceof RegExp && !expectedError.test(msg)) {
        throw new Error(`Expected error message to match ${expectedError}, but received "${msg}"`);
      }
    }
  }
}

export function expect<T = any>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

interface TestItem {
  title: string;
  fn: () => void | Promise<void>;
}

interface SuiteItem {
  title: string;
  tests: TestItem[];
}

/**
 * Runs test code inside an isolated asynchronous context.
 */
export async function runTestSuiteCode(
  code: string,
  fileName: string = 'test.spec.ts'
): Promise<TestSuiteResult[]> {
  const suites: SuiteItem[] = [];
  let currentSuite: SuiteItem = { title: 'Default Test Suite', tests: [] };

  const describe = (title: string, fn: () => void) => {
    const prevSuite = currentSuite;
    const newSuite: SuiteItem = { title, tests: [] };
    suites.push(newSuite);
    currentSuite = newSuite;
    try {
      fn();
    } finally {
      currentSuite = prevSuite;
    }
  };

  const it = (title: string, fn: () => void | Promise<void>) => {
    currentSuite.tests.push({ title, fn });
  };
  const test = it;

  // Clean code: strip imports/exports
  const cleanCode = code
    .replace(/^import\s+.*?['"].*?['"];?/gm, '')
    .replace(/^export\s+(default\s+)?/gm, '');

  try {
    const fn = new Function('describe', 'it', 'test', 'expect', `
      "use strict";
      ${cleanCode}
    `);
    fn(describe, it, test, expect);
  } catch (err: any) {
    return [
      {
        id: 'suite-err-' + Date.now(),
        fileName,
        suiteTitle: 'Compilation / Syntax Error in Test File',
        durationMs: 0,
        passedCount: 0,
        failedCount: 1,
        tests: [
          {
            id: 'case-compile-error',
            title: 'Test File Parsing',
            suiteTitle: 'Compilation Error',
            status: 'failed',
            durationMs: 0,
            error: err?.message || String(err),
          },
        ],
      },
    ];
  }

  // If no describe was called but tests were added
  if (suites.length === 0 && currentSuite.tests.length > 0) {
    suites.push(currentSuite);
  }

  const results: TestSuiteResult[] = [];

  for (const suite of suites) {
    const suiteStartTime = performance.now();
    const testCases: TestCaseResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const t of suite.tests) {
      const caseStart = performance.now();
      let status: 'passed' | 'failed' = 'passed';
      let errorMsg: string | undefined;

      try {
        const res = t.fn();
        if (res && typeof (res as any).then === 'function') {
          await res;
        }
        passed++;
      } catch (e: any) {
        status = 'failed';
        failed++;
        errorMsg = e?.message || String(e);
      }

      const caseDuration = parseFloat((performance.now() - caseStart).toFixed(2));
      testCases.push({
        id: `test-${suite.title}-${t.title}-${Math.random().toString(36).substring(2, 6)}`,
        title: t.title,
        suiteTitle: suite.title,
        status,
        durationMs: caseDuration,
        error: errorMsg,
      });
    }

    const suiteDuration = parseFloat((performance.now() - suiteStartTime).toFixed(2));
    results.push({
      id: `suite-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileName,
      suiteTitle: suite.title,
      tests: testCases,
      durationMs: suiteDuration,
      passedCount: passed,
      failedCount: failed,
    });
  }

  return results;
}

/**
 * Built-in standard MAANG interview algorithms test suite
 * to immediately demonstrate testing capabilities without writing code.
 */
export const SAMPLE_MAANG_TEST_CODE = `// Sample Automated Unit Test Suite for CS Fundamentals
describe('LRU Cache (Least Recently Used)', () => {
  class LRUCache {
    constructor(capacity) {
      this.capacity = capacity;
      this.map = new Map();
    }
    get(key) {
      if (!this.map.has(key)) return -1;
      const val = this.map.get(key);
      this.map.delete(key);
      this.map.set(key, val);
      return val;
    }
    put(key, value) {
      if (this.map.has(key)) this.map.delete(key);
      else if (this.map.size >= this.capacity) {
        const oldestKey = this.map.keys().next().value;
        this.map.delete(oldestKey);
      }
      this.map.set(key, value);
    }
  }

  it('should store and retrieve key-value pairs', () => {
    const cache = new LRUCache(2);
    cache.put(1, 100);
    cache.put(2, 200);
    expect(cache.get(1)).toBe(100);
    expect(cache.get(2)).toBe(200);
  });

  it('should evict the least recently used item when capacity is exceeded', () => {
    const cache = new LRUCache(2);
    cache.put(1, 'apple');
    cache.put(2, 'banana');
    cache.get(1); // 1 is recently used
    cache.put(3, 'cherry'); // evicts 2
    expect(cache.get(2)).toBe(-1);
    expect(cache.get(1)).toBe('apple');
    expect(cache.get(3)).toBe('cherry');
  });
});

describe('Typed Event Emitter (Pub/Sub Pattern)', () => {
  class EventEmitter {
    constructor() {
      this.events = {};
    }
    on(event, listener) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(listener);
      return () => this.off(event, listener);
    }
    emit(event, ...args) {
      if (!this.events[event]) return;
      this.events[event].forEach(fn => fn(...args));
    }
    off(event, listener) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(fn => fn !== listener);
    }
  }

  it('should notify registered listeners when event is fired', () => {
    const emitter = new EventEmitter();
    let received = null;
    emitter.on('user:login', (user) => { received = user; });
    emitter.emit('user:login', { name: 'Alice', role: 'admin' });
    expect(received).toEqual({ name: 'Alice', role: 'admin' });
  });

  it('should support unsubscribing listeners', () => {
    const emitter = new EventEmitter();
    let count = 0;
    const unsubscribe = emitter.on('ping', () => { count++; });
    emitter.emit('ping');
    expect(count).toBe(1);
    unsubscribe();
    emitter.emit('ping');
    expect(count).toBe(1);
  });
});

describe('Token Bucket Rate Limiter (Distributed Systems)', () => {
  class TokenBucket {
    constructor(capacity, refillRate) {
      this.capacity = capacity;
      this.tokens = capacity;
      this.refillRate = refillRate;
      this.lastRefill = Date.now();
    }
    allowRequest(cost = 1) {
      this.refill();
      if (this.tokens >= cost) {
        this.tokens -= cost;
        return true;
      }
      return false;
    }
    refill() {
      const now = Date.now();
      const elapsed = (now - this.lastRefill) / 1000;
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
      this.lastRefill = now;
    }
  }

  it('should allow burst requests up to capacity', () => {
    const limiter = new TokenBucket(3, 1);
    expect(limiter.allowRequest()).toBe(true);
    expect(limiter.allowRequest()).toBe(true);
    expect(limiter.allowRequest()).toBe(true);
    expect(limiter.allowRequest()).toBe(false);
  });
});
`;

export const BUILT_IN_MAANG_TESTS = SAMPLE_MAANG_TEST_CODE;

export async function runTestScript(code: string, fileName?: string): Promise<TestSuiteResult> {
  const suites = await runTestSuiteCode(code, fileName);
  if (suites.length === 0) {
    return {
      id: 'suite-' + Date.now(),
      fileName: fileName || 'tests.ts',
      suiteTitle: 'Empty Test Suite',
      durationMs: 0,
      passedCount: 0,
      failedCount: 0,
      tests: [],
    };
  }
  if (suites.length === 1) {
    return suites[0];
  }
  return {
    id: 'suite-' + Date.now(),
    fileName: fileName || 'tests.ts',
    suiteTitle: suites.map((s) => s.suiteTitle).join(' | '),
    durationMs: parseFloat(suites.reduce((a, s) => a + s.durationMs, 0).toFixed(2)),
    passedCount: suites.reduce((a, s) => a + s.passedCount, 0),
    failedCount: suites.reduce((a, s) => a + s.failedCount, 0),
    tests: suites.flatMap((s) => s.tests),
  };
}
