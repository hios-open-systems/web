'use client';

import { useEffect } from 'react';
import { readUsage, recordUse, writeUsage } from '@/lib/workbench/usage';

/** Records a tool visit in local usage history. Renders nothing. */
export function ToolUsageTracker({ toolId }: { toolId: string }) {
  useEffect(() => {
    writeUsage(recordUse(readUsage(), toolId));
  }, [toolId]);
  return null;
}
