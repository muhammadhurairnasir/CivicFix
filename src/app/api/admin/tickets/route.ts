export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket, Notification } from '@/models';
import User from '@/models/User';
import {
  ApiResponse,
  PaginatedResponse,
  UserRole,
  TicketPriority,
  TicketStatus,
  ReportStatus,
  NotificationType,
} from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { FilterQuery, SortOrder } from 'mongoose';
import { ITicketDocument } from '@/models/Ticket';
import { notifyTicketAssigned } from '@/lib/notifications';
import { emitTicketAssigned, emitReportStatusChange } from '@/lib/socket/emitters';

// ─── GET /api/admin/tickets ───────────────────────────────────────────────────

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
    const filter: FilterQuery<ITicketDocument> = {};

    const statusParam     = searchParams.get('status');
    const priorityParam   = searchParams.get('priority');
    const assignedTo      = searchParams.get('assignedTo');
    const slaBreached     = searchParams.get('slaBreached');
    const wardParam       = searchParams.get('ward');

    if (statusParam   && Object.values(TicketStatus).includes(statusParam as TicketStatus))
      filter.status = statusParam;
    if (priorityParam && Object.values(TicketPriority).includes(priorityParam as TicketPriority))
      filter.priority = priorityParam;
    if (assignedTo)   filter.assignedTo = assignedTo;
    if (slaBreached !== null) filter.slaBreached = slaBreached === 'true';

    // Ward filter — look up reports in that ward first
    if (wardParam) {
      const wardReports = await Report.find({ ward: { $regex: wardParam, $options: 'i' } }).distinct('_id');
      filter.reportId = { $in: wardReports };
    }

    // ── Query ─────────────────────────────────────────────────────────────────
    const sort: Record<string, SortOrder> = { slaDeadline: 1 }; // most urgent first

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('reportId',   'title ticketNumber severity address ward status')
        .populate('assignedTo', 'name avatar email')
        .populate('assignedBy', 'name')
        .select('-__v')
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<PaginatedResponse<unknown>>({
      success: true,
      data: tickets,
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
    return handleApiError(error, 'Admin List Tickets');
  }
}

// ─── POST /api/admin/tickets ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const body = await req.json() as {
      reportId?: string;
      assignedTo?: string;
      priority?: string;
      estimatedCost?: number;
    };

    // ── Validate required fields ───────────────────────────────────────────────
    if (!body.reportId || !body.assignedTo || !body.priority) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'reportId, assignedTo, and priority are required' },
        { status: 400 }
      );
    }

    if (!Object.values(TicketPriority).includes(body.priority as TicketPriority)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid priority. Allowed: ${Object.values(TicketPriority).join(', ')}` },
        { status: 400 }
      );
    }

    // ── Validate report exists ─────────────────────────────────────────────────
    const report = await Report.findOne({ _id: body.reportId, isDeleted: false })
      .populate('reporterId', 'name email');
    if (!report) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // ── Validate not already ticketed ──────────────────────────────────────────
    const existing = await Ticket.findOne({ reportId: body.reportId });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'A ticket already exists for this report' },
        { status: 409 }
      );
    }

    // ── Validate crew member ───────────────────────────────────────────────────
    const crewMember = await User.findById(body.assignedTo).select('name email role isActive');
    if (!crewMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Crew member not found' },
        { status: 404 }
      );
    }
    if (crewMember.role !== UserRole.CREW) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Assigned user must have role "crew"' },
        { status: 400 }
      );
    }
    if (!crewMember.isActive) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot assign ticket to an inactive crew member' },
        { status: 400 }
      );
    }

    // ── Create ticket (slaDeadline auto-calculated in pre-save hook) ──────────
    const ticket = await Ticket.create({
      reportId:      report._id,
      assignedTo:    crewMember._id,
      assignedBy:    auth.user.userId,
      priority:      body.priority as TicketPriority,
      estimatedCost: body.estimatedCost,
      status:        TicketStatus.ASSIGNED,
    });

    // ── Update report status → in_progress ────────────────────────────────────
    report.status = ReportStatus.IN_PROGRESS;
    await report.save();

    const reporter = report.reporterId as unknown as { _id: string; name: string; email: string };

    // ── Unified Notifications (DB + Socket + Push + Email) ──────────────────────
    await notifyTicketAssigned(
      ticket,
      { _id: String(crewMember._id), name: crewMember.name, email: crewMember.email },
      {
        _id: String(report._id),
        title: report.title,
        ticketNumber: report.ticketNumber,
        address: report.address,
        reporterId: reporter as any,
      }
    );

    // ── Emit Socket Events ────────────────────────────────────────────────────
    emitTicketAssigned(String(crewMember._id), ticket);
    emitReportStatusChange(String(report._id), ReportStatus.IN_PROGRESS, report.ticketNumber);

    // ── Return populated ticket ───────────────────────────────────────────────
    const populated = await Ticket.findById(ticket._id)
      .populate('reportId',   'title ticketNumber severity address ward status')
      .populate('assignedTo', 'name avatar email')
      .populate('assignedBy', 'name')
      .select('-__v')
      .lean();

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Ticket created and crew assigned', data: populated },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, 'Admin Create Ticket');
  }
}
