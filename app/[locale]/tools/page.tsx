import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/workbench`);
}
