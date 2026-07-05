import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/Report';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
    }

    await connectDB();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const hotspots = await Report.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: ninetyDaysAgo },
          ward: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$ward',
          total: { $sum: 1 },
          criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          highCount: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          mediumCount: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
          lowCount: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } },
          unresolvedCount: { $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress']] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          unresolvedRatio: {
            $cond: [
              { $gt: ['$total', 0] },
              { $divide: ['$unresolvedCount', '$total'] },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          hotspotScore: {
            $multiply: [
              {
                $add: [
                  { $multiply: ['$criticalCount', 4] },
                  { $multiply: ['$highCount', 3] },
                  { $multiply: ['$mediumCount', 2] },
                  { $multiply: ['$lowCount', 1] }
                ]
              },
              '$unresolvedRatio'
            ]
          }
        }
      },
      { $sort: { hotspotScore: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          ward: '$_id',
          total: 1,
          criticalCount: 1,
          highCount: 1,
          mediumCount: 1,
          lowCount: 1,
          unresolvedCount: 1,
          unresolvedRatio: 1,
          hotspotScore: 1
        }
      }
    ]);

    return NextResponse.json(hotspots);
  } catch (error: any) {
    return handleApiError(error, 'Analytics Hotspots API');
  }
}
