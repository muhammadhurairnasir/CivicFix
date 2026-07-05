import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { Report } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await User.findById(params.id)
      .select('name avatar role ward createdAt isActive')
      .lean();

    if (!user || !(user as any).isActive) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const [totalReports, resolvedReports] = await Promise.all([
      Report.countDocuments({ reporterId: user._id, isDeleted: false }),
      Report.countDocuments({ reporterId: user._id, isDeleted: false, status: 'resolved' }),
    ]);

    // Recent public reports
    const recentReports = await Report.find({
      reporterId: user._id,
      isDeleted: false,
      status: { $in: ['open', 'under_review', 'in_progress', 'resolved'] },
    })
      .select('title type severity status address ward createdAt upvoteCount')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        id:         user._id.toString(),
        name:       (user as any).name,
        avatar:     (user as any).avatar,
        role:       (user as any).role,
        ward:       (user as any).ward,
        joinedDate: (user as any).createdAt,
        stats: { totalReports, resolvedReports },
        recentReports,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/users/[id]/public]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch public profile' }, { status: 500 });
  }
}
