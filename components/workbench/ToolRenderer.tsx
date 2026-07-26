'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { WorkbenchToolId } from '@/config/workbench';

// Each tool is a client-only dynamic import. This keeps the heavy tool
// components (antd-laden, plus mermaid/excalidraw via their own dynamic
// imports) OUT of the server/edge bundle for /workbench/[tool] — only the
// chunk for the opened tool is fetched. Before this, the static switch pulled
// every tool into one ~4 MB edge function and blew Cloudflare's worker limits.
const TOOLS: Partial<Record<WorkbenchToolId, ComponentType>> = {
  'tone-generator': dynamic(() => import('@/components/workbench/audio/ToneGeneratorTool').then((m) => m.ToneGeneratorTool), { ssr: false }),
  'guitar-tuner': dynamic(() => import('@/components/workbench/audio/GuitarTunerTool').then((m) => m.GuitarTunerTool), { ssr: false }),
  'spectrum-analyzer': dynamic(() => import('@/components/workbench/audio/SpectrumAnalyzerTool').then((m) => m.SpectrumAnalyzerTool), { ssr: false }),
  'level-meter': dynamic(() => import('@/components/workbench/audio/LevelMeterTool').then((m) => m.LevelMeterTool), { ssr: false }),
  'metronome': dynamic(() => import('@/components/workbench/audio/MetronomeTool').then((m) => m.MetronomeTool), { ssr: false }),
  'beat-counter': dynamic(() => import('@/components/workbench/audio/BeatCounterTool').then((m) => m.BeatCounterTool), { ssr: false }),
  'delay-calculator': dynamic(() => import('@/components/workbench/audio/DelayCalculatorTool').then((m) => m.DelayCalculatorTool), { ssr: false }),
  'note-frequency': dynamic(() => import('@/components/workbench/audio/NoteFrequencyTool').then((m) => m.NoteFrequencyTool), { ssr: false }),
  // 'chiptune' se consolidó en /composer (ver app/[locale]/composer + workbench/chiptune redirect).
  'audio-convert': dynamic(() => import('@/components/workbench/audio/AudioConvertTool').then((m) => m.AudioConvertTool), { ssr: false }),
  'image-convert': dynamic(() => import('@/components/workbench/ImageConvertTool').then((m) => m.ImageConvertTool), { ssr: false }),
  'type-checker': dynamic(() => import('@/components/workbench/TypeCheckerTool').then((m) => m.TypeCheckerTool), { ssr: false }),
  'jwt-decode': dynamic(() => import('@/components/workbench/JwtPlaygroundTool').then((m) => m.JwtPlaygroundTool), { ssr: false }),
  'dns-lookup': dynamic(() => import('@/components/workbench/DnsLookupTool').then((m) => m.DnsLookupTool), { ssr: false }),
  'subnet-calculator': dynamic(() => import('@/components/workbench/SubnetCalculatorTool').then((m) => m.SubnetCalculatorTool), { ssr: false }),
  'whois-rdap': dynamic(() => import('@/components/workbench/WhoisRdapTool').then((m) => m.WhoisRdapTool), { ssr: false }),
  'certificate-check': dynamic(() => import('@/components/workbench/CertificateCheckTool').then((m) => m.CertificateCheckTool), { ssr: false }),
  'hash-digest': dynamic(() => import('@/components/workbench/HashDigestTool').then((m) => m.HashDigestTool), { ssr: false }),
  'usage-analytics': dynamic(() => import('@/components/workbench/UsageAnalyticsTool').then((m) => m.UsageAnalyticsTool), { ssr: false }),
  'encoder': dynamic(() => import('@/components/workbench/EncoderTool').then((m) => m.EncoderTool), { ssr: false }),
  'uuid-ulid': dynamic(() => import('@/components/workbench/UuidUlidTool').then((m) => m.UuidUlidTool), { ssr: false }),
  'regex': dynamic(() => import('@/components/workbench/RegexTesterTool').then((m) => m.RegexTesterTool), { ssr: false }),
  'text-diff': dynamic(() => import('@/components/workbench/TextDiffTool').then((m) => m.TextDiffTool), { ssr: false }),
  'mermaid': dynamic(() => import('@/components/workbench/MermaidTool').then((m) => m.MermaidTool), { ssr: false }),
  'excalidraw': dynamic(() => import('@/components/workbench/ExcalidrawTool').then((m) => m.ExcalidrawTool), { ssr: false }),
  'notes': dynamic(() => import('@/components/workbench/MarkdownNotesTool').then((m) => m.MarkdownNotesTool), { ssr: false }),
  'patterns': dynamic(() => import('@/components/workbench/PatternsTool').then((m) => m.PatternsTool), { ssr: false }),
  'object-to-types': dynamic(() => import('@/components/workbench/ObjectToTypesTool').then((m) => m.ObjectToTypesTool), { ssr: false }),
  'random-string': dynamic(() => import('@/components/workbench/RandomStringTool').then((m) => m.RandomStringTool), { ssr: false }),
  'object-compare': dynamic(() => import('@/components/workbench/ObjectComparatorTool').then((m) => m.ObjectComparatorTool), { ssr: false }),
  'site-checker': dynamic(() => import('@/components/workbench/SiteCheckerTool').then((m) => m.SiteCheckerTool), { ssr: false }),
  'cron': dynamic(() => import('@/components/workbench/CronTool').then((m) => m.CronTool), { ssr: false }),
  'color': dynamic(() => import('@/components/workbench/ColorTool').then((m) => m.ColorTool), { ssr: false }),
  'timestamp': dynamic(() => import('@/components/workbench/TimestampTool').then((m) => m.TimestampTool), { ssr: false }),
  'number-base': dynamic(() => import('@/components/workbench/NumberBaseTool').then((m) => m.NumberBaseTool), { ssr: false }),
  'json-schema': dynamic(() => import('@/components/workbench/JsonSchemaTool').then((m) => m.JsonSchemaTool), { ssr: false }),
  'url-parser': dynamic(() => import('@/components/workbench/UrlParserTool').then((m) => m.UrlParserTool), { ssr: false }),
  'image-base64': dynamic(() => import('@/components/workbench/ImageBase64Tool').then((m) => m.ImageBase64Tool), { ssr: false }),
  'resistor-color-code': dynamic(() => import('@/components/workbench/ResistorColorCodeTool').then((m) => m.ResistorColorCodeTool), { ssr: false }),
  'ohms-law': dynamic(() => import('@/components/workbench/OhmsLawTool').then((m) => m.OhmsLawTool), { ssr: false }),
  'http-status-codes': dynamic(() => import('@/components/workbench/HttpStatusCodesTool').then((m) => m.HttpStatusCodesTool), { ssr: false }),
  'ascii-unicode': dynamic(() => import('@/components/workbench/AsciiUnicodeTool').then((m) => m.AsciiUnicodeTool), { ssr: false }),
  'ipv6-expand': dynamic(() => import('@/components/workbench/Ipv6ExpandTool').then((m) => m.Ipv6ExpandTool), { ssr: false }),
  'hmac': dynamic(() => import('@/components/workbench/HmacTool').then((m) => m.HmacTool), { ssr: false }),
  'csv-json': dynamic(() => import('@/components/workbench/CsvJsonTool').then((m) => m.CsvJsonTool), { ssr: false }),
};

export function ToolRenderer({ toolId }: { toolId: WorkbenchToolId }) {
  const Tool = TOOLS[toolId];
  return Tool ? <Tool /> : null;
}
