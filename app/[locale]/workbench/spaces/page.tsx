import { setRequestLocale } from 'next-intl/server';
import { SpacesWorkspace } from '@/components/workbench/SpacesWorkspace';
export default async function SpacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <main style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px 56px' }}><SpacesWorkspace /></main>;
}
