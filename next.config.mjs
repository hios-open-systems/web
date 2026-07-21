import { execSync } from 'node:child_process';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Resolve a real deploy version at build time. Cloudflare Workers does not
// expose CF_PAGES_COMMIT_SHA / npm_package_version at runtime, so without this
// VersionWatcher would always see the local fallback and stay disabled.
function resolveDeployVersion() {
	const fromEnv =
		process.env.WORKERS_CI_COMMIT_SHA || // Workers Builds (deploy actual)
		process.env.CF_PAGES_COMMIT_SHA ||
		process.env.VERCEL_GIT_COMMIT_SHA ||
		process.env.GITHUB_SHA;
	if (fromEnv) return fromEnv.slice(0, 12);
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return `build-${Date.now()}`;
	}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['antd', '@ant-design/icons', 'next-intl'],

	env: {
		NEXT_PUBLIC_DEPLOY_VERSION: resolveDeployVersion(),
	},

	// Optimización de imágenes
	images: {
		unoptimized: true,
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200],
		imageSizes: [16, 32, 48, 64, 96, 128, 256],
		minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
	},

	// Importaciones modulares para reducir bundle
	modularizeImports: {
		'antd': {
			transform: 'antd/es/{{member}}',
		},
		'@ant-design/icons': {
			transform: '@ant-design/icons/{{member}}',
		},
	},

	// Tree-shaking nativo de barrels (Next 15). Complementa modularizeImports:
	// recorta imports de librerías con barrels grandes que engordan el bundle del
	// server — y con él el cold-start del Worker, una de las causas del Error 1102.
	experimental: {
		optimizePackageImports: [
			'antd',
			'@ant-design/icons',
			'next-intl',
			'react-syntax-highlighter',
		],
	},

	// Producción
	poweredByHeader: false,
	compress: true,

	// Redirects para rutas sin locale
	async redirects() {
		return [
			{
				source: '/pinouts',
				destination: '/en/pinouts',
				permanent: false,
			},
		];
	},

	// Headers de seguridad. Se aplican vía el server de Next (confirmado live en
	// prod). HSTS va también acá (no solo en el borde de Cloudflare) para que la
	// seguridad sea PORTABLE si el sitio migra de hosting.
	async headers() {
		const isDev = process.env.NODE_ENV !== 'production';

		// CSP con 'unsafe-inline' en script/style: obligado por la hidratación de
		// Next, los estilos inline de antd/framer y el <iframe srcDoc> del
		// PatternsTool (ejecuta scripts inline generados, aislado por
		// sandbox="allow-scripts"). En dev se suma 'unsafe-eval' (React Refresh) y
		// ws: (HMR), o se rompe `npm run dev`. El resto sí es defensa real: cero
		// scripts externos, sin plugins, anti-clickjacking, forms/fetch solo al
		// propio origen. connect/img verificados: no hay fetch ni imágenes remotas
		// del lado del cliente (api.github.com es server-side).
		const csp = [
			"default-src 'self'",
			"base-uri 'self'",
			"object-src 'none'",
			"frame-ancestors 'self'",
			"form-action 'self'",
			// challenges.cloudflare.com = Turnstile (script + iframe del widget).
			`script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob: https:",
			"font-src 'self' data:",
			`connect-src 'self' https://challenges.cloudflare.com${isDev ? ' ws:' : ''}`,
			"frame-src 'self' https://challenges.cloudflare.com",
			"worker-src 'self' blob:",
			"manifest-src 'self'",
			'upgrade-insecure-requests',
		].join('; ');

		// Enforcing directo: se verificó el código y no hay nada que el CSP rompa
		// —cero wasm, cero eval/new Function, cero fetch/WebSocket a hosts externos,
		// cero <img> remoto; antd/framer/Next-hydration y el srcdoc del PatternsTool
		// quedan cubiertos por 'unsafe-inline'. Si algún día se agrega un recurso
		// externo o wasm, esto lo bloqueará: ampliar la allowlist correspondiente.
		const CSP_ENFORCE = true;

		// Permissions-Policy derivada del uso REAL del código: mic solo el tuner
		// (useMicAnalyser), clipboard/autoplay para las tools; todo lo demás negado.
		// `=(self)` permite la feature a nuestro origen y se la niega a iframes de
		// terceros — no apaga nada nuestro, el prompt nativo del mic sigue saliendo.
		const permissionsPolicy = [
			'accelerometer=()',
			'autoplay=(self)',
			'bluetooth=()',
			'browsing-topics=()',
			'camera=()',
			'clipboard-write=(self)',
			'display-capture=()',
			'encrypted-media=()',
			'fullscreen=(self)',
			'geolocation=()',
			'gyroscope=()',
			'hid=()',
			'magnetometer=()',
			'microphone=(self)',
			'midi=()',
			'payment=()',
			'serial=()',
			'usb=()',
		].join(', ');

		const securityHeaders = [
			{ key: 'X-Content-Type-Options', value: 'nosniff' },
			{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
			{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
			{ key: 'Permissions-Policy', value: permissionsPolicy },
			{
				key: CSP_ENFORCE
					? 'Content-Security-Policy'
					: 'Content-Security-Policy-Report-Only',
				value: csp,
			},
		];

		// HSTS solo en prod: en dev localhost es HTTP y HSTS forzaría HTTPS local,
		// rompiendo `npm run dev`. 6 meses + includeSubDomains, sin preload (así es
		// reversible; preload es difícil de deshacer).
		if (!isDev) {
			securityHeaders.push({
				key: 'Strict-Transport-Security',
				value: 'max-age=15552000; includeSubDomains',
			});
		}

		return [{ source: '/:path*', headers: securityHeaders }];
	},
};

export default withNextIntl(nextConfig);
