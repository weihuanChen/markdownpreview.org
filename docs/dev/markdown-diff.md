# Role
You are a Lead Frontend Architect specializing in Data Visualization and Document Auditing tools.

# Project Goal
Build a professional-grade **Markdown Source Diff Tool** similar to `TextCompare.org` or `Beyond Compare`.
**Core Requirement**: The user must instantly and unambiguously distinguish between **"Text Removed from Original"** and **"Text Added to Comparison"**. The UI must facilitate precise navigation to these specific changes.

# Technology Stack
* **React** (Hooks + Functional Components)
* **react-diff-view** (UI Rendering)
* **diff** & **gitdiff-parser** (Data processing)
* **Web Workers** (Off-main-thread processing)

# Critical UX/UI Requirements (Strict Constraints)

## 1. Explicit Visual Semantics (The "What Happened" Logic)
You must implement a **Split View** (Side-by-Side) layout. Unified view is FORBIDDEN.
* **Left Column (Base/Original)**:
    * Represents the "Old State".
    * Only highlights **DELETIONS** (Red background).
    * If text exists here but not on the right, it means "Text was removed".
* **Right Column (Compare/New)**:
    * Represents the "New State".
    * Only highlights **ADDITIONS** (Green background).
    * If text exists here but not on the left, it means "Text was added".
* **Alignment**: The lines must be perfectly aligned. If a block is added on the right, the left side must show empty space (ghost lines) to maintain alignment.

## 2. Layered Intra-line Highlighting (The Precision Logic)
Users need to see *exactly* which words changed, not just the whole line.
* **Level 1 (Line Diff)**: Light background color for the entire changed line (e.g., Light Red / Light Green).
* **Level 2 (Word Diff)**: Darker/Saturated background color for the specific **words/characters** that changed (e.g., Dark Red / Dark Green).
* **Implementation**: Use `markEdits(hunks, { type: 'block' })` from `react-diff-view` to generate these token-level differences.

## 3. Navigation & Locatability (The "Where" Logic)
Users must be able to jump between changes efficiently.
* **Change Counter**: Display "Change X of Y".
* **Navigator**: "Previous" and "Next" buttons.
* **Auto-Scroll**: Clicking Next/Prev must smoothly scroll the specific change into the viewport (`scrollIntoView`).
* **Synchronized Scrolling**: When the user scrolls the Left column, the Right column MUST scroll synchronously (and vice-versa).

# Implementation Steps

## Step 1: Web Worker (`diff.worker.js`)
* Receive `oldText` and `newText`.
* Generate patch using `diff.createTwoFilesPatch`.
* Parse patch using `gitdiff-parser`.
* **Optimization**: If possible, run `markEdits` logic INSIDE the worker to offload the tokenization cost, returning fully processed hunks to the main thread.

## Step 2: Smart Diff Component (`DiffViewer.jsx`)
* **State**: `hunks` (data), `diffType="modify"`, `viewType="split"`.
* **Render**:
    * Iterate through `hunks`.
    * For each `Hunk`, attach a predictable DOM ID (e.g., `id="diff-hunk-${index}"`) for the navigator to find.
    * Use `<Decoration>` or custom renderers if needed to ensure the "Ghost Lines" (empty space) are rendered correctly for alignment.

## Step 3: Navigation Controller (`DiffNavigator.jsx`)
* Logic: Keep track of `currentChangeIndex`.
* Action: Find the DOM element `#diff-hunk-${index}` and execute scroll logic.

## Step 4: Visual Polish (`styles.css`)
* Define variables for semantic colors to ensure clarity:
    * `--diff-del-line`: `rgba(255, 0, 0, 0.1)` (Light Red)
    * `--diff-del-word`: `rgba(255, 0, 0, 0.4)` (Darker Red - Impact)
    * `--diff-add-line`: `rgba(0, 255, 0, 0.1)` (Light Green)
    * `--diff-add-word`: `rgba(0, 255, 0, 0.4)` (Darker Green - Impact)
* Ensure code font (Monospace) is used for alignment.

# Output Request
Provide the complete, copy-pasteable code for:
1.  `diff.worker.js` (Calculation & Tokenization)
2.  `DiffViewer.jsx` (Rendering & Navigation Logic)
3.  `styles.css` (The semantic coloring)