export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket, Notification } from '@/models';
import User from '@/models/User';
import { ApiResponse, UserRole, NotificationType } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { Types } from 'mongoose';

// ─── PATCH /api/admin/tickets/[id]/reassign ───────────────────────────────────

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

    const body = await req.json() as { assignedTo?: string; reason?: string };

    if (!body.assignedTo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'assignedTo is required' },
        { status: 400 }
      );
    }

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const report = await Report.findById(ticket.reportId)
      .populate('reporterId', 'name email');
    if (!report) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Associated report not found' },
        { status: 404 }
      );
    }

    // ── Validate new crew member ───────────────────────────────────────────────
    const newCrew = await User.findById(body.assignedTo).select('name email role isActive');
    if (!newCrew) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Crew member not found' },
        { status: 404 }
      );
    }
    if (newCrew.role !== UserRole.CREW) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Assigned user must have role "crew"' },
        { status: 400 }
      );
    }
    if (!newCrew.isActive) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot assign to an inactive crew member' },
        { status: 400 }
      );
    }
    if (body.assignedTo === ticket.assignedTo?.toString()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket is already assigned to this crew member' },
        { status: 400 }
      );
    }

    const oldCrewId = ticket.assignedTo;
    ticket.assignedTo = new Types.ObjectId(body.assignedTo);

    // ── Audit note ────────────────────────────────────────────────────────────
    const noteText = body.reason
      ? `Reassigned to ${newCrew.name}. Reason: ${body.reason}`
      : `Reassigned to ${newCrew.name} by admin.`;

    ticket.notes.push({
      text:      noteText,
      author:    new Types.ObjectId(auth.user.userId),
      createdAt: new Date(),
    });

    await ticket.save();

    const reporter = report.reporterId as unknown as { _id: string; name: string; email: string };

    // ── Notifications ─────────────────────────────────────────────────────────
    const notifyOps = [
      // New crew notification
      Notification.create({
        userId:   newCrew._id,
        type:     NotificationType.TICKET_ASSIGNED,
        title:    `Ticket Assigned: ${report.ticketNumber}`,
        body:     `You have been assigned to "${report.title}" at ${report.address}.`,
        reportId: report._id,
      }),
      // Citizen notification
      Notification.create({
        userId:   reporter._id,
        type:     NotificationType.REPORT_UPDATED,
        title:    `Crew Updated: ${report.ticketNumber}`,
        body:     `The maintenance crew on your report "${report.title}" has been updated.`,
        reportId: report._id,
      }),
    ];

    // Old crew notification (if there was one)
    if (oldCrewId) {
      notifyOps.push(
        Notification.create({
          userId:   oldCrewId,
          type:     NotificationType.SYSTEM,
          title:    `Removed from Ticket: ${report.ticketNumber}`,
          body:     `You have been removed from ticket "${report.title}".${body.reason ? ` Reason: ${body.reason}` : ''}`,
          reportId: report._id,
        })
      );
    }

    await Promise.all(notifyOps);

    const updated = await Ticket.findById(ticket._id)
      .populate('reportId',   'title ticketNumber severity address ward status')
      .populate('assignedTo', 'name avatar email')
      .populate('assignedBy', 'name')
      .select('-__v')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Ticket reassigned to ${newCrew.name}`,
      data: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Admin Reassign Ticket');
  }
}
