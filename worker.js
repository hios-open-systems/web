// OpenNext generates the fetch handler during the build.
import handler from './.open-next/worker.js';
import { pruneUsage } from './lib/analytics/storage.ts';

export default {
  fetch: handler.fetch,
  async scheduled(_event, env) {
    await pruneUsage(env.DB);
  },
};
