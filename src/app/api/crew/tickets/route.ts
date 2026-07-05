export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models';
import { ApiResponse, UserRole, TicketStatus } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

// ─── GET /api/crew/tickets ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.CREW, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusParam      = searchParams.get('status');
    const priorityParam    = searchParams.get('priority');
    const slaBreachedParam = searchParams.get('slaBreached');

    // Build query to only fetch tickets assigned to the logged-in crew member
    const query: any = { assignedTo: auth.user.userId };

    if (statusParam) {
      if (statusParam === 'active') {
        query.status = { 
          $in: [
            TicketStatus.ASSIGNED, 
            TicketStatus.DISPATCHED, 
            TicketStatus.EN_ROUTE, 
            TicketStatus.ACTIVE
          ] 
        };
      } else {
        query.status = statusParam;
      }
    }
    if (priorityParam) {
      query.priority = priorityParam;
    }
    if (slaBreachedParam === 'true') {
      query.slaBreached = true;
    } else if (slaBreachedParam === 'false') {
      query.slaBreached = false;
    }

    // Default sort: SLA deadline ascending (most urgent first)
    const sort = { slaDeadline: 1 };

    const tickets = await Ticket.find(query)
      .populate('reportId', 'title ticketNumber severity address ward type location photos')
      .populate('assignedBy', 'name')
      .sort(sort as any)
      .select('-__v')
      .lean();

    // Enrich with SLA hours remaining/overdue for convenience
    const now = new Date().getTime();
    const enrichedTickets = tickets.map((t) => {
      const deadline = new Date(t.slaDeadline).getTime();
      const isOverdue = now > deadline && t.status !== TicketStatus.COMPLETED;
      const hoursDiff = parseFloat((Math.abs(deadline - now) / (1000 * 60 * 60)).toFixed(1));
      
      return {
        ...t,
        slaStatus: isOverdue ? 'breached' : ((deadline - now) < (2 * 60 * 60 * 1000) ? 'at_risk' : 'on_track'),
        hoursRemaining: isOverdue ? 0 : hoursDiff,
        hoursOverdue: isOverdue ? hoursDiff : 0,
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: enrichedTickets,
    });
  } catch (error) {
    return handleApiError(error, 'Crew Get Tickets');
  }
}
