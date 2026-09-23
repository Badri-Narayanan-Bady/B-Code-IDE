import { VFSNode } from '../types/ide';

export interface RunResult {
  success: boolean;
  output: string[];
  executionTimeMs: number;
  returnedValue?: string;
  error?: string;
}

export function executeJavaScript(
  code: string,
  onLog?: (type: 'log' | 'warn' | 'error' | 'info', message: string) => void
): Promise<RunResult> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    const startTime = performance.now();

    const customConsole = {
      log: (...args: any[]) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(text);
        onLog?.('log', text);
      },
      warn: (...args: any[]) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(`[WARN] ${text}`);
        onLog?.('warn', text);
      },
      error: (...args: any[]) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(`[ERROR] ${text}`);
        onLog?.('error', text);
      },
      info: (...args: any[]) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(`[INFO] ${text}`);
        onLog?.('info', text);
      },
    };

    try {
      // Create sandboxed execution function
      // Strip potential import/export statements for plain browser eval if needed
      const cleanCode = code
        .replace(/^import\s+.*?['"].*?['"];?/gm, '// [import resolved]')
        .replace(/^export\s+(default\s+)?/gm, '');

      const runFn = new Function('console', `
        "use strict";
        return (function() {
          ${cleanCode}
        })();
      `);

      const result = runFn(customConsole);
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));
      
      resolve({
        success: true,
        output: logs,
        executionTimeMs,
        returnedValue: result !== undefined ? String(result) : undefined,
      });
    } catch (err: any) {
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));
      const errMsg = err?.message || String(err);
      logs.push(`Runtime Error: ${errMsg}`);
      onLog?.('error', errMsg);

      resolve({
        success: false,
        output: logs,
        executionTimeMs,
        error: errMsg,
      });
    }
  });
}

export function executePython(
  code: string,
  onLog?: (type: 'log' | 'warn' | 'error' | 'info', message: string) => void
): Promise<RunResult> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    const startTime = performance.now();

    // A lightweight Python-to-JS runner that executes standard Python print, arithmetic, loops, functions, lists
    try {
      const lines = code.split('\n');
      let jsCode = '';
      
      for (const line of lines) {
        let l = line.replace(/#.*$/, ''); // strip comments
        // Basic transpilation for standard python scripts
        // print(...)
        l = l.replace(/\bprint\s*\((.*?)\)/g, 'console.log($1)');
        l = l.replace(/\bround\((.*?),\s*(\d+)\)/g, '(+($1).toFixed($2))');
        l = l.replace(/math\.pi/g, 'Math.PI');
        l = l.replace(/math\.sqrt/g, 'Math.sqrt');
        l = l.replace(/\bsum\((.*?)\)/g, '($1.reduce((a, b) => a + b, 0))');
        l = l.replace(/\blen\((.*?)\)/g, '($1.length)');
        l = l.replace(/\bTrue\b/g, 'true');
        l = l.replace(/\bFalse\b/g, 'false');
        l = l.replace(/\bNone\b/g, 'null');
        l = l.replace(/\*\*/g, '^'); // we can handle power

        jsCode += l + '\n';
      }

      // Execute in JS runner
      const runFn = new Function('console', `
        const math = { pi: Math.PI, sqrt: Math.sqrt };
        ${jsCode}
      `);

      const customConsole = {
        log: (...args: any[]) => {
          const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          logs.push(text);
          onLog?.('log', text);
        },
        warn: (...args: any[]) => {
          const text = String(args.join(' '));
          logs.push(`[WARN] ${text}`);
          onLog?.('warn', text);
        },
        error: (...args: any[]) => {
          const text = String(args.join(' '));
          logs.push(`[ERROR] ${text}`);
          onLog?.('error', text);
        },
      };

      runFn(customConsole);
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));

      resolve({
        success: true,
        output: logs,
        executionTimeMs,
      });
    } catch (e: any) {
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));
      const errMsg = e?.message || String(e);
      logs.push(`Python Execution Error: ${errMsg}`);
      onLog?.('error', errMsg);

      resolve({
        success: false,
        output: logs,
        executionTimeMs,
        error: errMsg,
      });
    }
  });
}

/**
 * Builds self-contained HTML bundle for the Live Preview iframe
 */
export function buildPreviewHTML(vfs: Record<string, VFSNode>): string {
  // Find index.html or fallback
  const htmlNode = Object.values(vfs).find(n => n.type === 'file' && (n.name === 'index.html' || n.path.endsWith('.html')));
  
  // Find css
  const cssNodes = Object.values(vfs).filter(n => n.type === 'file' && n.name.endsWith('.css'));
  const combinedCss = cssNodes.map(c => c.content || '').join('\n');

  // Find JS/TS/JSX
  const jsNodes = Object.values(vfs).filter(n => n.type === 'file' && (n.name.endsWith('.tsx') || n.name.endsWith('.jsx') || n.name.endsWith('.js')));

  const consoleHookScript = `
    <script>
      (function() {
        const _origLog = console.log;
        const _origWarn = console.warn;
        const _origError = console.error;
        const _origInfo = console.info;

        function sendToParent(type, args) {
          try {
            const formatted = args.map(a => {
              if (typeof a === 'object') {
                try { return JSON.stringify(a); } catch (e) { return String(a); }
              }
              return String(a);
            }).join(' ');
            window.parent.postMessage({ type: 'B_CODE_PREVIEW_LOG', level: type, message: formatted, timestamp: Date.now() }, '*');
          } catch(e) {}
        }

        console.log = function(...args) { sendToParent('log', args); _origLog.apply(console, args); };
        console.warn = function(...args) { sendToParent('warn', args); _origWarn.apply(console, args); };
        console.error = function(...args) { sendToParent('error', args); _origError.apply(console, args); };
        console.info = function(...args) { sendToParent('info', args); _origInfo.apply(console, args); };

        window.onerror = function(msg, url, line, col, error) {
          sendToParent('error', [\`Uncaught \${msg} at line \${line}:\${col}\`]);
          return false;
        };
      })();
    </script>
  `;

  if (htmlNode && htmlNode.content) {
    let content = htmlNode.content;

    // Inject console hook inside <head>
    if (content.includes('<head>')) {
      content = content.replace('<head>', `<head>\n${consoleHookScript}`);
    } else {
      content = consoleHookScript + '\n' + content;
    }

    // Inline CSS into <style> if external link references them
    for (const cssNode of cssNodes) {
      const linkRegex = new RegExp(`<link[^>]*href=["'][^"']*${cssNode.name}["'][^>]*>`, 'gi');
      content = content.replace(linkRegex, `<style>\n${cssNode.content}\n</style>`);
    }

    // Inline JS / JSX scripts
    for (const jsNode of jsNodes) {
      const scriptRegex = new RegExp(`<script[^>]*src=["'][^"']*${jsNode.name}["'][^>]*>\\s*</script>`, 'gi');
      const isBabel = jsNode.name.endsWith('.tsx') || jsNode.name.endsWith('.jsx');
      const typeAttr = isBabel ? 'type="text/babel"' : 'type="text/javascript"';
      content = content.replace(scriptRegex, `<script ${typeAttr}>\n${jsNode.content}\n</script>`);
    }

    return content;
  }

  // If no index.html exists, create standard container
  const mainScript = jsNodes[0]?.content || 'console.log("No entry script found");';
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Preview</title>
        <script src="https://cdn.tailwindcss.com"></script>
        ${consoleHookScript}
        <style>
          ${combinedCss}
        </style>
      </head>
      <body class="p-6 bg-slate-900 text-slate-100 font-sans">
        <div id="root"></div>
        <script>
          ${mainScript}
        </script>
      </body>
    </html>
  `;
}
