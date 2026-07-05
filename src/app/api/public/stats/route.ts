import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/Report';
import Ticket from '@/models/Ticket';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

const FALLBACK_STATS = {
  totalReports: '0',
  resolvedReports: '0',
  activeCities: '0',
  avgResolutionDays: '0.0',
};

export async function GET() {
  try {
    const cacheKey = 'public:stats';
    const cachedStats = await redis.get(cacheKey);

    if (cachedStats) {
      return NextResponse.json(JSON.parse(cachedStats));
    }

    // If DB not configured, return fallback immediately
    const MONGODB_URI = process.env.MONGODB_URI ?? '';
    if (!MONGODB_URI || MONGODB_URI.includes('<')) {
      return NextResponse.json({ success: true, data: FALLBACK_STATS });
    }

    await connectDB();

    const [totalReports, resolvedReports, wards, avgTimeAgg] = await Promise.all([
      Report.countDocuments({ isDeleted: false }),
      Report.countDocuments({ isDeleted: false, status: 'resolved' }),
      Report.distinct('ward', { isDeleted: false }),
      Ticket.aggregate([
        { $match: { completedAt: { $exists: true, $ne: null } } },
        {
          $lookup: {
            from: 'reports',
            localField: 'reportId',
            foreignField: '_id',
            as: 'report',
          },
        },
        { $unwind: '$report' },
        {
          $group: {
            _id: null,
            avgTimeMs: { $avg: { $subtract: ['$completedAt', '$report.createdAt'] } },
          },
        },
      ]),
    ]);

    const avgResolutionDays = avgTimeAgg[0]?.avgTimeMs
      ? (avgTimeAgg[0].avgTimeMs / (1000 * 60 * 60 * 24)).toFixed(1)
      : '0.0';

    const stats = {
      success: true,
      data: {
        totalReports: totalReports.toLocaleString(),
        resolvedReports: resolvedReports.toLocaleString(),
        activeCities: wards.length.toString(),
        avgResolutionDays,
      },
    };

    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 1800);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Public Stats API error:', error);
    // Return fallback data instead of a 500 so the homepage still loads
    return NextResponse.json({ success: true, data: FALLBACK_STATS });
  }
}
