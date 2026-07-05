export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket } from '@/models';
import { ApiResponse, PaginatedResponse } from '@/types';
import { reportQuerySchema } from '@/lib/validations/report';
import { FilterQuery, SortOrder } from 'mongoose';
import { IReportDocument } from '@/models/Report';
import { handleApiError } from '@/lib/apiHelpers';

// ─── GET /api/reports/my ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());

    const parsedQuery = reportQuerySchema.safeParse(queryObj);
    if (!parsedQuery.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid query parameters', errors: parsedQuery.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const { page, limit, status, severity, type, ward, sortBy, sortOrder, search } = parsedQuery.data;

    const filter: FilterQuery<IReportDocument> = { 
      isDeleted: false,
      reporterId: auth.user.userId,
    };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (ward) filter.ward = ward;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, SortOrder> = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('reporterId', 'name avatar role')
        .lean(),
      Report.countDocuments(filter)
    ]);

    // Fetch associated tickets
    const reportIds = reports.map(r => r._id);
    const tickets = await Ticket.find({ reportId: { $in: reportIds } })
      .select('reportId status priority assignedTo')
      .populate('assignedTo', 'name avatar')
      .lean();

    // Map tickets to reports
    const ticketMap = new Map(tickets.map(t => [t.reportId.toString(), t]));

    const enrichedReports = reports.map(report => ({
      ...report,
      ticket: ticketMap.get(report._id.toString()) || null,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<PaginatedResponse<unknown>>({
      success: true,
      data: enrichedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, 'GET My Reports API');
  }
}
