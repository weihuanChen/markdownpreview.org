'use client';

import { useCallback, useEffect, useRef } from 'react';
import type {
  DiffWorkerRequest,
  DiffWorkerResponse,
} from '@/lib/workers/line-diff-worker';

const createWorker = () =>
  new Worker(new URL('../lib/workers/line-diff-worker.ts', import.meta.url), {
    type: 'module',
  });

export const useDiffWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    workerRef.current = createWorker();

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
        };

        const handleMessage = (event: MessageEvent<DiffWorkerResponse>) => {
          if (event.data.requestId !== requestId) return;

          cleanup();
          resolve(event.data);
        };

        const handleError = (error: ErrorEvent) => {
          cleanup();
          reject(error.error ?? error);
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.postMessage({ ...payload, requestId });
      }),
    [],
  );

  return { runDiff };
};
