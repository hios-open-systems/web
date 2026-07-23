import { setRequestLocale } from 'next-intl/server';

// Página estática, sin antd ni messages: contenido hardcodeado bilingüe.
// Mismo patrón edge/SSG que app/[locale]/blog/page.tsx.

const locales = ['en', 'es', 'de', 'it'];

export const dynamic = 'force-static';
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export function generateMetadata() {
    return {
        title: 'Colophon | HIOS',
        description: 'Qué es HIOS, con qué está hecho y por qué es open source.',
    };
}

interface Section {
    heading: string;
    body: string[];
}

const ES: Section[] = [
    {
        heading: 'Qué es esto',
        body: [
            'HIOS es un proyecto personal de hardware y software abierto: módulos de audio, herramientas de taller y la documentación para reproducirlos. No hay empresa detrás, no hay modelo de negocio — hay un banco de trabajo en Argentina y ganas de compartir lo que sale de él.',
        ],
    },
    {
        heading: 'Con qué está hecho',
        body: [
            'Este sitio corre sobre Next.js (App Router) con TypeScript y Ant Design, desplegado en Cloudflare Workers. Tipografías: Archivo para títulos, Inter para texto, IBM Plex Mono para todo lo que huele a datasheet. El hardware se diseña en KiCad y el firmware vive junto a cada proyecto en el repo.',
        ],
    },
    {
        heading: 'Filosofía',
        body: [
            'Open source y DIY, de punta a punta. Muestro lo que hago, incluido lo que salió mal: los errores de un prototipo enseñan más que las fotos de la versión final. Si podés leer el esquemático, podés fabricarlo, modificarlo o decirme dónde metí la pata.',
        ],
    },
    {
        heading: 'Licencia',
        body: [
            'El código y los diseños se publican bajo licencias abiertas; los detalles por proyecto están en el repositorio. En resumen: usalo, estudialo, mejoralo.',
        ],
    },
    {
        heading: 'Contacto',
        body: [
            'Issues en GitHub (github.com/hios-open-systems/web) para bugs e ideas, /.well-known/security.txt para temas de seguridad, o devsolutionsar@gmail.com para todo lo demás.',
        ],
    },
];

const EN: Section[] = [
    {
        heading: 'What this is',
        body: [
            'HIOS is a personal open hardware and software project: audio modules, workbench tools, and the documentation to reproduce them. No company behind it, no business model — just a workbench in Argentina and the urge to share what comes off it.',
        ],
    },
    {
        heading: 'How it is built',
        body: [
            'This site runs on Next.js (App Router) with TypeScript and Ant Design, deployed on Cloudflare Workers. Type: Archivo for headings, Inter for body text, IBM Plex Mono for anything that smells like a datasheet. Hardware is designed in KiCad and firmware lives alongside each project in the repo.',
        ],
    },
    {
        heading: 'Philosophy',
        body: [
            'Open source and DIY, end to end. I show what I make, including what went wrong: a prototype’s mistakes teach more than photos of the final version. If you can read the schematic, you can build it, modify it, or tell me where I messed up.',
        ],
    },
    {
        heading: 'License',
        body: [
            'Code and designs are published under open licenses; per-project details live in the repository. In short: use it, study it, improve it.',
        ],
    },
    {
        heading: 'Contact',
        body: [
            'GitHub issues (github.com/hios-open-systems/web) for bugs and ideas, /.well-known/security.txt for security matters, or devsolutionsar@gmail.com for everything else.',
        ],
    },
];

function Block({ label, sections }: { label: string; sections: Section[] }) {
    return (
        <section style={{ marginTop: 48 }}>
            <p
                style={{
                    fontFamily: 'var(--font-stack-mono)',
                    fontSize: 12,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-text)',
                    margin: 0,
                }}
            >
                {label}
            </p>
            {sections.map((s) => (
                <div key={s.heading} style={{ marginTop: 28 }}>
                    <h2
                        style={{
                            fontFamily: 'var(--font-stack-display)',
                            fontSize: 20,
                            color: 'var(--hios-text)',
                            margin: 0,
                        }}
                    >
                        {s.heading}
                    </h2>
                    {s.body.map((p) => (
                        <p
                            key={p.slice(0, 24)}
                            style={{
                                color: 'var(--hios-text-secondary)',
                                lineHeight: 1.7,
                                margin: '10px 0 0',
                            }}
                        >
                            {p}
                        </p>
                    ))}
                </div>
            ))}
        </section>
    );
}

export default async function ColophonPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
            <p
                style={{
                    fontFamily: 'var(--font-stack-mono)',
                    fontSize: 12,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-text)',
                    margin: 0,
                }}
            >
                HIOS / DOC-META-01
            </p>
            <h1
                style={{
                    fontFamily: 'var(--font-stack-display)',
                    fontSize: 40,
                    color: 'var(--hios-text)',
                    margin: '8px 0 0',
                }}
            >
                Colophon
            </h1>
            <Block label="ES — Español" sections={ES} />
            <hr style={{ border: 'none', borderTop: '1px solid var(--hios-border)', marginTop: 48 }} />
            <Block label="EN — English" sections={EN} />
        </main>
    );
}
