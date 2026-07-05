export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket, Notification } from '@/models';
import {
  ApiResponse,
  UserRole,
  TicketStatus,
  ReportStatus,
  NotificationType,
} from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { Types } from 'mongoose';
import { emitTicketStatusChange, emitNewNotification, emitReportStatusChange } from '@/lib/socket/emitters';

const TICKET_TO_REPORT_STATUS: Partial<Record<TicketStatus, ReportStatus>> = {
  [TicketStatus.ASSIGNED]:    ReportStatus.IN_PROGRESS,
  [TicketStatus.DISPATCHED]:  ReportStatus.IN_PROGRESS,
  [TicketStatus.EN_ROUTE]:    ReportStatus.IN_PROGRESS,
  [TicketStatus.ACTIVE]:      ReportStatus.IN_PROGRESS,
  [TicketStatus.BLOCKED]:     ReportStatus.UNDER_REVIEW,
  [TicketStatus.COMPLETED]:   ReportStatus.RESOLVED,
  [TicketStatus.CANCELLED]:   ReportStatus.OPEN,
};

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.PENDING]:    [TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
  [TicketStatus.ASSIGNED]:   [TicketStatus.DISPATCHED, TicketStatus.CANCELLED],
  [TicketStatus.DISPATCHED]: [TicketStatus.EN_ROUTE, TicketStatus.BLOCKED, TicketStatus.CANCELLED],
  [TicketStatus.EN_ROUTE]:   [TicketStatus.ACTIVE, TicketStatus.BLOCKED, TicketStatus.CANCELLED],
  [TicketStatus.ACTIVE]:     [TicketStatus.COMPLETED, TicketStatus.BLOCKED, TicketStatus.CANCELLED],
  [TicketStatus.BLOCKED]:    [TicketStatus.ACTIVE, TicketStatus.CANCELLED],
  [TicketStatus.COMPLETED]:  [],
  [TicketStatus.CANCELLED]:  [],
};

// ─── GET /api/crew/tickets/[id] ──────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.CREW, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const query: any = { _id: params.id };
    if (auth.user.role === UserRole.CREW) {
      query.assignedTo = auth.user.userId;
    }

    const ticket = await Ticket.findOne(query)
      .populate('reportId', 'title ticketNumber severity address ward type location photos description status reporterId')
      .populate('assignedBy', 'name email')
      .populate('notes.author', 'name avatar')
      .select('-__v')
      .lean();

    if (!ticket) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket not found or not assigned to you' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: ticket });
  } catch (error) {
    return handleApiError(error, 'Crew Get Ticket');
  }
}

// ─── PATCH /api/crew/tickets/[id] ────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.CREW]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const body = await req.json() as {
      status?: string;
      note?:   string;
    };

    const ticket = await Ticket.findOne({ _id: params.id, assignedTo: auth.user.userId });
    if (!ticket) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket not found or not assigned to you' },
        { status: 404 }
      );
    }

    const report = await Report.findById(ticket.reportId).populate('reporterId', 'name email');
    if (!report) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Associated report not found' },
        { status: 404 }
      );
    }

    // ── Note addition ─────────────────────────────────────────────────────────
    if (body.note?.trim()) {
      ticket.notes.push({
        text:      body.note.trim(),
        author:    new Types.ObjectId(auth.user.userId),
        createdAt: new Date(),
      });
    }

    // ── Status change ─────────────────────────────────────────────────────────
    if (body.status && Object.values(TicketStatus).includes(body.status as TicketStatus)) {
      const newStatus = body.status as TicketStatus;
      const oldStatus = ticket.status as TicketStatus;

      if (newStatus !== oldStatus) {
        // Enforce valid transitions
        const allowedNext = VALID_TRANSITIONS[oldStatus] || [];
        if (!allowedNext.includes(newStatus)) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `Invalid status transition from ${oldStatus} to ${newStatus}` },
            { status: 400 }
          );
        }

        // Require note if blocking
        if (newStatus === TicketStatus.BLOCKED && !body.note?.trim()) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'A note explaining the blockage is required' },
            { status: 400 }
          );
        }

        // Require repair photo if completing
        if (newStatus === TicketStatus.COMPLETED && (!ticket.repairPhotos || ticket.repairPhotos.length === 0)) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'At least one repair photo is required to mark the ticket as completed' },
            { status: 400 }
          );
        }

        ticket.status = newStatus;

        if (newStatus === TicketStatus.ACTIVE && !ticket.startedAt) {
          ticket.startedAt = new Date();
        }
        if (newStatus === TicketStatus.COMPLETED) {
          ticket.completedAt = new Date();
        }

        // Mirror to report
        const mappedReportStatus = TICKET_TO_REPORT_STATUS[newStatus];
        if (mappedReportStatus) {
          report.status = mappedReportStatus;
          await report.save();
        }

        // Notify citizen
        const reporter = report.reporterId as unknown as { _id: string; name: string; email: string };
        const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const notification = await Notification.create({
          userId:   reporter._id,
          type:     newStatus === TicketStatus.COMPLETED ? NotificationType.REPORT_RESOLVED : NotificationType.REPORT_UPDATED,
          title:    newStatus === TicketStatus.COMPLETED ? `Report Resolved: ${report.ticketNumber}` : `Report Update: ${report.ticketNumber}`,
          body:     `Your report "${report.title}" is now: ${statusLabel}.`,
          reportId: report._id,
        });

        // ── Emit Socket Events ────────────────────────────────────────────────────
        emitTicketStatusChange(String(report._id), auth.user.userId, newStatus);
        emitNewNotification(reporter._id.toString(), notification);
        if (mappedReportStatus) {
           emitReportStatusChange(String(report._id), mappedReportStatus, report.ticketNumber);
        }
      }
    }

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('reportId', 'title ticketNumber severity address ward type location photos description status reporterId')
      .populate('assignedBy', 'name')
      .populate('notes.author', 'name avatar')
      .select('-__v')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Ticket updated successfully',
      data: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Crew Update Ticket');
  }
}
