/// <reference lib="webworker" />
import { createTwoFilesPatch, diffLines, type Change } from 'diff';
import { parse, type File } from 'gitdiff-parser';

export type DiffWorkerRequest = {
  oldText: string;
  newText: string;
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

const countLines = (value: string) => {
  if (!value) return 0;
  return value.split(/\r\n|\r|\n/).length;
};

const getLineCount = (change: Change) => change.count ?? countLines(change.value);

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
  const { oldText = '', newText = '', requestId } = event.data ?? {};
  const changes = diffLines(oldText, newText);
  const ranges = buildRanges(changes);
  const basePatch = createTwoFilesPatch('Original.md', 'Revised.md', oldText, newText, '', '', {
    // Only include changed blocks so the UI can focus on differing paragraphs/lines
    context: 0,
  });
  const diffText = `diff --git a/Original.md b/Revised.md\nindex 000000..000000 100644\n${basePatch}`;
  const files = parse(diffText);

  self.postMessage({ ranges, files, diffText, requestId } satisfies DiffWorkerResponse);
};
