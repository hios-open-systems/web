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
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API responses.
  if (url.pathname.startsWith('/api/')) return;

  const navigation = request.mode === 'navigate';

  if (navigation || isRsc(request, url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) cachePut(request, res);
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || (navigation ? caches.match('/offline.html') : Response.error())),
        ),
    );
    return;
  }

  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) cachePut(request, res);
            return res;
          }),
      ),
    );
    return;
  }

  // Same-origin GET: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((hit) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) cachePut(request, res);
          return res;
        })
        .catch(() => hit);
      return hit || fetched;
    }),
  );
});
