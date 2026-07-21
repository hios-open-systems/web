// 404 global. Se renderiza FUERA del segmento [locale] (ej. cuando el locale es
// inválido y app/[locale]/layout.tsx hace notFound()), así que no hay root layout
// que lo envuelva: tiene que traer su propio <html>/<body>.
//
// A propósito SIN Ant Design ni chrome: es una página barata. Renderizar el chrome
// completo acá era justo lo que los escáneres de /*.php usaban para quemar CPU (1102).
export default function NotFound() {
  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: '#0b1220',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: 2 }}>404</div>
        <div style={{ fontSize: 18, color: '#94a3b8', maxWidth: 420 }}>
          Esta página no existe. / This page doesn&apos;t exist.
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 404 fuera del app tree: sin contexto de router, <Link> no aplica */}
        <a
          href="/"
          style={{
            marginTop: 8,
            color: '#0b1220',
            background: '#f59e0b',
            padding: '10px 20px',
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          openhios.dev
        </a>
      </body>
    </html>
  );
}
