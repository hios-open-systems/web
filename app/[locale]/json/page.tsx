import { redirect } from 'next/navigation';
export default async function JsonShortcut({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/workbench/payload`);
}
