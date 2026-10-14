'use client';
import { useState } from 'react';
import { Button, Input, InputNumber, Space, Tooltip, Typography } from 'antd';
import type { ComposerState } from './useComposerState';
const { Text } = Typography;
export function ArrangementPanel({ c }: { c: ComposerState }) {
  const [sectionName, setSectionName] = useState('');
  const patterns = c.song.patterns ?? [];
  const arrangement = c.song.arrangement ?? [];
  const patternName = (id: string) => patterns.find((p) => p.id === id)?.name ?? '';
  return (
    <div>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space wrap size={8} align="center">
          <Text type="secondary">Secciones</Text>
          <Input
            size="small"
            placeholder="nombre de la sección"
            style={{ width: 180 }}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
          />
          <Tooltip title="Guarda las pistas actuales como una sección reusable.">
            <Button
              size="small"
              onClick={() => {
                c.saveAsPattern(sectionName);
                setSectionName('');
              }}
            >
              Guardar sección
            </Button>
          </Tooltip>
        </Space>

        {patterns.length > 0 && (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {patterns.map((p) => (
              <Space key={p.id} wrap size={6}>
                <Text style={{ minWidth: 120 }}>{p.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {p.lengthBars} comp.
                </Text>
                <Button size="small" onClick={() => c.loadPattern(p.id)}>
                  Cargar
                </Button>
                <Button size="small" onClick={() => c.addClip(p.id)}>
                  + arreglo
                </Button>
                <Button size="small" danger onClick={() => c.deletePattern(p.id)}>
                  Borrar
                </Button>
              </Space>
            ))}
          </Space>
        )}

        {arrangement.length > 0 && (
          <>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Arreglo (patrón · compás de inicio)
            </Text>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {arrangement.map((clip) => (
                <Space key={clip.id} wrap size={6}>
                  <Text style={{ minWidth: 120 }}>{patternName(clip.patternId)}</Text>
                  <InputNumber
                    aria-label={`Compás de inicio de ${patternName(clip.patternId)}`}
                    size="small"
                    min={1}
                    precision={0}
                    value={clip.startBar + 1}
                    onChange={(v) => {
                      if (v !== null) c.setClipBar(clip.id, v - 1);
                    }}
                  />
                  <Button size="small" danger onClick={() => c.removeClip(clip.id)}>
                    Quitar
                  </Button>
                </Space>
              ))}
            </Space>
            <Button type="primary" onClick={c.compileArrangementNow}>
              Aplicar arreglo al piano
            </Button>
          </>
        )}
      </Space>
    </div>
  );
}
