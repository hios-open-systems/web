import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { WorkbenchSectionPage } from '@/components/workbench/WorkbenchSectionPage';
import { getWorkbenchSection, workbenchSections, type WorkbenchSectionId } from '@/config/workbench';

const metadataMap: Record<WorkbenchSectionId, Metadata> = {
  validation: {
    title: 'Validation | HIOS Workbench',
    description: 'Decode, inspect and validate payloads or auth artifacts inside HIOS Workbench.',
  },
  generation: {
    title: 'Generation | HIOS Workbench',
    description: 'Generate random strings, snippets and other quick developer artifacts.',
  },
  testing: {
    title: 'Testing | HIOS Workbench',
    description: 'Compare objects, inspect differences and jump into embedded validation flows.',
  },
};

interface PageProps {
  params: Promise<{ locale: string; section: string }>;
}

export function generateStaticParams() {
  return workbenchSections.map((section) => ({ section: section.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  return metadataMap[section as WorkbenchSectionId] ?? { title: 'Workbench Section | HIOS' };
}

export const runtime = 'edge';

export default async function WorkbenchSectionRoutePage({ params }: PageProps) {
  const { locale, section } = await params;
  setRequestLocale(locale);

  if (!getWorkbenchSection(section as WorkbenchSectionId)) {
    notFound();
  }

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <WorkbenchSectionPage sectionId={section as WorkbenchSectionId} />
    </main>
  );
}