import type { QueueMessage } from '@opennextjs/aws/types/overrides';
import { IgnorableError } from '@opennextjs/aws/utils/error.js';
import { defineCloudflareConfig, getCloudflareContext } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

const wranglerDurableQueue = () => ({
  name: 'durable-queue',
  send: async (msg: QueueMessage) => {
    const { env } = getCloudflareContext();
    const durableObject =
      env.NEXT_CACHE_DO_QUEUE ??
      // Some wrangler templates name the binding `DO_QUEUE`; fall back if present.
      (env as { DO_QUEUE?: unknown })?.DO_QUEUE;

    if (!durableObject) {
      throw new IgnorableError('No durable object binding for cache revalidation');
    }

    const id = durableObject.idFromName(msg.MessageGroupId);
    const stub = durableObject.get(id);
    await stub.revalidate({ ...msg });
  },
});

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: wranglerDurableQueue,
});
