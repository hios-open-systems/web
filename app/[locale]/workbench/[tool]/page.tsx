import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CertificateCheckTool } from '@/components/workbench/CertificateCheckTool';
import { DnsLookupTool } from '@/components/workbench/DnsLookupTool';
import { JwtPlaygroundTool } from '@/components/workbench/JwtPlaygroundTool';
import { ObjectToTypesTool } from '@/components/workbench/ObjectToTypesTool';
import { ObjectComparatorTool } from '@/components/workbench/ObjectComparatorTool';
import { HashDigestTool } from '@/components/workbench/HashDigestTool';
import { EncoderTool } from '@/components/workbench/EncoderTool';
import { UuidUlidTool } from '@/components/workbench/UuidUlidTool';
import { RegexTesterTool } from '@/components/workbench/RegexTesterTool';
import { TextDiffTool } from '@/components/workbench/TextDiffTool';
import { MermaidTool } from '@/components/workbench/MermaidTool';
import { ExcalidrawTool } from '@/components/workbench/ExcalidrawTool';
import { MarkdownNotesTool } from '@/components/workbench/MarkdownNotesTool';
import { PatternsTool } from '@/components/workbench/PatternsTool';
import { RandomStringTool } from '@/components/workbench/RandomStringTool';
import { SiteCheckerTool } from '@/components/workbench/SiteCheckerTool';
import { SubnetCalculatorTool } from '@/components/workbench/SubnetCalculatorTool';
import { CronTool } from '@/components/workbench/CronTool';
import { ColorTool } from '@/components/workbench/ColorTool';
import { TimestampTool } from '@/components/workbench/TimestampTool';
import { NumberBaseTool } from '@/components/workbench/NumberBaseTool';
import { JsonSchemaTool } from '@/components/workbench/JsonSchemaTool';
import { UrlParserTool } from '@/components/workbench/UrlParserTool';
import { RegexTool } from '@/components/workbench/RegexTool';
import { ImageBase64Tool } from '@/components/workbench/ImageBase64Tool';
import { UsageAnalyticsTool } from '@/components/workbench/UsageAnalyticsTool';
import { TypeCheckerTool } from '@/components/workbench/TypeCheckerTool';
import { WhoisRdapTool } from '@/components/workbench/WhoisRdapTool';
import { BeatCounterTool } from '@/components/workbench/audio/BeatCounterTool';
import { DelayCalculatorTool } from '@/components/workbench/audio/DelayCalculatorTool';
import { GuitarTunerTool } from '@/components/workbench/audio/GuitarTunerTool';
import { LevelMeterTool } from '@/components/workbench/audio/LevelMeterTool';
import { MetronomeTool } from '@/components/workbench/audio/MetronomeTool';
import { SpectrumAnalyzerTool } from '@/components/workbench/audio/SpectrumAnalyzerTool';
import { ToneGeneratorTool } from '@/components/workbench/audio/ToneGeneratorTool';
import { NoteFrequencyTool } from '@/components/workbench/audio/NoteFrequencyTool';
import { ResistorColorCodeTool } from '@/components/workbench/ResistorColorCodeTool';
import { OhmsLawTool } from '@/components/workbench/OhmsLawTool';
import { HttpStatusCodesTool } from '@/components/workbench/HttpStatusCodesTool';
import { AsciiUnicodeTool } from '@/components/workbench/AsciiUnicodeTool';
import { Ipv6ExpandTool } from '@/components/workbench/Ipv6ExpandTool';
import { HmacTool } from '@/components/workbench/HmacTool';
import { CsvJsonTool } from '@/components/workbench/CsvJsonTool';
import { ToolPager } from '@/components/workbench/ToolPager';
import { ToolUsageTracker } from '@/components/workbench/ToolUsageTracker';
import { getWorkbenchTool, workbenchTools, type WorkbenchToolId } from '@/config/workbench';

const dynamicToolIds = workbenchTools
  .filter((tool) => !tool.external && !['payload', 'snippets'].includes(tool.id))
  .map((tool) => tool.id);

const metadataMap: Record<string, Metadata> = {
  'tone-generator': {
    title: 'Generador de señal | HIOS Audio Lab',
    description: 'Genera tonos, ruido, sweeps y pruebas L/R para cadenas de audio desde el navegador.',
  },
  'guitar-tuner': {
    title: 'Afinador de guitarra | HIOS Audio Lab',
    description: 'Afinador cromatico local con deteccion de pitch desde el microfono.',
  },
  'spectrum-analyzer': {
    title: 'Analizador de espectro | HIOS Audio Lab',
    description: 'FFT en tiempo real para inspeccionar energia por frecuencia desde el navegador.',
  },
  'level-meter': {
    title: 'Medidor de nivel | HIOS Audio Lab',
    description: 'Mide nivel relativo desde el microfono para comparar volumen, ruido y picos de señal.',
  },
  'metronome': {
    title: 'Metrónomo | HIOS Audio Lab',
    description: 'Click musical configurable con tempo, pulsos y subdivisiones.',
  },
  'beat-counter': {
    title: 'Beat counter | HIOS Audio Lab',
    description: 'Calcula BPM marcando el pulso con clicks o barra espaciadora.',
  },
  'delay-calculator': {
    title: 'Calculadora de delay | HIOS Audio Lab',
    description: 'Convierte BPM a delays musicales y milisegundos a distancia acústica.',
  },
  'jwt-decode': {
    title: 'JWT Playground | HIOS Workbench',
    description: 'Decodifica, firma y verifica JWT (HS, RS, ES) enteramente en el navegador. El token y las claves nunca salen de tu equipo.',
  },
  'type-checker': {
    title: 'Type Checker | HIOS Workbench',
    description: 'Valida en el navegador si un JSON es asignable a un tipo TypeScript raíz.',
  },
  'dns-lookup': {
    title: 'DNS Inspector | HIOS Workbench',
    description: 'Consulta registros DNS en vivo, incluidos MX, TXT, NS, A y AAAA, desde una sola superficie.',
  },
  'subnet-calculator': {
    title: 'Subnet Calculator | HIOS Network Lab',
    description: 'Calcula red, broadcast, máscara y hosts usables desde una IPv4 con CIDR.',
  },
  'whois-rdap': {
    title: 'WHOIS / RDAP | HIOS Network Lab',
    description: 'Consulta datos públicos de registro de dominios usando RDAP.',
  },
  'certificate-check': {
    title: 'Certificate Expiry | HIOS Workbench',
    description: 'Inspecciona fechas de validez, issuer y riesgo de expiración de certificados TLS en vivo.',
  },
  'hash-digest': {
    title: 'Hash & Digest | HIOS Workbench',
    description: 'Genera digests SHA-1/256/384/512 (hex y base64) enteramente en el navegador.',
  },
  'usage-analytics': {
    title: 'Analytics Dashboard | HIOS Workbench',
    description: 'Resumen de uso por páginas y herramientas con agregación por período y locale.',
  },
  'encoder': {
    title: 'Encoder / Decoder | HIOS Workbench',
    description: 'Base64, base64url, hex y URL encode/decode UTF-8, todo en el navegador.',
  },
  'uuid-ulid': {
    title: 'UUID / ULID | HIOS Workbench',
    description: 'Genera UUID v4 y ULID en lote, enteramente en el navegador.',
  },
  'regex': {
    title: 'Regex Tester | HIOS Workbench',
    description: 'Probá expresiones regulares con matches, grupos y replace, en el navegador.',
  },
  'text-diff': {
    title: 'Text Diff | HIOS Workbench',
    description: 'Compará dos textos línea por línea (LCS) enteramente en el navegador.',
  },
  'mermaid': {
    title: 'Mermaid Diagrams | HIOS Workbench',
    description: 'Editá y renderizá diagramas Mermaid (flowchart, secuencia, UML…) en el navegador.',
  },
  'excalidraw': {
    title: 'Excalidraw Diagrams | HIOS Workbench',
    description: 'Dibuja y exporta diagramas visuales tipo UML y arquitectura directamente en el navegador.',
  },
  'notes': {
    title: 'Markdown Notes | HIOS Workbench',
    description: 'Notas en markdown con preview en vivo, local-first en tu navegador.',
  },
  'patterns': {
    title: 'Pattern Lessons | HIOS Workbench',
    description: 'Lecciones interactivas de patrones modernos con código editable y runner sandbox.',
  },
  'object-to-types': {
    title: 'Object to Types | HIOS Workbench',
    description: 'Genera interfaces y tipos TypeScript a partir de un JSON real en segundos.',
  },
  'random-string': {
    title: 'Random String Generator | HIOS Workbench',
    description: 'Genera strings aleatorios para tokens, demos, IDs o secretos rápidos.',
  },
  'object-compare': {
    title: 'Object Comparator | HIOS Workbench',
    description: 'Compara dos objetos JSON y detecta diferencias estructurales rápido.',
  },
  'cron': {
    title: 'Cron Expression | HIOS Workbench',
    description: 'Parse cron expressions, get next run times and field breakdown, entirely in your browser.',
  },
  'color': {
    title: 'Color Tools | HIOS Workbench',
    description: 'Convert between HEX, RGB and HSL, pick colors, inspect contrast ratios — all in your browser.',
  },
  'timestamp': {
    title: 'Timestamp Converter | HIOS Workbench',
    description: 'Convert Unix timestamps to human-readable dates and ISO formats, entirely in your browser.',
  },
  'site-checker': {
    title: 'Site Checker | HIOS Workbench',
    description: 'Monitoriza URLs desde el navegador, con checks locales y notificaciones cliente.',
  },
  'resistor-color-code': {
    title: 'Código de colores de resistencias | HIOS Electronics',
    description: 'Convierte bandas de color a valor de resistencia (4 y 5 bandas) y viceversa, en el navegador.',
  },
  'ohms-law': {
    title: 'Ley de Ohm | HIOS Electronics',
    description: 'Calculá voltaje, corriente, resistencia y potencia a partir de dos valores conocidos.',
  },
  'http-status-codes': {
    title: 'HTTP Status Codes | HIOS Reference',
    description: 'Busca y consulta códigos de estado HTTP con su categoría y descripción.',
  },
  'ascii-unicode': {
    title: 'Tabla ASCII / Unicode | HIOS Reference',
    description: 'Inspecciona caracteres y code points en decimal, hex, octal y binario.',
  },
  'note-frequency': {
    title: 'Nota / Frecuencia / MIDI | HIOS Audio Lab',
    description: 'Convierte entre nota musical, frecuencia en Hz y número MIDI, con A4 configurable.',
  },
  'ipv6-expand': {
    title: 'IPv6 Expand / Compress | HIOS Network Lab',
    description: 'Expande y comprime direcciones IPv6 según RFC 5952, en el navegador.',
  },
  'hmac': {
    title: 'HMAC | HIOS Workbench',
    description: 'Genera HMAC SHA-1/256/384/512 con clave y mensaje, enteramente en el navegador.',
  },
  'csv-json': {
    title: 'CSV ⇄ JSON | HIOS Workbench',
    description: 'Convierte CSV a JSON y de vuelta, con comillas RFC 4180 y delimitador configurable.',
  },
};

interface PageProps {
  params: Promise<{ locale: string; tool: string }>;
}

export function generateStaticParams() {
  return dynamicToolIds.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tool } = await params;
  return metadataMap[tool] ?? { title: 'Workbench Tool | HIOS' };
}

function renderTool(toolId: WorkbenchToolId) {
  switch (toolId) {
    case 'tone-generator':
      return <ToneGeneratorTool />;
    case 'guitar-tuner':
      return <GuitarTunerTool />;
    case 'spectrum-analyzer':
      return <SpectrumAnalyzerTool />;
    case 'level-meter':
      return <LevelMeterTool />;
    case 'metronome':
      return <MetronomeTool />;
    case 'beat-counter':
      return <BeatCounterTool />;
    case 'delay-calculator':
      return <DelayCalculatorTool />;
    case 'type-checker':
      return <TypeCheckerTool />;
    case 'jwt-decode':
      return <JwtPlaygroundTool />;
    case 'dns-lookup':
      return <DnsLookupTool />;
    case 'subnet-calculator':
      return <SubnetCalculatorTool />;
    case 'whois-rdap':
      return <WhoisRdapTool />;
    case 'certificate-check':
      return <CertificateCheckTool />;
    case 'hash-digest':
      return <HashDigestTool />;
    case 'usage-analytics':
      return <UsageAnalyticsTool />;
    case 'encoder':
      return <EncoderTool />;
    case 'uuid-ulid':
      return <UuidUlidTool />;
    case 'regex':
      return <RegexTesterTool />;
    case 'text-diff':
      return <TextDiffTool />;
    case 'mermaid':
      return <MermaidTool />;
    case 'excalidraw':
      return <ExcalidrawTool />;
    case 'notes':
      return <MarkdownNotesTool />;
    case 'patterns':
      return <PatternsTool />;
    case 'object-to-types':
      return <ObjectToTypesTool />;
    case 'random-string':
      return <RandomStringTool />;
    case 'object-compare':
      return <ObjectComparatorTool />;
    case 'site-checker':
      return <SiteCheckerTool />;
    case 'cron':
      return <CronTool />;
    case 'color':
      return <ColorTool />;
    case 'timestamp':
      return <TimestampTool />;
    case 'number-base':
      return <NumberBaseTool />;
    case 'json-schema':
      return <JsonSchemaTool />;
    case 'url-parser':
      return <UrlParserTool />;
    case 'regex':
      return <RegexTool />;
    case 'image-base64':
      return <ImageBase64Tool />;
    case 'resistor-color-code':
      return <ResistorColorCodeTool />;
    case 'ohms-law':
      return <OhmsLawTool />;
    case 'http-status-codes':
      return <HttpStatusCodesTool />;
    case 'ascii-unicode':
      return <AsciiUnicodeTool />;
    case 'note-frequency':
      return <NoteFrequencyTool />;
    case 'ipv6-expand':
      return <Ipv6ExpandTool />;
    case 'hmac':
      return <HmacTool />;
    case 'csv-json':
      return <CsvJsonTool />;
    default:
      return null;
  }
}

export const runtime = 'edge';

export default async function DynamicWorkbenchToolPage({ params }: PageProps) {
  const { locale, tool } = await params;
  setRequestLocale(locale);

  const workbenchTool = getWorkbenchTool(tool as WorkbenchToolId);
  if (!workbenchTool || workbenchTool.external || tool === 'payload' || tool === 'snippets') {
    notFound();
  }

  const content = renderTool(workbenchTool.id);
  if (!content) {
    notFound();
  }

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <ToolUsageTracker toolId={workbenchTool.id} />
      {content}
      <ToolPager currentId={workbenchTool.id} />
    </main>
  );
}
