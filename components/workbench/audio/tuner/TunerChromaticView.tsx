'use client';
import { Typography } from 'antd';
import { NOTE_NAMES } from '@/lib/workbench/noteFreq';

const { Text } = Typography;

interface Props {
  detected: { frequency: number; clarity: number } | null;
  chroma: { note: string; octave: number; cents: number } | null;
  active: boolean;
  inTune: boolean;
}

export function TunerChromaticView({ detected, chroma, active, inTune }: Props) {
  const activeNote = chroma?.note ?? null;
  const cents = chroma?.cents ?? 0;
  const absCents = Math.abs(cents);
  const tuned = inTune || (active && absCents <= 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', padding: '8px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', width: '100%', maxWidth: 380 }}>
        {NOTE_NAMES.map((n) => {
          const isSelected = active && activeNote === n;
          return (
            <div
              key={n}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-stack-mono)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 14,
                border: isSelected
                  ? `2px solid ${tuned ? '#22c55e' : 'var(--accent, #14b8a6)'}`
                  : '1px solid var(--hios-border)',
                background: isSelected
                  ? tuned
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'color-mix(in srgb, var(--accent, #14b8a6) 20%, transparent)'
                  : 'var(--hios-bg-secondary)',
                color: isSelected
                  ? tuned
                    ? '#22c55e'
                    : 'var(--accent, #14b8a6)'
                  : 'var(--hios-text-secondary)',
                boxShadow: isSelected
                  ? tuned
                    ? '0 0 10px rgba(34,197,94,0.4)'
                    : '0 0 10px rgba(20,184,166,0.3)'
                  : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              {n}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minHeight: 48 }}>
        <Text strong style={{ fontSize: 22, color: tuned ? '#22c55e' : undefined }}>
          {chroma ? `${chroma.note}${chroma.octave}` : '—'}
        </Text>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-stack-mono)', color: 'var(--hios-text-secondary)' }}>
          {chroma && detected
            ? `${detected.frequency.toFixed(1)} Hz · ${cents > 0 ? `+${cents} cents (Alta)` : `${cents} cents (Baja)`}`
            : active
              ? 'Tocá cualquier nota…'
              : 'Micrófono inactivo'}
        </span>
      </div>
    </div>
  );
}
