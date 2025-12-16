import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import type { Content, Heading } from 'mdast';

import type { DiffWorkerOptions } from './workers/line-diff-worker';

export type MarkdownBlock = {
  type:
    | 'heading'
    | 'list'
    | 'blockquote'
    | 'code'
    | 'table'
    | 'paragraph'
    | 'break'
    | 'html'
    | 'other';
  depth?: number;
  text: string;
  // Optional structured data for specialized diff strategies
  cells?: string[][];
};

const resolveBlockType = (node: Content): MarkdownBlock['type'] => {
  if (node.type === 'heading') return 'heading';
  if (node.type === 'list') return 'list';
  if (node.type === 'blockquote') return 'blockquote';
  if (node.type === 'code') return 'code';
  if (node.type === 'table') return 'table';
  if (node.type === 'thematicBreak') return 'break';
  if (node.type === 'html') return 'html';
  if (node.type === 'paragraph') return 'paragraph';
  return 'other';
};

const sliceByLines = (lines: string[], start: number, end: number) =>
  lines.slice(Math.max(0, start - 1), Math.min(lines.length, end)).join('\n');

const stripListMarker = (line: string) => line.replace(/^(\s*)(?:[-*+]|\d+\.)\s+/, '$1');

const normalizeListItemLines = (rawLines: string[]) => {
  if (!rawLines.length) return rawLines;

  const [first, ...rest] = rawLines;
  const firstLine = stripListMarker(first);

  const minIndent = rest.reduce<number | null>((acc, line) => {
    if (!line.trim()) return acc;
    const current = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    return acc === null ? current : Math.min(acc, current);
  }, null);

  const trimmedRest =
    minIndent && minIndent > 0 ? rest.map((line) => line.slice(minIndent)) : rest;

  return [firstLine, ...trimmedRest];
};

const flattenText = (node: Content): string => {
  if ('value' in node && typeof (node as any).value === 'string') {
    return String((node as any).value);
  }

  if ('children' in node && Array.isArray((node as any).children)) {
    return (node as any).children.map((child: Content) => flattenText(child)).join('');
  }

  return '';
};

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

export const parseMarkdownToBlocks = (markdown: string): MarkdownBlock[] => {
  if (!markdown.trim()) return [];

  const root = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const lines = markdown.split(/\r\n|\r|\n/);
  const blocks: MarkdownBlock[] = [];

  for (const node of root.children) {
    const position = node.position;
    if (!position?.start || !position?.end) continue;

    if (node.type === 'list') {
      const list = node;
      const listItems = (list as any).children ?? [];

      for (const item of listItems) {
        const itemPosition = item?.position;
        if (!itemPosition?.start || !itemPosition?.end) continue;
        const startLine = itemPosition.start.line || 1;
        const endLine = itemPosition.end.line || startLine;
        const itemLines = sliceByLines(lines, startLine, endLine).split('\n');
        const normalizedLines = normalizeListItemLines(itemLines);
        blocks.push({
          type: 'list',
          text: normalizedLines.join('\n'),
        });
      }
      continue;
    }

    let type = resolveBlockType(node);
    let depth = node.type === 'heading' ? (node as Heading).depth : undefined;

    // Treat deeper headings as regular paragraphs to keep them in the diff while only
    // using H1/H2 as explicit section boundaries.
    if (type === 'heading' && depth && depth > 2) {
      type = 'paragraph';
      depth = undefined;
    }

    const startLine = position.start.line || 1;
    const endLine = position.end.line || startLine;
    const text =
      type === 'code' && 'value' in node && typeof (node as any).value === 'string'
        ? String((node as any).value)
        : sliceByLines(lines, startLine, endLine);

    if (type === 'table') {
      const rows = (node as any).children ?? [];
      const cells: string[][] = rows.map((row: any) => {
        const rowCells = row?.children ?? [];
        return rowCells.map((cell: any) => flattenText(cell as Content));
      });
      blocks.push({ type, depth, text, cells });
      continue;
    }

    blocks.push({ type, depth, text });
  }

  return blocks.length
    ? blocks
    : [
        {
          type: 'other',
          text: markdown,
        },
      ];
};

export const buildAlignedText = (
  oldText: string,
  newText: string,
  options: DiffWorkerOptions,
) => {
  const normalizeBlock = (block: MarkdownBlock) => {
    if (block.type === 'table' && block.cells?.length) {
      const lines = block.cells.flatMap((row, rowIndex) =>
        row.map((cell, cellIndex) => {
          const normalizedCell = normalizeText(cell, options);
          return `row:${rowIndex + 1}|col:${cellIndex + 1}|${normalizedCell}`;
        }),
      );
      return lines.join('\n');
    }

    if (block.type === 'code') {
      return normalizeText(block.text, {
        ...options,
        ignoreLineEndings: true,
      });
    }

    return normalizeText(block.text, options);
  };

  const oldBlocks = parseMarkdownToBlocks(oldText).map((block) => ({
    ...block,
    normalized: normalizeBlock(block),
  }));
  const newBlocks = parseMarkdownToBlocks(newText).map((block) => ({
    ...block,
    normalized: normalizeBlock(block),
  }));

  const oldSegments: string[] = [];
  const newSegments: string[] = [];

  const max = Math.max(oldBlocks.length, newBlocks.length);
  for (let i = 0; i < max; i += 1) {
    oldSegments.push(oldBlocks[i]?.normalized ?? '');
    newSegments.push(newBlocks[i]?.normalized ?? '');
  }

  const joiner = '\n\n';
  return {
    normalizedOldText: oldSegments.join(joiner),
    normalizedNewText: newSegments.join(joiner),
    blockCount: Math.max(oldBlocks.length, newBlocks.length),
  };
};
