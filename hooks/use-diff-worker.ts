'use client';

import { useCallback, useEffect, useRef } from 'react';
import type {
  DiffWorkerRequest,
  DiffWorkerResponse,
} from '@/lib/workers/line-diff-worker';

const log = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

const createWorker = () => {
  try {
    const worker = new Worker(new URL('../lib/workers/line-diff-worker.ts', import.meta.url), {
      type: 'module',
    });
    log('H10a', 'use-diff-worker.ts:createWorker', 'worker constructed', {});

    const logWorkerEvent = (hypothesisId: string, evt: string, payload: Record<string, unknown>) =>
      log(hypothesisId, `use-diff-worker.ts:createWorker:${evt}`, `worker ${evt}`, payload);

    const handleError = (event: ErrorEvent) => {
      logWorkerEvent('H10err', 'error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };
    const handleMessageError = (event: MessageEvent) => {
      logWorkerEvent('H10merr', 'messageerror', { dataType: typeof event.data });
    };
    const handleMessage = (event: MessageEvent) => {
      logWorkerEvent('H10msg', 'message', { keys: Object.keys(event.data ?? {}) });
    };

    worker.addEventListener('error', handleError);
    worker.addEventListener('messageerror', handleMessageError);
    worker.addEventListener('message', handleMessage);

    return worker;
  } catch (error) {
    log('H10e', 'use-diff-worker.ts:createWorker', 'worker construct failed', {
      error: String(error),
    });
    throw error;
  }
};

export const useDiffWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    workerRef.current = createWorker();
    log('H10', 'use-diff-worker.ts:createWorker', 'worker created (effect)', {});

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const runDiff = useCallback(
    (payload: Omit<DiffWorkerRequest, 'requestId'>) =>
      new Promise<DiffWorkerResponse>((resolve, reject) => {
        const worker = workerRef.current ?? (workerRef.current = createWorker());

        const requestId = `diff-${requestIdRef.current++}`;
        const cleanup = () => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          worker.removeEventListener('messageerror', handleMessageError);
        };

        const handleMessage = (event: MessageEvent<DiffWorkerResponse>) => {
          if (event.data.requestId !== requestId) return;

          cleanup();
          log('H12', 'use-diff-worker.ts:runDiff', 'worker message resolved', {
            requestId,
            ranges: event.data.ranges?.length ?? 0,
            files: event.data.files?.length ?? 0,
          });
          resolve(event.data);
        };

        const handleError = (error: ErrorEvent) => {
          cleanup();
          log('H13', 'use-diff-worker.ts:runDiff', 'worker error', {
            requestId,
            message: error.message,
          });
          reject(error.error ?? error);
        };

        const handleMessageError = (event: MessageEvent) => {
          cleanup();
          log('H14', 'use-diff-worker.ts:runDiff', 'worker messageerror', {
            requestId,
            dataType: typeof event.data,
          });
          reject(event as unknown as Error);
        };

        log('H11', 'use-diff-worker.ts:runDiff', 'postMessage', {
          requestId,
          oldLen: payload.oldText.length,
          newLen: payload.newText.length,
        });
        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.addEventListener('messageerror', handleMessageError);
        worker.postMessage({ ...payload, requestId });
      }),
    [],
  );

  return { runDiff };
};
