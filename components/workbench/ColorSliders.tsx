'use client';
import { Card, Slider, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import styles from './workbench.module.css';
const { Text } = Typography;
export function ColorSliders({ rgb, hsl, updateFromRgb, updateFromHsl }: {
  rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number };
  updateFromRgb: (r: number, g: number, b: number) => void;
  updateFromHsl: (h: number, s: number, l: number) => void;
}) {
  const t = useTranslations('Workbench.color');
  return <>
            <Card title={t('sliders')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
              {/* RGB sliders */}
              {(['r', 'g', 'b'] as const).map((ch) => (
                <div key={ch} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12 }}>{ch.toUpperCase()}</Text>
                    <Text style={{ fontSize: 12 }}>{rgb[ch]}</Text>
                  </div>
                  <Slider
                    ariaLabelForHandle={ch.toUpperCase()}
                    min={0}
                    max={255}
                    value={rgb[ch]}
                    onChange={(v) =>
                      updateFromRgb(
                        ch === 'r' ? v : rgb.r,
                        ch === 'g' ? v : rgb.g,
                        ch === 'b' ? v : rgb.b,
                      )
                    }
                    styles={{ track: { background: ch === 'r' ? '#ef4444' : ch === 'g' ? '#22c55e' : '#3b82f6' } }}
                  />
                </div>
              ))}
              {/* HSL sliders */}
              {(['h', 's', 'l'] as const).map((ch) => {
                const max = ch === 'h' ? 360 : 100;
                const val = hsl[ch];
                return (
                  <div key={ch} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12 }}>
                        {ch.toUpperCase()}{ch !== 'h' ? '%' : '°'}
                      </Text>
                      <Text style={{ fontSize: 12 }}>{val}{ch === 'h' ? '°' : '%'}</Text>
                    </div>
                    <Slider
                      min={0}
                      max={max}
                      value={val}
                      onChange={(v) =>
                        updateFromHsl(
                          ch === 'h' ? v : hsl.h,
                          ch === 's' ? v : hsl.s,
                          ch === 'l' ? v : hsl.l,
                        )
                      }
                    />
                  </div>
                );
              })}
            </Card>
  </>;
}
