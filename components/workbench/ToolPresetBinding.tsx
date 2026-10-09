'use client';
import { useToolBridge } from '@/lib/hooks/useToolBridge';
import { PresetControls } from './PresetControls';

export interface PresetField { value: string; content: boolean; restore: (value: string) => void }
export function booleanField(value: boolean, set: (value: boolean) => void): PresetField {
  return { value: String(value), content: false, restore: next => { if (next === 'true' || next === 'false') set(next === 'true'); } };
}
export function textField<T extends string>(value: T, set: (value: T) => void, options?: readonly T[], content = true): PresetField {
  return { value, content, restore: next => { if (next.length <= 1_000_000 && (!options || options.includes(next as T))) set(next as T); } };
}
export function numberField(value: number | null, set: (value: number) => void, min: number, max: number): PresetField {
  return { value: String(value ?? ''), content: false, restore: next => { const number = Number(next); if (next.trim() && Number.isFinite(number) && number >= min && number <= max) set(number); } };
}
export function ToolPresetBinding({ toolId, fields }: { toolId: string; fields: Record<string, PresetField> }) {
  useToolBridge(toolId, values => { for (const [key, value] of Object.entries(values)) if (Object.hasOwn(fields, key)) fields[key].restore(value); });
  const settings = Object.fromEntries(Object.entries(fields).filter(([, field]) => !field.content).map(([key, field]) => [key, field.value]));
  const content = Object.fromEntries(Object.entries(fields).filter(([, field]) => field.content).map(([key, field]) => [key, field.value]));
  return <PresetControls toolId={toolId} settings={settings} content={content} />;
}
