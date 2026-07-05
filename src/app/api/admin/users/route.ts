export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket } from '@/models';
import User from '@/models/User';
import { ApiResponse, PaginatedResponse, UserRole } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { FilterQuery } from 'mongoose';
import { IUserDocument } from '@/models/User';

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // ── Pagination ────────────────────────────────────────────────────────────
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip  = (page - 1) * limit;

    // ── Filters ───────────────────────────────────────────────────────────────
    const filter: FilterQuery<IUserDocument> = {};

    const roleParam       = searchParams.get('role');
    const isActiveParam   = searchParams.get('isActive');
    const isVerifiedParam = searchParams.get('isVerified');
    const search          = searchParams.get('search');

    const validRoles = Object.values(UserRole);
    if (roleParam && validRoles.includes(roleParam as UserRole)) {
      filter.role = roleParam;
    }
    if (isActiveParam !== null)   filter.isActive   = isActiveParam   === 'true';
    if (isVerifiedParam !== null) filter.isVerified = isVerifiedParam === 'true';

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -refreshTokenHash -__v')
        .lean(),
      User.countDocuments(filter),
    ]);

    // ── Per-user stats ────────────────────────────────────────────────────────
    const userIds = users.map((u) => u._id);

    const [reportCounts, ticketCounts] = await Promise.all([
      // Reports submitted by each user
      Report.aggregate([
        { $match: { reporterId: { $in: userIds }, isDeleted: false } },
        { $group: { _id: '$reporterId', count: { $sum: 1 } } },
      ]),
      // Completed tickets for crew members
      Ticket.aggregate([
        { $match: { assignedTo: { $in: userIds }, status: 'completed' } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      ]),
    ]);

    const reportCountMap = new Map<string, number>(
      (reportCounts as { _id: { toString(): string }; count: number }[]).map((r) => [r._id.toString(), r.count])
    );
    const ticketCountMap = new Map<string, number>(
      (ticketCounts as { _id: { toString(): string }; count: number }[]).map((t) => [t._id.toString(), t.count])
    );

    const enriched = users.map((u) => {
      const id = (u._id as { toString(): string }).toString();
      return {
        ...u,
        stats: {
          reportsSubmitted:  reportCountMap.get(id) ?? 0,
          ticketsCompleted:  ticketCountMap.get(id) ?? 0,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<PaginatedResponse<unknown>>({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Admin List Users');
  }
}
