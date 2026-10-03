import { serializeStructuredData, type StructuredData } from '@/lib/structured-data';

export function JsonLd({ data }: { data: StructuredData }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }} />;
}
