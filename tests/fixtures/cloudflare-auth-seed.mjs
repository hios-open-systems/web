const sessionId = 'cf0e2e'.repeat(11).slice(0, 64);

export const CLOUDFLARE_AUTH_SEED = {
    user: {
        id: 'cf-e2e-user',
        githubId: 990001,
        githubLogin: 'cf-e2e-user',
        name: 'Cloudflare E2E',
        avatarUrl: 'https://avatars.githubusercontent.com/u/991?v=4',
        email: 'cf-e2e-user@openhios.dev',
    },
    session: {
        id: sessionId,
    },
    snippets: [
        {
            id: 'cf-e2e-private-snippet',
            title: 'Cuenta snippet privado',
            body: 'echo from-account-private',
            tags: ['smoke', 'private'],
            isPublic: false,
        },
        {
            id: 'cf-e2e-public-snippet',
            title: 'Cuenta snippet publico',
            body: 'echo from-account-public',
            tags: ['smoke', 'public'],
            isPublic: true,
        },
    ],
    theme: {
        accent: '#0ea5e9',
    },
};