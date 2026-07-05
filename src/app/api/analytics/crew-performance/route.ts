export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models';
import { ApiResponse, UserRole } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

// ─── GET /api/analytics/crew-performance ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const stats = await Ticket.aggregate([
      // Only tickets that have been assigned to someone
      { $match: { assignedTo: { $exists: true, $ne: null } } },

      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          slaBreachedCount: {
            $sum: { $cond: [{ $eq: ['$slaBreached', true] }, 1, 0] },
          },
          // Average completion time only for completed tickets
          avgCompletionMs: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $ne: ['$completedAt', null] },
                  ],
                },
                { $subtract: ['$completedAt', '$createdAt'] },
                null,
              ],
            },
          },
        },
      },

      // Compute derived fields
      {
        $addFields: {
          // Among completed tickets, how many had no breach?
          onTimeCompleted: { $subtract: ['$completedCount', '$slaBreachedCount'] },
          // slaComplianceRate: protect against division by zero
          slaComplianceRate: {
            $cond: [
              { $gt: ['$completedCount', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$completedCount', '$slaBreachedCount'] },
                      '$completedCount',
                    ],
                  },
                  100,
                ],
              },
              null, // null = no completed tickets yet
            ],
          },
          avgCompletionHours: {
            $cond: [
              { $ne: ['$avgCompletionMs', null] },
              { $divide: ['$avgCompletionMs', 3600000] },
              null,
            ],
          },
        },
      },

      // Populate crew member details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'crewMember',
        },
      },
      { $unwind: '$crewMember' },

      // Sort by compliance rate desc (nulls last)
      {
        $sort: {
          slaComplianceRate: -1,
          completedCount: -1,
        },
      },

      {
        $project: {
          _id: 0,
          crewMemberId: '$_id',
          name: '$crewMember.name',
          avatar: '$crewMember.avatar',
          email: '$crewMember.email',
          totalAssigned: 1,
          completedCount: 1,
          slaBreachedCount: 1,
          onTimeCompleted: 1,
          slaComplianceRate: {
            $cond: [
              { $ne: ['$slaComplianceRate', null] },
              { $round: ['$slaComplianceRate', 1] },
              null,
            ],
          },
          avgCompletionHours: {
            $cond: [
              { $ne: ['$avgCompletionHours', null] },
              { $round: ['$avgCompletionHours', 1] },
              null,
            ],
          },
        },
      },
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleApiError(error, 'Analytics Crew Performance');
  }
}
