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

	// Headers de seguridad (antes no había ninguno). Conservadores a propósito:
	// nada que rompa el mic de las tools de audio (sin Permissions-Policy) ni el
	// iframe sandbox de patterns (X-Frame-Options SAMEORIGIN, no DENY). HSTS lo
	// maneja Cloudflare en el borde.
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
				],
			},
		];
	},
};

export default withNextIntl(nextConfig);
