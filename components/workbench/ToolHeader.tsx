'use client';

import React, { useContext } from 'react';
import { Space } from 'antd';
import { PageIntro } from '@/components/ui/PageIntro';
import { activityFor } from '@/lib/workbench/discovery';
import { LocalityBadge, type Locality } from './LocalityBadge';
import { ToolGuide } from './ToolGuide';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { ToolHeaderRenderedContext } from './ToolHeaderContext';
import styles from './workbench.module.css';
import { usePathname } from 'next/navigation';
import { workbenchTools } from '@/config/workbench';
import { SaveToSpace } from './SaveToSpace';

interface ToolHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  locality: Locality;
  /** Action buttons (load example, clear, copy, …). */
  actions?: React.ReactNode;
  /** Key into Workbench.guides.* — renders a collapsible "how to use" panel. */
  guideId?: string;
}

/**
 * Shared landing header for every workbench tool. One component keeps the
 * tools visually consistent and lets the catalog grow without each tool
 * hand-rolling its own header slab.
 */
export function ToolHeader({ eyebrow, title, description, locality, actions, guideId }: ToolHeaderProps) {
  const headerRendered = useContext(ToolHeaderRenderedContext);
  const pathname = usePathname();
  const tool = workbenchTools.find((item) => pathname.endsWith(item.href));
  if (headerRendered) {
    return actions ? <div className={styles.toolHeaderActions}>{actions}</div> : null;
  }
  return (
    <PageIntro
      compact
      eyebrow={eyebrow}
      title={title}
      description={description}
      area={tool ? activityFor(tool) : 'development'}
      meta={
        <Space size={8} wrap>
          <LocalityBadge kind={locality} />
          <FeedbackButton />
        </Space>
      }
      actions={
        <>
          {tool ? <SaveToSpace resourceId={`tool:${tool.id}`} /> : null}
          {actions}
        </>
      }
    >
      {guideId ? <ToolGuide guideId={guideId} /> : null}
    </PageIntro>
  );
}
