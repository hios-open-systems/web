import type { NextRequest } from 'next/server';
import { documentsApi } from '@/lib/workspaces/api';
export const GET = (request: NextRequest) => documentsApi(request, 'workspaces');
export const PUT = GET;
