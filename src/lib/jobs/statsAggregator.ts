import { connectDB } from '@/lib/db';
import { Report, Ticket, User } from '@/models';
import { UserRole } from '@/types';
import { getRedis } from '@/lib/redis';

export async function aggregateWardStats() {
  await connectDB();

  const stats = await Report.aggregate([
    {
      $match: {
        isDeleted: false,
        ward: { $exists: true, $ne: '' },
      },
    },
    {
      $lookup: {
        from: 'tickets',
        localField: '_id',
        foreignField: 'reportId',
        as: 'ticket',
      },
    },
    {
      $unwind: {
        path: '$ticket',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$ward',
        total: { $sum: 1 },
        open: {
          $sum: {
            $cond: [{ $in: ['$status', ['open', 'in_progress']] }, 1, 0],
          },
        },
        resolved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
          },
        },
        avgTimeMs: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'resolved'] },
                  { $ne: ['$ticket.completedAt', null] },
                  { $ne: ['$ticket.completedAt', undefined] },
                ],
              },
              { $subtract: ['$ticket.completedAt', '$createdAt'] },
              null,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        ward: '$_id',
        total: 1,
        open: 1,
        resolved: 1,
        avgResolutionTimeHours: {
          $cond: [
            { $ne: ['$avgTimeMs', null] },
            { $divide: ['$avgTimeMs', 1000 * 60 * 60] },
            0,
          ],
        },
      },
    },
    { $sort: { ward: 1 } },
  ]);

  const redisClient = getRedis();
  await redisClient.set('stats:by_ward', JSON.stringify(stats), 'EX', 60 * 60); // 1h TTL

  console.log(`[Stats Aggregator] Aggregated ward stats for ${stats.length} wards.`);
  return stats;
}

export async function aggregateSummaryStats() {
  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalReports,
    thisMonthReports,
    statusDistribution,
    severityDistribution,
    avgTimeAgg,
    activeCrew,
    slaBreaches
  ] = await Promise.all([
    Report.countDocuments({ isDeleted: false }),
    Report.countDocuments({ isDeleted: false, createdAt: { $gte: startOfMonth } }),
    Report.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Report.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    Ticket.aggregate([
      { $match: { completedAt: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'reports',
          localField: 'reportId',
          foreignField: '_id',
          as: 'report'
        }
      },
      { $unwind: '$report' },
      {
        $group: {
          _id: null,
          avgTimeMs: { $avg: { $subtract: ['$completedAt', '$report.createdAt'] } }
        }
      }
    ]),
    User.countDocuments({ role: UserRole.CREW, isActive: true }),
    Ticket.countDocuments({ slaBreached: true })
  ]);

  const statusFormatted = statusDistribution.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const severityFormatted = severityDistribution.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const avgResolutionTimeHours = avgTimeAgg[0]?.avgTimeMs
    ? avgTimeAgg[0].avgTimeMs / (1000 * 60 * 60)
    : 0;

  const stats = {
    totalReports,
    thisMonthReports,
    statusDistribution: statusFormatted,
    severityDistribution: severityFormatted,
    avgResolutionTimeHours,
    activeCrew,
    slaBreaches
  };

  const redisClient = getRedis();
  await redisClient.set('stats:summary', JSON.stringify(stats), 'EX', 30 * 60); // 30min TTL

  console.log('[Stats Aggregator] Aggregated summary stats.');
  return stats;
}
