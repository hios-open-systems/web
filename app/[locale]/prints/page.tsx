import { setRequestLocale } from 'next-intl/server';
import { PrintsCatalog } from '@/components/prints/PrintsCatalog';


interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrintsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrintsCatalog />;
}
