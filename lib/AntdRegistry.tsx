'use client';

import React, { useRef } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useServerInsertedHTML } from 'next/navigation';

const StyledComponentsRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo<Entity>(() => createCache(), []);
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return undefined;
    inserted.current = true;
    return <style id="antd-cssinjs" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />;
  });
  return <StyleProvider cache={cache}>{children}</StyleProvider>;
};

export default StyledComponentsRegistry;
