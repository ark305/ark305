import { NextRequest } from 'next/server';
import { isAddon } from '@/lib/request-upsell';

const error = (status: number) => Response.json({ error: 'Complement operation unavailable or rejected' }, { status, headers: { 'Cache-Control': 'no-store' } });
async function forward(request: NextRequest, context: { params: Promise<{ id: string }> }, method: 'GET' | 'POST') {
  const token = request.headers.get('authorization');
  if (!token || !/^Bearer [^\s,]+$/i.test(token)) return error(401);
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return error(400);
  let body: { serviceId: string; accepted: true } | undefined;
  if (method === 'POST') {
    try {
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return error(400);
      const raw = await request.text(); if (raw.length > 1024) return error(400);
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !['serviceId', 'accepted'].includes(key)) || value.accepted !== true || typeof value.serviceId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value.serviceId)) return error(400);
      body = { serviceId: value.serviceId, accepted: true };
    } catch { return error(400); }
  }
  try {
    const origin = new URL(process.env.ARK_API_URL ?? 'http://127.0.0.1:3001');
    if (!['https:', 'http:'].includes(origin.protocol) || (origin.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) return error(503);
    const result = await fetch(new URL(`/api/v1/service-requests/${id}/addons`, origin), { method, headers: { Authorization: token, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!result.ok) return error([400, 401, 404, 409].includes(result.status) ? result.status : 503);
    const data = await result.json();
    if (method === 'POST' ? !isAddon(data, id.toLowerCase()) || data.serviceId !== body?.serviceId : !Array.isArray(data.items) || data.items.length > 20 || !data.items.every((row: unknown) => isAddon(row, id.toLowerCase()))) return error(502);
    return Response.json(data, { status: method === 'POST' ? 201 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch { return error(503); }
}
export const GET = (request: NextRequest, context: { params: Promise<{ id: string }> }) => forward(request, context, 'GET');
export const POST = (request: NextRequest, context: { params: Promise<{ id: string }> }) => forward(request, context, 'POST');
