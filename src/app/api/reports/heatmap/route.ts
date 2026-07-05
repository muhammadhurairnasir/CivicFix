export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report } from '@/models';
import { ApiResponse } from '@/types';
import redis from '@/lib/redis';

// ─── GET /api/reports/heatmap ────────────────────────────────────────────────

export async function GET() {
  const CACHE_KEY = 'heatmap:data';
  const CACHE_TTL = 600; // 10 minutes

  try {
    // 1. Check Redis Cache
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData) {
        return NextResponse.json<ApiResponse>(
          { success: true, data: JSON.parse(cachedData) },
          { status: 200 }
        );
      }
    } catch {
      // Redis unavailable — continue to DB
    }

    // 2. Query MongoDB
    await connectDB();

    const heatmapData = await Report.aggregate([
      {
        $match: { isDeleted: false, status: { $ne: 'closed' } }
      },
      {
        $group: {
          _id: {
            // Round to 3 decimal places (~111m precision) to cluster nearby reports
            lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] },
            lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] },
            severity: '$severity',
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          lng: '$_id.lng',
          lat: '$_id.lat',
          severity: '$_id.severity',
          count: 1
        }
      },
      {
        $sort: { count: -1 } // Prioritize most dense clusters
      },
      {
        $limit: 500
      }
    ]);

    // 3. Update Redis Cache
    try {
      await redis.set(CACHE_KEY, JSON.stringify(heatmapData), 'EX', CACHE_TTL);
    } catch {
      // Redis unavailable — skip caching
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: heatmapData },
      { status: 200 }
    );

  } catch (error) {
    console.error('[GET Heatmap API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to retrieve heatmap data.' },
      { status: 500 }
    );
  }
}
