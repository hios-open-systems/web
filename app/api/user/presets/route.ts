import type { NextRequest } from 'next/server';
import { documentsApi } from '@/lib/workspaces/api';
export const GET = (request: NextRequest) => documentsApi(request, 'presets');
export const PUT = GET;
