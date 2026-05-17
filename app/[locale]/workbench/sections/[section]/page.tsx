import { redirect } from 'next/navigation';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ locale: string; section: string }>;
}

// Sections were dropped: validation/generation/testing were not real
// categories. The workbench is now a single flat tool grid. Keep this route
// as a redirect so old links / bookmarks still land somewhere useful.
export default async function WorkbenchSectionRoutePage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/workbench`);
}
