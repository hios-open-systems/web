'use client';

import { useEffect } from 'react';

// Guard a nivel módulo: sobrevive a remounts (StrictMode, navegación client-side).
let printed = false;

const ASCII = `
 _   _ ___ ___  ____
| | | |_ _/ _ \\/ ___|
| |_| || | | | \\___ \\
|  _  || | |_| |___) |
|_| |_|___\\___/|____/
`;

const MESSAGE = [
    '¿Mirando bajo el capó? Todo el código de este sitio está en GitHub —',
    'no hace falta scrapear ni buscar endpoints escondidos: no hay nada que',
    'monetizar acá, solo herramientas open source.',
    '',
    'Looking under the hood? All the code is on GitHub — no need to scrape',
    'or hunt for hidden endpoints: there is nothing to monetize here, just',
    'open source tools.',
    '',
    '→ https://github.com/hios-open-systems/web',
    '→ Si encontrás algo raro / found something odd: /.well-known/security.txt',
].join('\n');

/**
 * Imprime un saludo en la consola del navegador para quien ande curioseando.
 * Renderiza null; montarlo una sola vez en el árbol.
 */
export function ConsoleEasterEgg() {
    useEffect(() => {
        if (printed) return;
        printed = true;
        console.info(
            `%c${ASCII}%c\n${MESSAGE}`,
            'font-family: monospace; color: #f59e0b;',
            'font-family: monospace;',
        );
    }, []);

    return null;
}
