import { permanentRedirect } from 'next/navigation';
import { radioCoursePath } from '@/config/radio-course';

export const dynamic = 'force-static';

export default async function LegacyRadioCourse({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}${radioCoursePath}`);
}
