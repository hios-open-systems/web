'use client';
import { useMemo, useState, useRef } from 'react';
import { Button, Input, Tag } from 'antd';
import { useTranslations } from 'next-intl';
import type { PayloadNode } from '@/lib/workbench/payloadEngine';

export function PayloadTree({ nodes, selected, onSelect }: { nodes: PayloadNode[]; selected: number; onSelect: (node: PayloadNode) => void }) {
  const t = useTranslations('Workspace');
  const [expanded, setExpanded] = useState(new Set([0]));
  const [search, setSearch] = useState('');
  const [scroll, setScroll] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => {
    const shown = new Set<number>();
    return nodes.filter(node => {
      const match = search ? `${node.path.join('.')} ${node.type} ${node.preview}`.toLowerCase().includes(search.toLowerCase())
        : node.parent === -1 || (shown.has(node.parent) && expanded.has(node.parent));
      if (match) shown.add(node.id);
      return match;
    });
  }, [nodes, search, expanded]);
  const start = Math.max(0, Math.min(visible.length - 1, Math.floor(scroll / 42) - 5));
  const colors: Record<string, string> = { string: 'green', number: 'blue', boolean: 'purple', object: 'orange', array: 'cyan', null: 'default' };
  return <div>
    <Input value={search} onChange={e => { setSearch(e.target.value); setScroll(0); }} aria-label={t('search')} placeholder={t('search')} />
    <div ref={viewport} role="list" tabIndex={0} aria-label={t('tree')} style={{ height: 420, overflow: 'auto', position: 'relative' }} onScroll={e => setScroll(e.currentTarget.scrollTop)} onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = visible.findIndex(node => node.id === selected);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1 : Math.max(0, Math.min(visible.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)));
      if (visible[index]) onSelect(visible[index]);
      if (viewport.current && (index * 42 < scroll || index * 42 > scroll + 378)) viewport.current.scrollTop = index * 42;
    }}>
      <div style={{ height: visible.length * 42, minWidth: '100%' }}>
        <div style={{ position: 'absolute', top: start * 42, width: '100%' }}>{visible.slice(start, start + 25).map(node => <div role="listitem" key={node.id} style={{ height: 42, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: Math.min(node.depth, 8) * 12 }}>
          {node.children ? <Button size="small" aria-label={`${expanded.has(node.id) ? '−' : '+'} ${node.key}`} aria-expanded={expanded.has(node.id)} onClick={() => setExpanded(current => { const next = new Set(current); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })}>{expanded.has(node.id) ? '−' : '+'}</Button> : null}
          <Button type={selected === node.id ? 'primary' : 'text'} title={`${node.path.join('.')} · ${node.type} · ${node.preview}`} onClick={() => onSelect(node)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{node.key}: {node.preview}</Button><Tag color={colors[node.type]}>{node.type}</Tag>
        </div>)}</div>
      </div>
    </div>
  </div>;
}
