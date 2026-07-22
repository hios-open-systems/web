import { redirect } from 'next/navigation';


interface PageProps {
  params: Promise<{ locale: string }>;
}

// RCL is now a tab inside the unified calculators page. Keep this route as a
// redirect so old links / bookmarks still work.
// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). Evita el re-render SSR de antd en cada isolate frío.
export const dynamic = 'force-static';
export default async function RclPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/calculators?tab=rcl`);
}
