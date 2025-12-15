/// <reference lib="webworker" />
import { createTwoFilesPatch, diffLines, type Change } from 'diff';
import { parse, type File } from 'gitdiff-parser';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'H0',
    location: 'line-diff-worker.ts:init',
    message: 'worker loaded',
    data: {},
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

// #region agent log
self.addEventListener('error', (event) => {
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H0E',
      location: 'line-diff-worker.ts:error',
      message: 'worker error',
      data: {
        message: String(event.message ?? ''),
        filename: String(event.filename ?? ''),
        lineno: event.lineno ?? null,
        colno: event.colno ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
});

self.addEventListener('unhandledrejection', (event) => {
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H0R',
      location: 'line-diff-worker.ts:unhandledrejection',
      message: 'worker rejection',
      data: { reason: String(event.reason ?? '') },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
});
// #endregion

export type DiffWorkerRequest = {
  oldText: string;
  newText: string;
  // Optional preprocessed aligned text (built in main thread)
  alignedOldText?: string;
  alignedNewText?: string;
  options?: DiffWorkerOptions;
  requestId?: string;
};

export type LineChangeRange = {
  type: 'added' | 'removed' | 'modified';
  oldStart: number | null;
  oldEnd: number | null;
  newStart: number | null;
  newEnd: number | null;
};

export type DiffWorkerResponse = {
  ranges: LineChangeRange[];
  files: File[];
  diffText: string;
  requestId?: string;
};

export type DiffWorkerOptions = {
  ignoreWhitespace?: boolean;
  ignoreBlankLines?: boolean;
  ignoreLineEndings?: boolean;
  trimTrailingSpaces?: boolean;
  caseInsensitive?: boolean;
  contextLines?: number;
};

const countLines = (value: string) => {
  if (!value) return 0;
  return value.split(/\r\n|\r|\n/).length;
};

const getLineCount = (change: Change) => change.count ?? countLines(change.value);

const normalizeText = (input: string, options: DiffWorkerOptions) => {
  const safeInput = input ?? '';
  const normalizedLineEndings = options.ignoreLineEndings
    ? safeInput.replace(/\r\n|\r/g, '\n')
    : safeInput;

  const processedLines = normalizedLineEndings.split('\n').map((line) => {
    let currentLine = line;

    if (options.trimTrailingSpaces) {
      currentLine = currentLine.replace(/\s+$/, '');
    }

    if (options.ignoreWhitespace) {
      currentLine = currentLine.replace(/[ \t]+/g, ' ');
    }

    return currentLine;
  });

  const withoutBlankLines = options.ignoreBlankLines
    ? processedLines.filter((line) => line.trim().length > 0)
    : processedLines;

  const joined = withoutBlankLines.join('\n');
  return options.caseInsensitive ? joined.toLowerCase() : joined;
};

const buildRanges = (changes: Change[]): LineChangeRange[] => {
  const ranges: LineChangeRange[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index]!;
    const lineCount = getLineCount(change);

    if (lineCount === 0) {
      continue;
    }

    if (change.removed && changes[index + 1]?.added) {
      const addedChange = changes[index + 1]!;
      const addedLineCount = getLineCount(addedChange);

      ranges.push({
        type: 'modified',
        oldStart: oldLine,
        oldEnd: oldLine + lineCount - 1,
        newStart: newLine,
        newEnd: newLine + addedLineCount - 1,
      });

      oldLine += lineCount;
      newLine += addedLineCount;
      index += 1;
      continue;
    }

    if (change.removed) {
      ranges.push({
        type: 'removed',
        oldStart: oldLine,
        oldEnd: oldLine + lineCount - 1,
        newStart: null,
        newEnd: null,
      });

      oldLine += lineCount;
      continue;
    }

    if (change.added) {
      ranges.push({
        type: 'added',
        oldStart: null,
        oldEnd: null,
        newStart: newLine,
        newEnd: newLine + lineCount - 1,
      });

      newLine += lineCount;
      continue;
    }

    oldLine += lineCount;
    newLine += lineCount;
  }

  return ranges;
};

self.onmessage = (event: MessageEvent<DiffWorkerRequest>) => {
  const { oldText = '', newText = '', options = {}, requestId } = event.data ?? {};

  const safeRespond = (payload: Omit<DiffWorkerResponse, 'requestId'>) => {
    self.postMessage({ ...payload, requestId } satisfies DiffWorkerResponse);
  };

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'H5',
        location:'line-diff-worker.ts:onmessage',
        message:'start onmessage',
        data:{oldLen:oldText.length,newLen:newText.length,alignedOld:typeof alignedOldText === 'string',alignedNew:typeof alignedNewText === 'string'},
        timestamp:Date.now(),
      }),
    }).catch(()=>{});
    // #endregion

    // Prefer pre-aligned text if provided from main thread; otherwise normalize raw inputs.
    const normalizedOldText =
      typeof alignedOldText === 'string' ? alignedOldText : normalizeText(oldText, options);
    const normalizedNewText =
      typeof alignedNewText === 'string' ? alignedNewText : normalizeText(newText, options);

    const changes = diffLines(normalizedOldText, normalizedNewText, {
      ignoreWhitespace: Boolean(options.ignoreWhitespace),
    });
    const ranges = buildRanges(changes);
    const basePatch = createTwoFilesPatch(
      'Original.md',
      'Revised.md',
      normalizedOldText,
      normalizedNewText,
      '',
      '',
      {
        // Only include changed blocks so the UI can focus on differing paragraphs/lines
        context: options.contextLines ?? 0,
      },
    );
    const diffText = `diff --git a/Original.md b/Revised.md\nindex 000000..000000 100644\n${basePatch}`;
    const files = parse(diffText);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'H6',
        location:'line-diff-worker.ts:onmessage',
        message:'postMessage success',
        data:{changes:changes.length,ranges:ranges.length},
        timestamp:Date.now(),
      }),
    }).catch(()=>{});
    // #endregion
    safeRespond({ ranges, files, diffText });
  } catch (error) {
    console.error('diff worker failed, falling back to plain diff', error);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        sessionId:'debug-session',
        runId:'run1',
        hypothesisId:'H7',
        location:'line-diff-worker.ts:onmessage',
        message:'catch fallback',
        data:{error:String(error)},
        timestamp:Date.now(),
      }),
    }).catch(()=>{});
    // #endregion

    // Fallback: plain normalization without block alignment to keep UI responsive
    const normalizedOldText = normalizeText(oldText, options);
    const normalizedNewText = normalizeText(newText, options);
    const changes = diffLines(normalizedOldText, normalizedNewText, {
      ignoreWhitespace: Boolean(options.ignoreWhitespace),
    });
    const ranges = buildRanges(changes);
    const basePatch = createTwoFilesPatch(
      'Original.md',
      'Revised.md',
      normalizedOldText,
      normalizedNewText,
      '',
      '',
      {
        context: options.contextLines ?? 0,
      },
    );
    const diffText = `diff --git a/Original.md b/Revised.md\nindex 000000..000000 100644\n${basePatch}`;
    const files = parse(diffText);

    safeRespond({ ranges, files, diffText });
  }
};
