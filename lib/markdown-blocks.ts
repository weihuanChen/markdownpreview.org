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
    const text = sliceByLines(lines, startLine, endLine);

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
  const oldBlocks = parseMarkdownToBlocks(oldText).map((block) => ({
    ...block,
    normalized: normalizeText(block.text, options),
  }));
  const newBlocks = parseMarkdownToBlocks(newText).map((block) => ({
    ...block,
    normalized: normalizeText(block.text, options),
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

