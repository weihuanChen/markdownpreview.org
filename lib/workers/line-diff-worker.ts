/// <reference lib="webworker" />
import { createTwoFilesPatch, diffLines, type Change } from 'diff';
import { parse, type File } from 'gitdiff-parser';

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
  const {
    oldText = '',
    newText = '',
    alignedOldText,
    alignedNewText,
    options = {},
    requestId,
  } = event.data ?? {};

  const safeRespond = (payload: Omit<DiffWorkerResponse, 'requestId'>) => {
    self.postMessage({ ...payload, requestId } satisfies DiffWorkerResponse);
  };

  try {
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

    safeRespond({ ranges, files, diffText });
  } catch (error) {
    console.error('diff worker failed, falling back to plain diff', error);

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
