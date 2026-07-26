'use client';

import { Component, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

type Labels = { title: string; subtitle: string; retry: string };

type BoundaryProps = { labels: Labels; children: ReactNode };
type BoundaryState = { failed: boolean };

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  reset = () => this.setState({ failed: false });

  render() {
    if (this.state.failed) {
      const { title, subtitle, retry } = this.props.labels;
      return (
        <Result
          status="error"
          title={title}
          subTitle={subtitle}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={this.reset}>
              {retry}
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

export function ToolErrorBoundary({ children }: { children: ReactNode }) {
  const t = useTranslations('Workbench.error');
  return (
    <Boundary labels={{ title: t('title'), subtitle: t('subtitle'), retry: t('retry') }}>
      {children}
    </Boundary>
  );
}
