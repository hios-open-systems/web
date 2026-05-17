import { redirect } from 'next/navigation';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// RCL is now a tab inside the unified calculators page. Keep this route as a
// redirect so old links / bookmarks still work.
export default async function RclPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/calculators?tab=rcl`);
}
