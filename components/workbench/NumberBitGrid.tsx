import { Typography } from 'antd';
import { bitWidth } from '@/lib/workbench/numberBase';
const { Text } = Typography;
function byteGroups(value: bigint): { index: number; bit: number }[][] {
  const width = bitWidth(value);
  const bits = value.toString(2).padStart(width, '0').split('').map(Number);
  const groups: { index: number; bit: number }[][] = [];
  for (let i = 0; i < bits.length; i += 8) {
    groups.push(bits.slice(i, i + 8).map((bit, j) => ({ index: width - 1 - (i + j), bit })));
  }
  groups.reverse();
  return groups;
}

export function BitGrid({ value, mode }: { value: bigint; mode: 'light' | 'dark' }) {
  const groups = byteGroups(value);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {group.map(({ index }) => (
                <Text key={index} style={{ fontSize: 9, width: 20, textAlign: 'center', color: 'var(--wb-text-muted)' }}>
                  {index}
                </Text>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {group.map(({ index, bit }) => (
                <div
                  key={index}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: bit === 1 ? '#0ea5e9' : (mode === 'dark' ? '#1e293b' : '#e2e8f0'),
                    border: `1px solid ${bit === 1 ? '#0284c7' : mode === 'dark' ? '#334155' : '#cbd5e1'}`,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: bit === 1 ? '#fff' : mode === 'dark' ? '#64748b' : '#94a3b8',
                  }}
                >
                  {bit}
                </div>
              ))}
            </div>
            <Text style={{ fontSize: 9, color: 'var(--wb-text-muted)' }}>byte {gi}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
