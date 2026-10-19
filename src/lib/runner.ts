export type TestCase = { input: unknown[]; output: unknown };
export type CaseResult = { input: string; expected: string; actual: string; passed: boolean };
export type RunResult = { results: CaseResult[]; logs: string[]; error?: string };

const WORKER_SRC = `
let pyodideReady = null;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
self.onmessage = async (e) => {
  const { lang, code, fn, tests } = e.data;
  const logs = [];
  try {
    let call;
    if (lang === 'javascript') {
      const con = { log: (...a) => logs.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')) };
      const f = new Function('console', code + '\\n;return typeof ' + fn + ' === "function" ? ' + fn + ' : undefined;')(con);
      if (!f) throw new Error('Function ' + fn + ' is not defined');
      call = (args) => f(...JSON.parse(JSON.stringify(args)));
    } else {
      if (!pyodideReady) {
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
        pyodideReady = loadPyodide();
      }
      const py = await pyodideReady;
      py.setStdout({ batched: (s) => logs.push(s) });
      py.runPython(code);
      const f = py.globals.get(fn);
      if (!f) throw new Error('Function ' + fn + ' is not defined');
      call = (args) => { const r = f(...args.map(a => py.toPy(a))); return r && r.toJs ? r.toJs({ create_proxies: false }) : r; };
    }
    const results = tests.map(t => {
      try { const actual = call(t.input); return { input: JSON.stringify(t.input).slice(1, -1), expected: JSON.stringify(t.output), actual: JSON.stringify(actual === undefined ? null : actual), passed: eq(actual, t.output) }; }
      catch (err) { return { input: JSON.stringify(t.input).slice(1, -1), expected: JSON.stringify(t.output), actual: 'Error: ' + err.message, passed: false }; }
    });
    self.postMessage({ results, logs });
  } catch (err) { self.postMessage({ results: [], logs, error: String(err && err.message || err) }); }
};`;

let worker: Worker | null = null;
function getWorker() {
  if (!worker) worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));
  return worker;
}

/** Runs JavaScript or Python in the browser in an isolated worker with a time limit. */
export function runInBrowser(lang: "javascript" | "python", code: string, fn: string, tests: TestCase[], timeoutMs = lang === "python" ? 30000 : 5000): Promise<RunResult> {
  return new Promise((resolve) => {
    const w = getWorker();
    const timer = setTimeout(() => {
      w.terminate(); worker = null;
      resolve({ results: [], logs: [], error: "Time limit exceeded (possible infinite loop)" });
    }, timeoutMs);
    w.onmessage = (e) => { clearTimeout(timer); resolve(e.data as RunResult); };
    w.postMessage({ lang, code, fn, tests });
  });
}
