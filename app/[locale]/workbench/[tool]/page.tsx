import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { JwtDecodeTool } from '@/components/workbench/JwtDecodeTool';
import { ObjectComparatorTool } from '@/components/workbench/ObjectComparatorTool';
import { RandomStringTool } from '@/components/workbench/RandomStringTool';
import { getWorkbenchTool, workbenchTools, type WorkbenchToolId } from '@/config/workbench';

const dynamicToolIds = workbenchTools
  .filter((tool) => !tool.external && !['payload', 'snippets'].includes(tool.id))
  .map((tool) => tool.id);

const metadataMap: Record<string, Metadata> = {
  'jwt-decode': {
    title: 'JWT Decode | HIOS Workbench',
    description: 'Decodifica JWT en local para revisar header, payload y expiración sin salir del navegador.',
  },
  'random-string': {
    title: 'Random String Generator | HIOS Workbench',
    description: 'Genera strings aleatorios para tokens, demos, IDs o secretos rápidos.',
  },
  'object-compare': {
    title: 'Object Comparator | HIOS Workbench',
    description: 'Compara dos objetos JSON y detecta diferencias estructurales rápido.',
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
    case 'jwt-decode':
      return <JwtDecodeTool />;
    case 'random-string':
      return <RandomStringTool />;
    case 'object-compare':
      return <ObjectComparatorTool />;
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