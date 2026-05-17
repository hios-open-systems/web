'use client';

import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useServerInsertedHTML } from 'next/navigation';

// NOTE: under the Cloudflare edge runtime you may see, in logs only,
// `ERR_INVALID_STATE: Unable to enqueue` at `Object.flush` when a browser
// cancels an SSR/RSC stream mid-flight (prefetch + fast navigation): React
// tries to flush this antd style tag into an already-closed stream. It is
// benign — normal page loads render and are styled correctly. The clean fix
// (Node runtime) is not available here because the site deploys on
// Cloudflare, which requires the edge runtime. Do not "fix" by switching
// runtime. See memory: project_antd_edge_flush.
const StyledComponentsRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo<Entity>(() => createCache(), []);
  useServerInsertedHTML(() => (
    <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  ));
  return <StyleProvider cache={cache}>{children}</StyleProvider>;
};

export default StyledComponentsRegistry;
