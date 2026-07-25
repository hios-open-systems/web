import { redirect } from 'next/navigation';

// El compositor chiptune se consolidó en /composer (página propia, como
// /calculators). Este segmento estático gana al dinámico [tool] y redirige los
// links/bookmarks viejos de /workbench/chiptune.
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
