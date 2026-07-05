export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket } from '@/models';
import { ApiResponse, PaginatedResponse, UserRole, ReportStatus, ReportType, Severity } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { FilterQuery, SortOrder, Types } from 'mongoose';
import { IReportDocument } from '@/models/Report';

// ─── GET /api/admin/reports ───────────────────────────────────────────────────

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
    const filter: FilterQuery<IReportDocument> = { isDeleted: false };

    const status   = searchParams.get('status');
    const severity = searchParams.get('severity');
    const type     = searchParams.get('type');
    const ward     = searchParams.get('ward');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');
    const search   = searchParams.get('search');
    const isVerifiedParam = searchParams.get('isVerified');
    const hasTicketParam  = searchParams.get('hasTicket');

    if (status   && Object.values(ReportStatus).includes(status as ReportStatus))   filter.status   = status;
    if (severity && Object.values(Severity).includes(severity as Severity))         filter.severity = severity;
    if (type     && Object.values(ReportType).includes(type as ReportType))         filter.type     = type;
    if (ward)    filter.ward = { $regex: ward, $options: 'i' };
    if (isVerifiedParam !== null) filter.isVerified = isVerifiedParam === 'true';

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { title:        { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { address:      { $regex: search, $options: 'i' } },
      ];
    }

    // ── hasTicket filter — resolve reportIds that already have tickets ─────────
    if (hasTicketParam !== null) {
      const ticketReportIds = await Ticket.distinct('reportId');
      if (hasTicketParam === 'true') {
        filter._id = { $in: ticketReportIds };
      } else {
        filter._id = { $nin: ticketReportIds };
      }
    }

    // ── Sort ──────────────────────────────────────────────────────────────────
    const sortBy    = searchParams.get('sortBy')    ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';
    const allowedSorts = ['createdAt', 'upvoteCount', 'severity', 'status'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const sort: Record<string, SortOrder> = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // ── Query ─────────────────────────────────────────────────────────────────
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('reporterId', 'name email avatar')
        .select('-__v')
        .lean(),
      Report.countDocuments(filter),
    ]);

    // ── Join Tickets ──────────────────────────────────────────────────────────
    const reportIds = reports.map((r) => (r as unknown as { _id: Types.ObjectId })._id);
    const tickets   = await Ticket.find({ reportId: { $in: reportIds } })
      .populate('assignedTo', 'name avatar')
      .select('reportId status priority slaDeadline slaBreached assignedTo')
      .lean();

    const ticketMap = new Map(
      tickets.map((t) => [(t.reportId as unknown as Types.ObjectId).toString(), t])
    );

    const enriched = reports.map((r) => ({
      ...r,
      ticket: ticketMap.get((r as unknown as { _id: Types.ObjectId })._id.toString()) ?? null,
    }));

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
    return handleApiError(error, 'Admin Reports Queue');
  }
}
