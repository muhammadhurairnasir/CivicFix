export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket, Notification } from '@/models';
import User from '@/models/User';
import {
  ApiResponse,
  UserRole,
  TicketPriority,
  TicketStatus,
  ReportStatus,
  NotificationType,
} from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { Types } from 'mongoose';

// ── Status → Report status mapping ────────────────────────────────────────────
const TICKET_TO_REPORT_STATUS: Partial<Record<TicketStatus, ReportStatus>> = {
  [TicketStatus.ASSIGNED]:    ReportStatus.IN_PROGRESS,
  [TicketStatus.DISPATCHED]:  ReportStatus.IN_PROGRESS,
  [TicketStatus.EN_ROUTE]:    ReportStatus.IN_PROGRESS,
  [TicketStatus.ACTIVE]:      ReportStatus.IN_PROGRESS,
  [TicketStatus.BLOCKED]:     ReportStatus.UNDER_REVIEW,
  [TicketStatus.COMPLETED]:   ReportStatus.RESOLVED,
  [TicketStatus.CANCELLED]:   ReportStatus.OPEN,
};

// ─── GET /api/admin/tickets/[id] ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const ticket = await Ticket.findById(params.id)
      .populate('reportId',   'title ticketNumber severity address ward status reporterId')
      .populate('assignedTo', 'name avatar email role')
      .populate('assignedBy', 'name email')
      .select('-__v')
      .lean();

    if (!ticket) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: ticket });
  } catch (error) {
    return handleApiError(error, 'Admin Get Ticket');
  }
}

// ─── PATCH /api/admin/tickets/[id] ───────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const body = await req.json() as {
      assignedTo?:    string;
      priority?:      string;
      estimatedCost?: number;
      status?:        string;
      note?:          string;
    };

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket not found' },
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

    // ── Re-assign ─────────────────────────────────────────────────────────────
    if (body.assignedTo && body.assignedTo !== ticket.assignedTo?.toString()) {
      const newCrew = await User.findById(body.assignedTo).select('name email role isActive');
      if (!newCrew || newCrew.role !== UserRole.CREW || !newCrew.isActive) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid or inactive crew member' },
          { status: 400 }
        );
      }

      const oldCrewId = ticket.assignedTo;

      // Notify old crew member
      if (oldCrewId) {
        await Notification.create({
          userId:   oldCrewId,
          type:     NotificationType.SYSTEM,
          title:    `Ticket Reassigned: ${report.ticketNumber}`,
          body:     `You have been removed from ticket "${report.title}". It has been reassigned.`,
          reportId: report._id,
        });
      }

      // Notify new crew member
      await Notification.create({
        userId:   newCrew._id,
        type:     NotificationType.TICKET_ASSIGNED,
        title:    `Ticket Assigned: ${report.ticketNumber}`,
        body:     `You have been assigned to "${report.title}" at ${report.address}.`,
        reportId: report._id,
      });

      ticket.assignedTo = new Types.ObjectId(body.assignedTo);
    }

    // ── Priority change ───────────────────────────────────────────────────────
    if (body.priority && Object.values(TicketPriority).includes(body.priority as TicketPriority)) {
      ticket.priority = body.priority as TicketPriority;
      // Note: the pre-save hook recalculates slaDeadline on priority change
    }

    // ── Estimated cost ────────────────────────────────────────────────────────
    if (typeof body.estimatedCost === 'number') {
      ticket.estimatedCost = body.estimatedCost;
    }

    // ── Status change ─────────────────────────────────────────────────────────
    if (body.status && Object.values(TicketStatus).includes(body.status as TicketStatus)) {
      const newTicketStatus = body.status as TicketStatus;
      ticket.status = newTicketStatus;

      if (newTicketStatus === TicketStatus.ACTIVE && !ticket.startedAt) {
        ticket.startedAt = new Date();
      }
      if (newTicketStatus === TicketStatus.COMPLETED) {
        ticket.completedAt = new Date();
      }

      // Mirror to report
      const mappedReportStatus = TICKET_TO_REPORT_STATUS[newTicketStatus];
      if (mappedReportStatus) {
        report.status = mappedReportStatus;
        await report.save();
      }

      // Notify citizen
      const reporter = report.reporterId as unknown as { _id: string; name: string; email: string };
      const statusLabel = newTicketStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await Notification.create({
        userId:   reporter._id,
        type:     NotificationType.REPORT_UPDATED,
        title:    `Report Update: ${report.ticketNumber}`,
        body:     `Your report "${report.title}" is now: ${statusLabel}.`,
        reportId: report._id,
      });
    }

    // ── Add note ──────────────────────────────────────────────────────────────
    if (body.note?.trim()) {
      ticket.notes.push({
        text:      body.note.trim(),
        author:    new Types.ObjectId(auth.user.userId),
        createdAt: new Date(),
      });
    }

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('reportId',   'title ticketNumber severity address ward status')
      .populate('assignedTo', 'name avatar email')
      .populate('assignedBy', 'name')
      .select('-__v')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Ticket updated successfully',
      data: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Admin Update Ticket');
  }
}
