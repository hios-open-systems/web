import { redirect } from 'next/navigation';


interface PageProps {
  params: Promise<{ locale: string; section: string }>;
}

export default async function WorkbenchSectionRoutePage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/workbench`);
}
