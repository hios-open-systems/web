import Link from 'next/link';

export default function LocaleNotFound() {
  return (
    <main style={{ maxWidth: 680, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <h1>404</h1>
      <p>Esta página no existe. / This page doesn&apos;t exist.</p>
      <Link href="/">HIOS</Link>
    </main>
  );
}
