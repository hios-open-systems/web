import { getCurrentDeployVersion } from '@/lib/appVersion';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json(
        { version: getCurrentDeployVersion() },
        {
            headers: {
                'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
            },
        },
    );
}