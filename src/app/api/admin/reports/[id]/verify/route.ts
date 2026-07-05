export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report } from '@/models';
import { ApiResponse, UserRole } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

// ─── PATCH /api/admin/reports/[id]/verify ─────────────────────────────────────

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

    const report = await Report.findOne({ _id: params.id, isDeleted: false });
    if (!report) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Toggle
    report.isVerified = !report.isVerified;
    await report.save();

    const updated = await Report.findById(report._id)
      .populate('reporterId', 'name email avatar')
      .select('-__v')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Report ${report.isVerified ? 'verified' : 'unverified'} successfully`,
      data: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Admin Verify Report');
  }
}
