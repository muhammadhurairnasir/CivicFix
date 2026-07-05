import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { getRedis } from '@/lib/redis';
import { aggregateWardStats } from '@/lib/jobs/statsAggregator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
    }

    const redisClient = getRedis();
    const cachedStats = await redisClient.get('stats:by_ward');

    if (cachedStats) {
      return NextResponse.json(JSON.parse(cachedStats), {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    // Cache miss - aggregate fresh
    const stats = await aggregateWardStats();

    return NextResponse.json(stats, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    return handleApiError(error, 'Analytics By-Ward API');
  }
}
