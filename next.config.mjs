import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['antd', '@ant-design/icons', 'next-intl'],

	// Optimización de imágenes
	images: {
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
};

export default withNextIntl(nextConfig);
