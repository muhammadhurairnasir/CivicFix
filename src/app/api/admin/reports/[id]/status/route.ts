export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Comment, Notification } from '@/models';
import { ApiResponse, UserRole, ReportStatus, NotificationType } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { sendStatusUpdateEmail } from '@/lib/email';
import User from '@/models/User';

// ─── PATCH /api/admin/reports/[id]/status ─────────────────────────────────────

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

    const body = await req.json() as { status?: string; note?: string };

    // ── Validate status ───────────────────────────────────────────────────────
    if (!body.status || !Object.values(ReportStatus).includes(body.status as ReportStatus)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Invalid status. Allowed: ${Object.values(ReportStatus).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const newStatus = body.status as ReportStatus;

    const report = await Report.findOne({ _id: params.id, isDeleted: false })
      .populate('reporterId', 'name email');
    if (!report) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const oldStatus = report.status;
    report.status = newStatus;
    await report.save();

    const reporter = report.reporterId as unknown as { _id: string; name: string; email: string };

    // ── Optional official comment ─────────────────────────────────────────────
    if (body.note?.trim()) {
      await Comment.create({
        reportId: report._id,
        authorId: auth.user.userId,
        text: body.note.trim(),
        isOfficial: true,
      });
    }

    // ── In-app notification ───────────────────────────────────────────────────
    const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    await Notification.create({
      userId:   reporter._id,
      type:     NotificationType.REPORT_UPDATED,
      title:    `Report Status Changed: ${report.ticketNumber}`,
      body:     `Your report "${report.title}" status has changed from ${oldStatus.replace(/_/g, ' ')} to ${statusLabel}.`,
      reportId: report._id,
    });

    // ── Email (fire-and-forget — don't fail request on email error) ───────────
    sendStatusUpdateEmail(reporter.email, reporter.name, report.ticketNumber, newStatus).catch(
      (err) => console.error('[Admin Status] Email error:', err)
    );

    const updated = await Report.findById(report._id)
      .populate('reporterId', 'name email avatar')
      .select('-__v')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Report status updated to "${newStatus}"`,
      data: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Admin Update Report Status');
  }
}
