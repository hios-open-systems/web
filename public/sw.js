/* HIOS service worker — installable + offline fallback.
 *
 * Regla de oro: NADA que dependa del build puede sobrevivir a un deploy.
 * Los chunks de /_next/static llevan hash en el nombre y se reemplazan en cada
 * deploy: si el SW devuelve un HTML o un payload RSC viejo, ese documento pide
 * CSS/JS que ya no existen → 404 → la página se ve sin estilos. Dos defensas:
 *
 *  1. El cache se llama por versión de deploy — la página registra
 *     /sw.js?v=<deploy>, así que cada deploy instala un SW nuevo, con cache
 *     nuevo, y activate borra todos los anteriores.
 *  2. HTML y RSC van SIEMPRE network-first (el cache es solo fallback offline).
 *     Antes el RSC era cache-first y el hash ?_rsc= NO depende del build, así
 *     que una navegación cliente servía el payload del deploy anterior.
 *
 * Estrategias:
 *  - navegaciones y RSC: network-first → cache → /offline.html
 *  - /_next/static, iconos, manifest: cache-first (inmutables dentro del build)
 *  - resto de GET same-origin: stale-while-revalidate
 */
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `hios-cache-${VERSION}`;
const PRECACHE = ['/offline.html', '/icons/icon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  // allSettled: si el precache de un asset falla (p.ej. durante un deploy), el SW
  // igual se instala. Antes un c.addAll rechazado dejaba la instalación colgada.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.ico'
  );
}

/** Payload del App Router: acoplado al build igual que el HTML. */
function isRsc(request, url) {
  return url.searchParams.has('_rsc') || request.headers.get('RSC') === '1';
}

function cachePut(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy));
}

/**
 * SIEMPRE devuelve un Response válido. respondWith() con undefined/null tira
 * "Failed to convert value to 'Response'" y rompe la navegación entera; este
 * helper es la red de seguridad de todas las ramas del fetch.
 */
async function fallbackResponse(navigation) {
  if (navigation) {
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
  }
  return new Response('', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API responses.
  if (url.pathname.startsWith('/api/')) return;

  const navigation = request.mode === 'navigate';

  // Navegaciones y RSC: network-first → cache → offline. Siempre un Response.
  if (navigation || isRsc(request, url)) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) cachePut(request, res);
          return res;
        } catch {
          const hit = await caches.match(request);
          return hit || fallbackResponse(navigation);
        }
      })(),
    );
    return;
  }

  // /_next/static, iconos, manifest: cache-first (inmutables dentro del build).
  if (isStatic(url)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) cachePut(request, res);
          return res;
        } catch {
          return fallbackResponse(false);
        }
      })(),
    );
    return;
  }

  // Resto de GET same-origin: stale-while-revalidate (nunca undefined).
  event.respondWith(
    (async () => {
      const hit = await caches.match(request);
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) cachePut(request, res);
          return res;
        })
        .catch(() => null);
      return hit || (await fetched) || fallbackResponse(false);
    })(),
  );
});
