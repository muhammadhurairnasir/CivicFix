export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Ticket } from '@/models';
import { ApiResponse } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const userId = auth.user.userId;

    const [total, resolved, pending] = await Promise.all([
      Report.countDocuments({ reporterId: userId, isDeleted: false }),
      Report.countDocuments({ reporterId: userId, isDeleted: false, status: 'resolved' }),
      Report.countDocuments({ reporterId: userId, isDeleted: false, status: { $in: ['open', 'in_progress'] } }) // note: ticket 'assigned' maps to report 'in_progress' or 'open' depending on logic, but we'll use open/in_progress
    ]);

    // Calculate average resolution time for resolved reports
    const resolvedReports = await Report.find({ reporterId: userId, isDeleted: false, status: 'resolved' }).select('_id createdAt').lean();
    let avgResolutionTimeHours = 0;
    
    if (resolvedReports.length > 0) {
      const reportIds = resolvedReports.map(r => r._id);
      const tickets = await Ticket.find({ reportId: { $in: reportIds }, status: 'completed', completedAt: { $exists: true } }).select('reportId completedAt').lean();
      
      let totalMs = 0;
      let validCount = 0;

      for (const report of resolvedReports) {
        const ticket = tickets.find(t => t.reportId.toString() === report._id.toString());
        if (ticket && ticket.completedAt) {
          const resolveTime = new Date(ticket.completedAt).getTime() - new Date(report.createdAt).getTime();
          if (resolveTime > 0) {
            totalMs += resolveTime;
            validCount++;
          }
        }
      }

      if (validCount > 0) {
        avgResolutionTimeHours = (totalMs / validCount) / (1000 * 60 * 60);
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        total,
        resolved,
        pending,
        avgResolutionTimeHours
      }
    });

  } catch (error) {
    return handleApiError(error, 'GET My Report Stats API');
  }
}
