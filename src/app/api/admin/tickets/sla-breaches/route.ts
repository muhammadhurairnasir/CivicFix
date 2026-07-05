export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models';
import { ApiResponse, UserRole, TicketStatus } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

const EARLY_WARNING_HOURS = 2;

// ─── GET /api/admin/tickets/sla-breaches ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const now = new Date();
    const warningThreshold = new Date(now.getTime() + EARLY_WARNING_HOURS * 60 * 60 * 1000);

    const activeStatuses = [
      TicketStatus.PENDING,
      TicketStatus.ASSIGNED,
      TicketStatus.DISPATCHED,
      TicketStatus.EN_ROUTE,
      TicketStatus.ACTIVE,
      TicketStatus.BLOCKED,
    ] as string[];

    // ── Breached tickets (deadline already passed) ────────────────────────────
    const breachedTickets = await Ticket.find({
      slaDeadline: { $lt: now },
      status:      { $in: activeStatuses },
    })
      .populate('reportId',   'title ticketNumber severity address ward status reporterId')
      .populate('assignedTo', 'name avatar email')
      .populate('assignedBy', 'name')
      .select('-__v')
      .lean();

    // Add hoursOverdue virtual
    const enrichedBreached = breachedTickets
      .map((t) => ({
        ...t,
        hoursOverdue: parseFloat(
          ((now.getTime() - new Date(t.slaDeadline).getTime()) / (1000 * 60 * 60)).toFixed(1)
        ),
      }))
      // Sort by most overdue first
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue);

    // ── Early warning tickets (deadline within next 2 hours) ──────────────────
    const earlyWarningTickets = await Ticket.find({
      slaDeadline: { $gte: now, $lte: warningThreshold },
      status:      { $in: activeStatuses },
    })
      .populate('reportId',   'title ticketNumber severity address ward')
      .populate('assignedTo', 'name avatar')
      .select('-__v')
      .lean();

    const enrichedWarning = earlyWarningTickets.map((t) => ({
      ...t,
      hoursRemaining: parseFloat(
        ((new Date(t.slaDeadline).getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(1)
      ),
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        breached: {
          count: enrichedBreached.length,
          tickets: enrichedBreached,
        },
        earlyWarning: {
          count: enrichedWarning.length,
          withinHours: EARLY_WARNING_HOURS,
          tickets: enrichedWarning,
        },
        summary: {
          totalAtRisk: enrichedBreached.length + enrichedWarning.length,
          generatedAt: now.toISOString(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error, 'Admin SLA Breaches');
  }
}
