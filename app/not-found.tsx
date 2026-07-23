// 404 global. Se renderiza FUERA del segmento [locale] (ej. cuando el locale es
// inválido y app/[locale]/layout.tsx hace notFound()), así que no hay root layout
// que lo envuelva: tiene que traer su propio <html>/<body>.
//
// A propósito SIN Ant Design ni chrome: es una página barata. Renderizar el chrome
// completo acá era justo lo que los escáneres de /*.php usaban para quemar CPU (1102).
// Colores hardcodeados a la paleta "ink" (sin globals.css acá): #0b0e14 / #e8eaed,
// accent default #f59e0b. Mono del sistema — cero webfonts.
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
          background: '#0b0e14',
          color: '#e8eaed',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.16em',
            color: '#f59e0b',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 1,
              background: '#f59e0b',
              display: 'inline-block',
            }}
          />
          HIOS · ERR
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: 2 }}>404</div>
        <div style={{ fontSize: 15, color: '#9aa4b2', maxWidth: 420 }}>
          Esta página no existe. / This page doesn&apos;t exist.
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 404 fuera del app tree: sin contexto de router, <Link> no aplica */}
        <a
          href="/"
          style={{
            marginTop: 8,
            color: '#0b0e14',
            background: '#f59e0b',
            padding: '10px 20px',
            borderRadius: 8,
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
