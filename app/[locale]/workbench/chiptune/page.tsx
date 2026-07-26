import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return ['en', 'es', 'de', 'it'].map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ChiptuneRedirect({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/composer`);
}
