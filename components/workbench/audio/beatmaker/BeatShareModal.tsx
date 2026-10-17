'use client';

import React, { useState } from 'react';
import { Button, Input, Modal, Typography, message } from 'antd';
import { CopyOutlined, CheckOutlined, BranchesOutlined } from '@ant-design/icons';
import { serializeBeat, type BeatProject } from '@/lib/workbench/beatmaker.ts';

const { Text, Paragraph } = Typography;

interface BeatShareModalProps {
  open: boolean;
  project: BeatProject;
  onClose: () => void;
}

export function BeatShareModal({ open, project, onClose }: BeatShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareCode = serializeBeat(project);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/workbench/beatmaker?beat=${shareCode}`
    : `https://openhios.dev/workbench/beatmaker?beat=${shareCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success('Enlace de beat copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      message.error('No se pudo copiar automáticamente');
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BranchesOutlined style={{ color: '#10b981' }} />
          <span>Compartir & Forkear Beat</span>
        </div>
      }
      open={open}
      onOk={onClose}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button key="copy" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy}>
          {copied ? 'Copiado' : 'Copiar enlace'}
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
        <div>
          <Text strong style={{ fontSize: 15 }}>{project.name}</Text>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            {project.bpm} BPM · 16 pasos · {project.tracks.filter((t) => t.steps.some((s) => s.active)).length} pistas activas
          </div>
          {project.forkedFrom && (
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
              🌿 Versión forkeada de: <strong>{project.forkedFrom}</strong>
            </div>
          )}
        </div>

        <Paragraph type="secondary" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Compartí esta base para improvisar o colaborar. Quien abra el enlace podrá escuchar el loop en tiempo real y hacer clic en <strong>Forkear</strong> para remixar patrones, melodías y baterías directamente en su navegador.
        </Paragraph>

        <div>
          <Text style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Enlace directo (incluye el beat completo):</Text>
          <Input.Search
            readOnly
            value={shareUrl}
            enterButton={copied ? 'Copiado' : 'Copiar'}
            onSearch={handleCopy}
          />
        </div>
      </div>
    </Modal>
  );
}
