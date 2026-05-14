import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CertificateCheckTool } from '@/components/workbench/CertificateCheckTool';
import { DnsLookupTool } from '@/components/workbench/DnsLookupTool';
import { JwtDecodeTool } from '@/components/workbench/JwtDecodeTool';
import { ObjectToTypesTool } from '@/components/workbench/ObjectToTypesTool';
import { ObjectComparatorTool } from '@/components/workbench/ObjectComparatorTool';
import { RandomStringTool } from '@/components/workbench/RandomStringTool';
import { SiteCheckerTool } from '@/components/workbench/SiteCheckerTool';
import { TypeCheckerTool } from '@/components/workbench/TypeCheckerTool';
import { getWorkbenchTool, workbenchTools, type WorkbenchToolId } from '@/config/workbench';

const dynamicToolIds = workbenchTools
  .filter((tool) => !tool.external && !['payload', 'snippets'].includes(tool.id))
  .map((tool) => tool.id);

const metadataMap: Record<string, Metadata> = {
  'jwt-decode': {
    title: 'JWT Decode | HIOS Workbench',
    description: 'Decodifica JWT en local para revisar header, payload y expiración sin salir del navegador.',
  },
  'type-checker': {
    title: 'Type Checker | HIOS Workbench',
    description: 'Valida en el navegador si un JSON es asignable a un tipo TypeScript raíz.',
  },
  'dns-lookup': {
    title: 'DNS Inspector | HIOS Workbench',
    description: 'Consulta registros DNS en vivo, incluidos MX, TXT, NS, A y AAAA, desde una sola superficie.',
  },
  'certificate-check': {
    title: 'Certificate Expiry | HIOS Workbench',
    description: 'Inspecciona fechas de validez, issuer y riesgo de expiración de certificados TLS en vivo.',
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
  'site-checker': {
    title: 'Site Checker | HIOS Workbench',
    description: 'Monitoriza URLs desde el navegador, con checks locales y notificaciones cliente.',
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
    case 'type-checker':
      return <TypeCheckerTool />;
    case 'jwt-decode':
      return <JwtDecodeTool />;
    case 'dns-lookup':
      return <DnsLookupTool />;
    case 'certificate-check':
      return <CertificateCheckTool />;
    case 'object-to-types':
      return <ObjectToTypesTool />;
    case 'random-string':
      return <RandomStringTool />;
    case 'object-compare':
      return <ObjectComparatorTool />;
    case 'site-checker':
      return <SiteCheckerTool />;
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
      {content}
    </main>
  );
}