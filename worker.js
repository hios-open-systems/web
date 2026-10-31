// OpenNext generates the fetch handler during the build.
import handler from './.open-next/worker.js';
import { pruneUsage } from './lib/analytics/storage.ts';
import { pruneTraffic, recordTraffic } from './lib/traffic/record.ts';

export default {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx);
    // Automatic, server-side traffic stats. Never delays or breaks the response.
    ctx.waitUntil(recordTraffic(env, request, response, request.cf ?? {})
      .catch(() => console.error('traffic_record_failed')));
    return response;
  },
  async scheduled(_event, env) {
    await Promise.allSettled([pruneUsage(env.DB), pruneTraffic(env.DB)]);
  },
};
