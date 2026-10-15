import { cpSync, mkdirSync } from 'node:fs';

// Fonts ship with the installed package; no CDN or runtime download is needed.
mkdirSync('public/vendor/excalidraw', { recursive: true });
cpSync('node_modules/@excalidraw/excalidraw/dist/prod/fonts', 'public/vendor/excalidraw/fonts', { recursive: true });
