import Image from 'next/image';
import { isLocalResource } from '@/lib/localResource';

export function LocalMarkdownImage({ src, alt }: { src?: string | Blob; alt?: string }) {
  if (typeof src !== 'string' || !src || !isLocalResource(src)) return <span>{alt || (typeof src === 'string' ? src : '')}</span>;
  return <Image unoptimized src={src} alt={alt || ''} width={800} height={500} style={{ maxWidth: '100%', height: 'auto' }} />;
}
