import { BackendApiError, backendApi } from '@/lib/backend-api';
import { isSnapshotRequestWithinLimit, parseSnapshotRequest, parseSnapshotResponse } from '@/lib/snapshot';

const noStore = { 'Cache-Control': 'no-store' };

function failure(status: number, error: string) {
  return Response.json({ error }, { status, headers: noStore });
}

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return failure(400, 'Invalid snapshot request');
  }

  let raw: string;
  try { raw = await request.text(); } catch { return failure(400, 'Invalid snapshot request'); }
  if (!isSnapshotRequestWithinLimit(raw)) return failure(400, 'Invalid snapshot request');

  let value: unknown;
  try { value = JSON.parse(raw); } catch { return failure(400, 'Invalid snapshot request'); }
  const input = parseSnapshotRequest(value);
  if (!input) return failure(400, 'Invalid snapshot request');

  let result: unknown;
  try {
    result = await backendApi<unknown>('profiles/snapshot', { method: 'POST', body: input });
  } catch (error) {
    return failure(error instanceof BackendApiError && error.status === 400 ? 400 : 503, 'Snapshot unavailable');
  }

  const safe = parseSnapshotResponse(result);
  return safe ? Response.json(safe, { headers: noStore }) : failure(502, 'Invalid snapshot response');
}
