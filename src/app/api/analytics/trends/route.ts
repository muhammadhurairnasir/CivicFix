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

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // '7d', '30d', '90d'
    const groupBy = searchParams.get('groupBy') || 'day'; // 'day', 'week'

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatString = groupBy === 'week' ? '%Y-%U' : '%Y-%m-%d';

    await connectDB();

    const trends = await Report.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: formatString, date: '$createdAt' } },
          submitted: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          submitted: 1,
          resolved: 1,
        },
      },
    ]);

    return NextResponse.json(trends);
  } catch (error: any) {
    return handleApiError(error, 'Analytics Trends API');
  }
}
